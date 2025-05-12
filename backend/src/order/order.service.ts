import {
    Injectable,
    ForbiddenException,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import {ComplaintReason, OrderStatus} from '@prisma/client';
import { success } from '../common/response';
import { OrderType } from '@prisma/client';
import { detectOne } from 'langdetect'
import {announceNewOrder} from "../discordBot";
import { format } from 'date-fns'
import type { Prisma } from '@prisma/client'

async function detectLanguage(text: string): Promise<string> {
    try {
        const result = await detectOne(text)
        return result || 'unknown'
    } catch {
        return 'unknown'
    }
}

const MAX_COMPLAINTS = 3;

@Injectable()
export class OrderService {
    constructor(private prisma: PrismaService) {}

    async create(dto: CreateOrderDto, creatorId: string) {
        const user = await this.prisma.user.findUnique({ where: { id: creatorId } });
        if (!user) throw new NotFoundException('User not found');

        const isEarlyBird = user.role === 'EARLY_BIRD';
        const now = new Date();

        const baseCost = dto.price;
        const anonFee = dto.isAnonymous ? 50_000_000 : 0;

        let promoFee = 0;
        let isPromoting = false;
        let promotingUntil: Date | undefined;

        if (isEarlyBird) {
            isPromoting = true;
            promotingUntil = dto.deadline ? new Date(dto.deadline) : new Date(now.setFullYear(now.getFullYear() + 10));
        } else if (dto.isPromoting) {
            if (!dto.promotingUntil) {
                throw new BadRequestException('promotingUntil is required when isPromoting is true');
            }

            promotingUntil = new Date(dto.promotingUntil);
            const diffMs = promotingUntil.getTime() - now.getTime();
            const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
            const weeks = Math.ceil(days / 7);

            promoFee = weeks * 100_000_000;
            isPromoting = true;
        }

        const totalCost = baseCost + anonFee + promoFee;

        if (user.balance < totalCost) {
            console.warn('[OrderService] Not enough ISK');
            throw new ForbiddenException('Not enough ISK');
        }

        const detectedLang = await detectLanguage(`${dto.title} ${dto.description}`);
        const minRating = Math.max(user.rating - 1, 0.0);

        const created = await this.prisma.$transaction(async (tx) => {
            await tx.user.update({
                where: { id: creatorId },
                data: { balance: { decrement: totalCost } },
            });

            await tx.transaction.create({
                data: {
                    userId: creatorId,
                    amount: totalCost,
                    reason: `ORDER:${dto.title.slice(0, 30)}${dto.isAnonymous ? ' (anonymous)' : ''}`,
                    type: 'PAYMENT',
                    confirmed: true,
                },
            });

            return tx.order.create({
                data: {
                    title: dto.title,
                    description: dto.description,
                    requirements: dto.requirements,
                    language: detectedLang,
                    price: dto.price,
                    minRating,
                    deadline: dto.deadline ? new Date(dto.deadline) : undefined,
                    type: dto.type,
                    systemId: dto.systemId ?? undefined,
                    creatorId,
                    isAnonymous: dto.isAnonymous ?? false,
                    isPromoting,
                    promotingUntil,
                },
                include: {
                    creator: true,
                    system: true,
                },
            });
        });

        try {
            await announceNewOrder({
                id: created.id,
                type: created.type,
                title: created.title,
                price: created.price,
                deadline: created.deadline?.toString(),
            });
        } catch (err) {
            console.error('❌ Failed to announce order in Discord:', err);
        }

        return success('Order created successfully', created);
    }


    async findAll(
        status?: OrderStatus,
        type?: OrderType,
        userId?: string,
        page = 1,
        limit = 20,
    ) {
        page = Number(page) || 1;
        limit = Number(limit) || 20;

        const where: any = {};

        if (status) where.status = status;
        if (type) where.type = type;
        if (userId) {
            where.OR = [{ creatorId: userId }, { executorId: userId }];
        }

        const [total, items] = await this.prisma.$transaction([
            this.prisma.order.count({ where }),
            this.prisma.order.findMany({
                where,
                include: {
                    creator: true,
                    executor: true,
                    system: true,
                },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
        ]);
        return success('List of orders', {
            items,
            total,
            page,
            limit,
            pages: Math.ceil(total / limit),
        });
    }



    async findById(id: string) {
        const order = await this.prisma.order.findUnique({
            where: { id },
            include: {
                creator: true,
                executor: true,
                system: true,
                reviews: true,
            },
        })

        if (!order) throw new NotFoundException('Order not found')

        // ✅ Преобразуем даты
        const formatDate = (value: Date | null | undefined): string =>
            value ? format(value, 'dd.MM.yyyy') : '—'

        const transformed = {
            ...order,
            createdAt: formatDate(order.createdAt),
            updatedAt: formatDate(order.updatedAt),
            deadline: formatDate(order.deadline),
            reviews: order.reviews.map((r) => ({
                ...r,
                createdAt: formatDate(r.createdAt),
            })),
        }
        return success('Order details', transformed)
    }

    async takeOrder(id: string, executorId: string) {
        const order = await this.prisma.order.findUnique({ where: { id } });
        if (!order) throw new NotFoundException('Order not found');
        if (order.status !== OrderStatus.ACTIVE)
            throw new BadRequestException('Order already taken or completed');

        const updated = await this.prisma.order.update({
            where: { id },
            data: {
                status: OrderStatus.TAKEN,
                executorId,
            },
        });

        return success('Order successfully taken', updated);
    }

    async updateStatus(id: string, status: OrderStatus, userId: string) {
        const order = await this.prisma.order.findUnique({ where: { id } })
        if (!order) throw new NotFoundException('Order not found')

        if (order.creatorId !== userId)
            throw new ForbiddenException('Only the creator can change status')

        if (status === OrderStatus.CANCELED) {
            if (order.status !== OrderStatus.ACTIVE)
                throw new BadRequestException('Only ACTIVE orders can be canceled')

            const refund = Math.floor(order.price * 0.9) // -10% комиссия

            await this.prisma.$transaction([
                this.prisma.user.update({
                    where: { id: userId },
                    data: { balance: { increment: refund } },
                }),
                this.prisma.transaction.create({
                    data: {
                        userId,
                        amount: refund,
                        reason: `REFUND:${order.title.slice(0, 30)}`,
                        type: 'WITHDRAWAL',
                        confirmed: true,
                    },
                }),
                this.prisma.order.update({
                    where: { id },
                    data: { status: OrderStatus.CANCELED },
                }),
            ])

            return success('Order canceled and partial refund sent')
        }

        if (status === OrderStatus.DONE) {
            if (order.status !== OrderStatus.TAKEN)
                throw new BadRequestException('Only TAKEN orders can be marked as done')

            if (!order.executorId)
                throw new BadRequestException('No executor assigned')

            await this.prisma.$transaction([
                this.prisma.user.update({
                    where: { id: order.executorId },
                    data: { balance: { increment: order.price } },
                }),
                this.prisma.transaction.create({
                    data: {
                        userId: order.executorId,
                        amount: order.price,
                        reason: `REWARD:${order.title.slice(0, 30)}`,
                        type: 'REWARD',
                        confirmed: true,
                    },
                }),
                this.prisma.order.update({
                    where: { id },
                    data: { status: OrderStatus.DONE },
                }),
            ])

            return success('Order marked as done and reward sent')
        }

        throw new BadRequestException('Invalid status update')
    }


    async delete(id: string, userId: string) {
        const order = await this.prisma.order.findUnique({ where: { id } });
        if (!order) throw new NotFoundException('Order not found');
        if (order.creatorId !== userId)
            throw new ForbiddenException('Only the creator can delete the order');

        const deleted = await this.prisma.order.delete({ where: { id } });
        return success('Order deleted', deleted);
    }

    async sendMessage(orderId: string, authorId: string, text: string) {
        const order = await this.prisma.order.findUnique({ where: { id: orderId } });
        if (!order) throw new NotFoundException('Order not found');

        const isRelatedUser =
            authorId === order.creatorId || authorId === order.executorId;
        if (!isRelatedUser)
            throw new ForbiddenException('You are not part of this order');

        const message = await this.prisma.orderMessage.create({
            data: {
                orderId,
                authorId,
                text,
            },
        });

        return success('Message sent', message);
    }

    async getMessages(orderId: string) {
        const messages = await this.prisma.orderMessage.findMany({
            where: { orderId },
            include: { author: true },
            orderBy: { createdAt: 'asc' },
        });

        const formattedMessages = messages.map((msg) => ({
            ...msg,
            createdAtFormatted: new Intl.DateTimeFormat('cs-CZ', {
                dateStyle: 'medium',
                timeStyle: 'short',
            }).format(new Date(msg.createdAt)),
        }));
        console.log(formattedMessages);
        return success('List of messages', formattedMessages);
    }

    async complain(
        orderId: string,
        userId: string,
        dto: { reason: ComplaintReason; comment?: string }
    ) {
        const order = await this.prisma.order.findUnique({ where: { id: orderId } });
        if (!order) throw new NotFoundException('Order not found');

        const already = await this.prisma.complaint.findFirst({
            where: { orderId, userId },
        });
        if (already) throw new BadRequestException('You already submitted a complaint');

        await this.prisma.complaint.create({
            data: {
                orderId,
                userId,
                reason: dto.reason,
                comment: dto.comment,
            },
        });

        const total = await this.prisma.complaint.count({ where: { orderId } });
        if (total >= MAX_COMPLAINTS && order.status !== OrderStatus.CANCELED) {
            await this.prisma.order.update({
                where: { id: orderId },
                data: { status: OrderStatus.CANCELED },
            });
        }

        return { success: true, message: 'Complaint submitted' };
    }

    getFormattedOrderTypes(): { value: string, label: string }[] {
        const types = Object.values(OrderType);

        return types.map((value) => ({
            value,
            label: value
                .toLowerCase()
                .replace(/_/g, ' ')
                .replace(/\b\w/g, (l) => l.toUpperCase()),
        }));
    }

    async getPromotedOrders(): Promise<{
    success: true
    message: string
    data: Array<Prisma.OrderGetPayload<{
        include: { creator: true; system: true }
    }>>
    }> {
    const orders = await this.prisma.order.findMany({
        where: {
            isPromoting: true,
            status: 'ACTIVE',
        },
        orderBy: [
            { createdAt: 'asc' },  // older first
            { price: 'desc' },      // then by price descending
        ],
        include: {
            creator: true,
            system: true,
        },
    })

    return {
        success: true,
        message: 'Promoted orders fetched',
        data: orders,
    }
    }

    async getCompletedOrderCount(userId: string): Promise<number> {
        return this.prisma.order.count({
            where: {
                executorId: userId,
                status: 'DONE',
            },
        })
    }
}
