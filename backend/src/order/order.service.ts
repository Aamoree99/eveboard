import {
    Injectable,
    ForbiddenException,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { OrderStatus } from '@prisma/client';
import { success } from '../common/response';

async function detectLanguage(text: string): Promise<string> {
    const { franc } = await import('franc');
    const langs = await import('langs');

    const code = franc(text);
    const lang = langs.where('3', code);
    return lang?.iso639_1 || 'unknown';
}

const MAX_COMPLAINTS = 3;

@Injectable()
export class OrderService {
    constructor(private prisma: PrismaService) {}

    async create(dto: CreateOrderDto, creatorId: string) {
        const user = await this.prisma.user.findUnique({ where: { id: creatorId } });
        if (!user) throw new NotFoundException('User not found');
        if (user.balance < dto.price) throw new ForbiddenException('Not enough ISK');

        const detectedLang = await detectLanguage(`${dto.title} ${dto.description}`);

        const created = await this.prisma.$transaction(async (tx) => {
            await tx.user.update({
                where: { id: creatorId },
                data: { balance: { decrement: dto.price } },
            });

            await tx.transaction.create({
                data: {
                    userId: creatorId,
                    amount: dto.price,
                    reason: `ORDER:${dto.title.slice(0, 30)}`,
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
                    system: dto.system,
                    price: dto.price,
                    deadline: dto.deadline ? new Date(dto.deadline) : undefined,
                    typeId: dto.typeId,
                    creatorId,
                },
            });
        });

        return success('Order created successfully', created);
    }

    async findAll(status?: OrderStatus, typeId?: number) {
        const list = await this.prisma.order.findMany({
            where: {
                ...(status ? { status } : {}),
                ...(typeId ? { typeId } : {}),
            },
            include: {
                type: true,
                creator: true,
                executor: true,
            },
            orderBy: { createdAt: 'desc' },
        });
        return success('List of orders', list);
    }

    async findById(id: string) {
        const order = await this.prisma.order.findUnique({
            where: { id },
            include: {
                type: true,
                creator: true,
                executor: true,
            },
        });
        if (!order) throw new NotFoundException('Order not found');
        return success('Order details', order);
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

    async update(id: string, dto: UpdateOrderDto, userId: string) {
        const order = await this.prisma.order.findUnique({ where: { id } });
        if (!order) throw new NotFoundException('Order not found');
        if (order.creatorId !== userId)
            throw new ForbiddenException('Only the creator can update the order');

        const updated = await this.prisma.order.update({
            where: { id },
            data: {
                ...dto,
                deadline: dto.deadline ? new Date(dto.deadline) : undefined,
            },
        });

        return success('Order updated', updated);
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
        return success('List of messages', messages);
    }

    async complain(orderId: string, userId: string, reason: string) {
        const order = await this.prisma.order.findUnique({ where: { id: orderId } });
        if (!order) throw new NotFoundException('Order not found');

        const already = await this.prisma.complaint.findFirst({
            where: { orderId, userId },
        });
        if (already) throw new BadRequestException('You already submitted a complaint');

        await this.prisma.complaint.create({
            data: { orderId, userId, reason },
        });

        const total = await this.prisma.complaint.count({ where: { orderId } });
        if (total >= MAX_COMPLAINTS && order.status !== 'CANCELED') {
            await this.prisma.order.update({
                where: { id: orderId },
                data: { status: 'CANCELED' },
            });
        }

        return success('Complaint submitted');
    }
}
