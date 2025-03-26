import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

const CHARACTER_ID = Number(process.env.MAIN_WALLET);
const ESI_TOKEN_URL = 'https://login.eveonline.com/v2/oauth/token';
const ESI_JOURNAL_URL = `https://esi.evetech.net/latest/characters/${CHARACTER_ID}/wallet/journal/`;

interface JournalEntry {
    id: number;
    date: string;
    amount: number;
    reason?: string;
    ref_type: string;
}

@Injectable()
export class WalletMonitorService {
    private readonly logger = new Logger(WalletMonitorService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly http: HttpService,
    ) {}

    @Cron('30 * * * *') // every hour at :30
    async checkWalletJournal() {
        const systemUser = await this.prisma.user.findUnique({
            where: { characterId: CHARACTER_ID },
        });

        if (!systemUser) {
            this.logger.error('System user not found');
            return;
        }

        let accessToken: string | null = systemUser.accessToken;
        let journal = await this.fetchJournal(accessToken);

        if (journal === null) {
            this.logger.warn('Access token expired, refreshing...');
            accessToken = await this.refreshAccessToken(systemUser);

            if (!accessToken) {
                this.logger.error('Failed to refresh token');
                return;
            }

            journal = await this.fetchJournal(accessToken);
            if (!journal) {
                this.logger.error('Still failed to fetch journal after refresh');
                return;
            }
        }

        const unconfirmed = await this.prisma.transaction.findMany({
            where: { confirmed: false },
        });

        const deposits = unconfirmed.filter((tx) => tx.type === 'DEPOSIT');
        const withdrawals = unconfirmed.filter((tx) => tx.type === 'WITHDRAWAL');

        for (const tx of deposits) {
            const match = journal.find((entry) => {
                return (
                    entry.amount > 0 &&
                    entry.ref_type === 'player_donation' &&
                    entry.reason === tx.reason &&
                    Math.round(entry.amount) === tx.amount
                );
            });

            if (match) {
                await this.prisma.transaction.update({
                    where: { id: tx.id },
                    data: {
                        confirmed: true,
                        externalId: BigInt(match.id),
                    },
                });

                await this.prisma.user.update({
                    where: { id: tx.userId },
                    data: {
                        balance: { increment: tx.amount },
                    },
                });

                this.logger.log(`✅ Confirmed deposit from ${tx.userId} for ${tx.amount} ISK`);
            }
        }

        for (const tx of withdrawals) {
            const match = journal.find((entry) => {
                return (
                    entry.amount < 0 &&
                    entry.ref_type === 'player_donation' &&
                    entry.reason === tx.reason &&
                    Math.round(-entry.amount) === tx.amount
                );
            });

            if (match) {
                await this.prisma.transaction.update({
                    where: { id: tx.id },
                    data: {
                        confirmed: true,
                        externalId: BigInt(match.id),
                    },
                });

                this.logger.log(`✅ Confirmed withdrawal to ${tx.userId} for ${tx.amount} ISK`);
            }
        }
    }

    private async fetchJournal(accessToken: string): Promise<JournalEntry[] | null> {
        try {
            const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
            let page = 1;
            const entries: JournalEntry[] = [];

            while (true) {
                const { data } = await this.http.axiosRef.get(ESI_JOURNAL_URL, {
                    headers: { Authorization: `Bearer ${accessToken}` },
                    params: { datasource: 'tranquility', page },
                });

                const recent = data.filter((e: JournalEntry) => new Date(e.date) > oneHourAgo);
                entries.push(...recent);

                if (recent.length < data.length) break;
                page++;
            }

            return entries;
        } catch (err: any) {
            if (err?.response?.status === 401) {
                return null;
            }

            this.logger.error('ESI journal fetch error', err?.response?.data || err?.message || err);
            return null;
        }
    }

    private async refreshAccessToken(user: {
        id: string;
        accessToken: string;
        refreshToken: string;
    }): Promise<string | null> {
        try {
            const response = await this.http.axiosRef.post(
                ESI_TOKEN_URL,
                new URLSearchParams({
                    grant_type: 'refresh_token',
                    refresh_token: user.refreshToken,
                }),
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        Authorization:
                            'Basic ' +
                            Buffer.from(
                                `${process.env.EVE_CLIENT_ID}:${process.env.EVE_SECRET_KEY}`,
                            ).toString('base64'),
                    },
                },
            );

            const newAccessToken = response.data.access_token;
            const newRefreshToken = response.data.refresh_token;

            await this.prisma.user.update({
                where: { id: user.id },
                data: {
                    accessToken: newAccessToken,
                    refreshToken: newRefreshToken,
                },
            });

            return newAccessToken;
        } catch (err: any) {
            this.logger.error('Token refresh error', err?.response?.data || err?.message || err);
            return null;
        }
    }
}
