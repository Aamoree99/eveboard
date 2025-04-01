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

const WITHDRAW_FEE_PERCENT = 10;

@Injectable()
export class TransactionService {
    constructor(private readonly prisma: PrismaService) {}

    /**
     * Create a deposit transaction (awaiting confirmation via ESI)
     */
    async createDeposit(userId: string, dto: CreateDepositDto) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new NotFoundException('User not found');

        const reason = `EVEBOARD:${dto.reference || user.name}`;

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
            data: transactions,
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
        const reason = `EVEBOARD_WITHDRAW:${randomUUID()}`;

        const transaction = await this.prisma.transaction.create({
            data: {
                userId,
                amount: payout,
                reason,
                type: TransactionType.WITHDRAWAL,
                confirmed: false,
            },
        });

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
        const tx = await this.prisma.transaction.findUnique({ where: { id: txId } });

        if (!tx || tx.type !== 'WITHDRAWAL') {
            throw new NotFoundException('Withdrawal transaction not found');
        }

        if (tx.confirmed) {
            throw new BadRequestException('Cannot cancel a confirmed withdrawal');
        }

        await this.prisma.transaction.delete({ where: { id: txId } });

        return success('Withdrawal request cancelled. No ISK was deducted.');
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

}
