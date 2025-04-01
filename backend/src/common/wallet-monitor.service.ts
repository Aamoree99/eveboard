import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { User, Transaction } from '@prisma/client';
import { sendDM } from '../discordBot';
import 'dotenv/config';

const CORP_ID = Number(process.env.EVE_CORP_ID); // Прописать в .env
const ESI_TOKEN_URL = 'https://login.eveonline.com/v2/oauth/token';
const ESI_CORP_JOURNAL_URL = `https://esi.evetech.net/latest/corporations/${CORP_ID}/wallets/1/journal/`;

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

    @Cron('30 * * * *') // Каждый час на 30-й минуте
    async checkWalletJournal() {
        console.log("WalletCheker started")
        const adminWithToken = await this.prisma.user.findFirst({
            where: {
                role: 'ADMIN',
                accessToken: {
                    not: undefined,
                }
            },
        });

        if (!adminWithToken) {
            this.logger.error('No admin user with access token found');
            return;
        }

        let accessToken: string = adminWithToken.accessToken;
        let journal = await this.fetchJournal(accessToken);

        if (journal === null) {
            this.logger.warn('Access token expired, refreshing...');
            const refreshedToken = await this.refreshAccessToken(adminWithToken);

            if (!refreshedToken) {
                this.logger.error('Failed to refresh token');
                return;
            }

            accessToken = refreshedToken;
            journal = await this.fetchJournal(accessToken);

            if (!journal) {
                this.logger.error('Still failed to fetch journal after refresh');
                return;
            }
        }

        const unconfirmed = await this.prisma.transaction.findMany({
            where: { confirmed: false },
        });

        const deposits = unconfirmed.filter((tx: Transaction) => tx.type === 'DEPOSIT');
        const withdrawals = unconfirmed.filter((tx: Transaction) => tx.type === 'WITHDRAWAL');

        for (const tx of deposits) {
            const match = journal.find((entry: JournalEntry) => {
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

                const user = await this.prisma.user.findUnique({ where: { id: tx.userId } });
                if (user?.discordId) {
                    await sendDM(
                        user.discordId,
                        `✅ **Deposit confirmed!**\nYour balance has been topped up by **${tx.amount.toLocaleString()} ISK**.\nYou can now use it for orders. Fly safe, capsuleer! 🚀`
                    );
                }
            }
        }

        for (const tx of withdrawals) {
            const match = journal.find((entry: JournalEntry) => {
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

                const user = await this.prisma.user.findUnique({ where: { id: tx.userId } });
                if (user?.discordId) {
                    await sendDM(
                        user.discordId,
                        `💸 **Withdrawal confirmed!**\n**${tx.amount.toLocaleString()} ISK** has been sent from your account.\nThanks for using the service. o7`
                    );
                }
            }
        }
    }

    private async fetchJournal(accessToken: string): Promise<JournalEntry[] | null> {
        try {
            const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
            let page = 1;
            const entries: JournalEntry[] = [];

            while (true) {
                const { data } = await this.http.axiosRef.get<JournalEntry[]>(ESI_CORP_JOURNAL_URL, {
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

    private async refreshAccessToken(user: User): Promise<string | null> {
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

            const newAccessToken: string = response.data.access_token;
            const newRefreshToken: string = response.data.refresh_token;

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
