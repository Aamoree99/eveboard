import {
    Injectable,
    NotFoundException,
    ForbiddenException,
    BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewService {
    constructor(private prisma: PrismaService) {}

    async create(orderId: string, authorId: string, dto: CreateReviewDto) {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
        });

        if (!order) throw new NotFoundException('Order not found');
        if (order.status !== 'DONE') throw new BadRequestException('Order not completed');

        const isAllowed = order.creatorId === authorId || order.executorId === authorId;
        if (!isAllowed) throw new ForbiddenException('You are not part of this order');
        const fromId = authorId;
        const alreadyReviewed = await this.prisma.review.findUnique({
            where: {
                orderId_fromId: {
                    orderId,
                    fromId,
                },
            },
        });

        if (alreadyReviewed) throw new BadRequestException('Review already exists for this order');

        const toId = authorId === order.creatorId ? order.executorId : order.creatorId;

        const created = await this.prisma.review.create({
            data: {
                orderId,
                rating: dto.rating,
                text: dto.text,
                fromId: authorId,
                toId: toId!,
            },
        });

        // Обновляем рейтинг пользователя
        await this.recalculateRating(toId!);

        return {
            success: true,
            message: 'Review created',
            data: created,
        };
    }

    async getByUser(userId: string) {
        const list = await this.prisma.review.findMany({
            where: { toId: userId },
            orderBy: { createdAt: 'desc' },
        });

        return {
            success: true,
            message: 'Reviews for user',
            data: list,
        };
    }

    private async recalculateRating(userId: string) {
        const reviews = await this.prisma.review.findMany({
            where: { toId: userId },
        });

        const avg =
            reviews.reduce((sum, r) => sum + r.rating, 0) / (reviews.length || 1);

        await this.prisma.user.update({
            where: { id: userId },
            data: {
                rating: parseFloat(avg.toFixed(2)),
            },
        });
    }
}
