import {
    Injectable,
    NotFoundException,
    BadRequestException, ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDepositDto } from './dto/create-deposit.dto';
import { TransactionType } from '@prisma/client';
import { success } from '../common/response';
import { randomUUID } from 'crypto';
import {GetTransactionQueryDto} from "./dto/GetTransactionQueryDto";
import {sendDM, sendToWithdrawChannel} from "../discordBot";

const WITHDRAW_FEE_PERCENT = 10;

interface CorpTransactionDto {
    id: string;
    amount: number;
    balanceAfter: number;
    date: string;
    type: 'Deposit from player' | 'Withdrawal to player';
}

interface CorpBalanceResponse {
    currentBalance: number;
    lockedBalance: number;
    transactions: CorpTransactionDto[];
}

@Injectable()
export class TransactionService {
    constructor(private readonly prisma: PrismaService) {}

    /**
     * Create a deposit transaction (awaiting confirmation via ESI)
     */
    async createDeposit(userId: string, dto: CreateDepositDto) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new NotFoundException('User not found');

        const reason = `EVEBOARD:${dto.reference || user.name}-${Math.floor(Math.random() * 1000000)}`;


        const transaction = await this.prisma.transaction.create({
            data: {
                userId,
                amount: dto.amount,
                reason,
                type: TransactionType.DEPOSIT,
                confirmed: false,
            },
        });

