import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { sendDM } from '../discordBot';
import {Role} from "@prisma/client";

@Injectable()
export class AccessGrantService {
    private readonly logger = new Logger(AccessGrantService.name);

    constructor(private readonly prisma: PrismaService) {}

    @Cron('0 12 * * *') // каждый день в 12:00 UTC
    async promotePendingUsers() {
        const pendingUsers = await this.prisma.user.findMany({
            where: { role: 'PENDING' },
        });

        if (pendingUsers.length === 0) {
            this.logger.log('📭 No PENDING users to process');
            return;
        }

        const percentToPromote = Math.ceil(pendingUsers.length * 0.1);
        const shuffled = pendingUsers.sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, percentToPromote);

        this.logger.log(`🎯 Promoting ${selected.length} out of ${pendingUsers.length} PENDING users`);

        for (const user of selected) {
            await this.prisma.user.update({
                where: { id: user.id },
                data: { role: Role.EARLY_BIRD },
            });

            if (user.discordId) {
                try {
                    await sendDM(
                        user.discordId,
                        `🎉 **Welcome to the Closed Beta!**\nYou’ve been granted access to the EVE Board testing phase.\n\n👉 [Click here to begin](https://eveboard.app)\n\nFly safe, capsuleer! 🚀`
                    );
                } catch (err) {
                    const message = err instanceof Error ? err.message : String(err);
                    this.logger.warn(`⚠️ Failed to DM user ${user.id}: ${message}`);
                }
            }
        }
    }
}
