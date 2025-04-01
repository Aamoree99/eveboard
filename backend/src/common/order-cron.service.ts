import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service'; // путь поправь под себя
import { OrderStatus } from '@prisma/client';
import {sendToLogChannel} from "../discordBot";

@Injectable()
export class OrderCronService {
    private readonly logger = new Logger(OrderCronService.name);

    constructor(private readonly prisma: PrismaService) {}

    @Cron('0 11 * * *', { timeZone: 'UTC' })
    async cancelExpiredOrders() {
        const yesterdayStart = new Date();
        yesterdayStart.setUTCDate(yesterdayStart.getUTCDate() - 1);
        yesterdayStart.setUTCHours(0, 0, 0, 0);

        const yesterdayEnd = new Date(yesterdayStart);
        yesterdayEnd.setUTCHours(23, 59, 59, 999);

        const result = await this.prisma.order.updateMany({
            where: {
                deadline: {
                    gte: yesterdayStart,
                    lte: yesterdayEnd,
                },
                status: OrderStatus.ACTIVE,
            },
            data: {
                status: OrderStatus.CANCELED,
            },
        });

        const message = `🕒 Cron: отменено ${result.count} заказов с дедлайном за вчера (${yesterdayStart.toISOString().slice(0, 10)}).`;
        this.logger.log(message);

        await sendToLogChannel(message);
    }
}