        return success(
            'Deposit request created. Use this reason when sending ISK.',
            transaction,
        );
    }

    /**
     * Get user's full transaction history
     */
    async getUserTransactions(userId: string, query: GetTransactionQueryDto) {
        const { page = 1, limit = 20 } = query;
        const skip = (page - 1) * limit;

        const [transactions, total] = await this.prisma.$transaction([
            this.prisma.transaction.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.transaction.count({
                where: { userId },
            }),
        ]);
        return success('User transaction history', {
            total,
            page,
            limit,
            data: transactions.map((tx) => ({
                ...tx,
                createdAt: tx.createdAt.toISOString(),
            })),
        });
    }

    /**
     * Request a withdrawal (awaiting confirmation via ESI or manually)
     */
    async requestWithdraw(userId: string, amount: number) {
        if (amount < 1) {
            throw new BadRequestException('Invalid withdrawal amount');
        }

        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new NotFoundException('User not found');
        if (user.balance < amount) {
            throw new BadRequestException('Insufficient balance');
        }

        const fee = Math.ceil((amount * WITHDRAW_FEE_PERCENT) / 100);
        const payout = amount - fee;
        const reason = `WD:${randomUUID().split('-')[0]}`;

        const transaction = await this.prisma.transaction.create({
            data: {
                userId,
                amount: payout,
                reason,
                type: TransactionType.WITHDRAWAL,
                confirmed: false,
            },
        });

        await this.prisma.user.update({
            where: { id: userId },
            data: {
                balance: {
                    decrement: amount,
                },
            },
        });


        const msg =
            `💸 **Запрос на вывод средств**\n` +
            `👤 Пользователь: \`${user.name}\`\n` +
            `💰 Сумма: \`${amount} ISK\`\n` +
            `📉 Комиссия: \`${fee} ISK\`\n` +
            `📤 Выплата: \`${payout} ISK\`\n` +
            `🧾 Причина: \`${reason}\`\n` +
            `🆔 Транзакция: \`${transaction.id}\``;

        await sendToWithdrawChannel(msg);

        console.log('[requestWithdraw] Возвращаем клиенту:', {
            transactionId: transaction.id,
            requestedAmount: amount,
            fee,
            payout,
            reason,
        })

        return success(
            `Withdrawal request created. You'll receive ${payout} ISK (fee: ${fee}) after confirmation.`,
            {
                transactionId: transaction.id,
                requestedAmount: amount,
                fee,
                payout,
                reason,
            },
        );
    }

    /**
     * Manually confirm a withdrawal — used when ISK has been sent
     */
    async confirmWithdrawManually(txId: string, actorCharacterId: string) {
        const MAIN_WALLET_ID = Number(process.env.MAIN_WALLET);
        if (Number(actorCharacterId) !== MAIN_WALLET_ID) {
            throw new ForbiddenException('You are not allowed to confirm withdrawals');
        }

        const tx = await this.prisma.transaction.findUnique({ where: { id: txId } });

        if (!tx || tx.type !== 'WITHDRAWAL') {
            throw new NotFoundException('Withdrawal transaction not found');
        }

        if (tx.confirmed) {
            throw new BadRequestException('Transaction is already confirmed');
        }

        const fullAmount = Math.ceil(tx.amount / (1 - WITHDRAW_FEE_PERCENT / 100));
        const fee = fullAmount - tx.amount;

        const user = await this.prisma.user.findUnique({ where: { id: tx.userId } });
        if (!user || user.balance < fullAmount) {
            throw new BadRequestException('Insufficient balance for confirmation');
        }

        await this.prisma.$transaction([
            this.prisma.user.update({
                where: { id: user.id },
                data: { balance: { decrement: fullAmount } },
            }),
            this.prisma.transaction.update({
                where: { id: txId },
                data: { confirmed: true },
            }),
            this.prisma.transaction.create({
                data: {
                    userId: user.id,
                    amount: fee,
                    reason: 'Withdrawal fee',
                    type: TransactionType.BONUS,
                    confirmed: true,
                },
            }),
        ]);

        return success(
            `Withdrawal confirmed manually. ${tx.amount} ISK sent, ${fee} ISK fee applied.`,
        );
    }

    /**
     * Cancel unconfirmed withdrawal and refund full amount
     */
    async cancelWithdraw(txId: string) {
        const tx = await this.prisma.transaction.findUnique({
            where: { id: txId },
            include: {
                user: true,
            },
        });

        if (!tx || tx.type !== 'WITHDRAWAL') {
            throw new NotFoundException('Withdrawal transaction not found');
        }

        if (tx.confirmed) {
            throw new BadRequestException('Cannot cancel a confirmed withdrawal');
        }

        // Попробуем удалить — если уже удалена, значит была отменена
        const deleted = await this.prisma.transaction.delete({ where: { id: txId } }).catch(() => null);

        if (!deleted) {
            return success('Withdrawal already cancelled. No changes made.');
        }

        const payout = tx.amount;
        const originalAmount = Math.ceil((payout * 100) / (100 - WITHDRAW_FEE_PERCENT));

        await this.prisma.user.update({
            where: { id: tx.userId },
            data: {
                balance: {
                    increment: originalAmount,
                },
            },
        });

        // Отправим сообщение в Discord
        if (tx.user?.discordId) {
            await sendDM(
                tx.user.discordId,
                `❌ Your withdrawal request of **${payout.toLocaleString()} ISK** has been cancelled.\nThe full amount of **${originalAmount.toLocaleString()} ISK** has been refunded to your balance.`
            );
        }

        return success(`Withdrawal cancelled. ${originalAmount} ISK refunded.`);
    }



    async findByUserId(userId: string, page = 1, limit = 20) {
        const where = { userId };

        const [total, items] = await this.prisma.$transaction([
            this.prisma.transaction.count({ where }),
            this.prisma.transaction.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
        ]);

        return {
            message: 'List of transactions',
            data: {
                items,
                total,
                page,
                limit,
                pages: Math.ceil(total / limit),
            },
        };
    }

    async getCorpBalanceData(): Promise<CorpBalanceResponse> {
        const transactions = await this.prisma.corporationTransaction.findMany({
            orderBy: { date: 'desc' },
            take: 10,
        });

        const latest = transactions[0];
        const currentBalance = latest?.balance ?? 0n;

        const formattedTransactions = transactions.map((tx) => ({
            id: tx.id,
            amount: Number(tx.amount),
            balanceAfter: Number(tx.balance),
            date: tx.date.toISOString().slice(0, 19).replace('T', ' '),
            type: (tx.amount > 0 ? 'Deposit from player' : 'Withdrawal to player') as "Deposit from player" | "Withdrawal to player",
        }));


        const [userBalances, activeOrders] = await Promise.all([
            this.prisma.user.aggregate({
                _sum: { balance: true },
            }),
            this.prisma.order.aggregate({
                where: { status: 'ACTIVE' },
                _sum: { price: true },
            }),
        ]);

        const lockedBalance =
            Number(userBalances._sum.balance ?? 0) +
            Number(activeOrders._sum.price ?? 0);

        return {
            currentBalance: Number(currentBalance),
            lockedBalance,
            transactions: formattedTransactions,
        };
    }

    async getPendingWithdrawals() {
        return this.prisma.transaction.findMany({
            where: {
                type: 'WITHDRAWAL',
                confirmed: false,
            },
            orderBy: {
                createdAt: 'asc',
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        balance: true,
                        role: true,
                    },
                },
            },
        });
    }

    async confirmWithdraw(id: string) {
        const tx = await this.prisma.transaction.findUnique({
            where: { id },
            include: {
                user: true,
            },
        });

        if (!tx) {
            throw new NotFoundException('Transaction not found');
        }

        if (tx.type !== 'WITHDRAWAL') {
            throw new BadRequestException('Not a withdrawal transaction');
        }

        if (tx.confirmed) {
            throw new BadRequestException('Transaction already confirmed');
        }

        // Подтверждаем в базе
        await this.prisma.transaction.update({
            where: { id },
            data: {
                confirmed: true,
            },
        });

        // Отправляем DM в Discord (если user.discordId есть)
        if (tx.user.discordId) {
            const payout = tx.amount.toLocaleString();
            try {
                await sendDM(
                    tx.user.discordId,
                    `✅ Your withdrawal request of **${payout} ISK** has been approved. The funds will be transferred shortly.`
                );

            } catch (err) {
                console.error(`[confirmWithdraw] Не удалось отправить DM:`, err);
            }
        }

        return {
            success: true,
            message: `Withdrawal ${id} confirmed.`,
        };
    }

}
