import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { User, Transaction } from '@prisma/client';
import { sendDM } from '../discordBot';
import 'dotenv/config';

const CORP_ID = Number(process.env.EVE_CORP_ID);
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

    @Cron('30 * * * *') // каждый 30 минут
    async checkWalletJournal() {
        this.logger.log('🔄 Wallet journal check started');

        const admin = await this.prisma.user.findFirst({ where: { role: 'ADMIN' } });
        if (!admin?.refreshToken) {
            this.logger.error('⛔ No admin or token found');
            return;
        }

        const accessToken = await this.refreshAccessToken(admin);
        if (!accessToken) {
            this.logger.error('⛔ Token refresh failed');
            return;
        }

        const corpId = CORP_ID;
        const division = 1;

        // Получаем баланс
        const balance = await this.getDivisionBalance(corpId, division, accessToken);
        if (balance === null) return;
        this.logger.log(`💰 Division ${division} balance: ${balance.toLocaleString()} ISK`);

        // Получаем журнал
        const journal = await this.fetchJournalForDivision(corpId, division, accessToken);
        if (!journal) return;

        // Обработка транзакций
        for (const entry of journal) {
            if (entry.ref_type !== 'player_donation') continue;

            const exists = await this.prisma.corporationTransaction.findUnique({
                where: { externalId: BigInt(entry.id) },
            });
            if (exists) continue;

            await this.prisma.corporationTransaction.create({
                data: {
                    externalId: BigInt(entry.id),
                    amount: BigInt(Math.round(entry.amount)),
                    balance: BigInt(Math.round(balance)),
                    date: new Date(entry.date),
                },
            });

            const unconfirmed = await this.prisma.transaction.findMany({
                where: { confirmed: false },
            });

            for (const tx of unconfirmed) {
                const isDeposit = tx.type === 'DEPOSIT' && entry.amount > 0;
                const isWithdraw = tx.type === 'WITHDRAWAL' && entry.amount < 0;
                const matches =
                    entry.reason === tx.reason &&
                    Math.round(Math.abs(entry.amount)) === tx.amount;

                if ((isDeposit || isWithdraw) && matches) {
                    await this.prisma.transaction.update({
                        where: { id: tx.id },
                        data: {
                            confirmed: true,
                            externalId: BigInt(entry.id),
                        },
                    });

                    if (isDeposit) {
                        await this.prisma.user.update({
                            where: { id: tx.userId },
                            data: { balance: { increment: tx.amount } },
                        });
                    }

                    this.logger.log(
                        `✅ Confirmed ${tx.type.toLowerCase()} for user ${tx.userId}: ${tx.amount} ISK`
                    );

                    const user = await this.prisma.user.findUnique({ where: { id: tx.userId } });
                    if (user?.discordId) {
                        const msg =
                            tx.type === 'DEPOSIT'
                                ? `✅ **Deposit confirmed!**\n+${tx.amount.toLocaleString()} ISK on your balance.`
                                : `💸 **Withdrawal confirmed!**\n-${tx.amount.toLocaleString()} ISK has been sent.`;
                        await sendDM(user.discordId, msg);
                    }
                }
            }
        }

        this.logger.log('✅ Journal check complete');
    }

    private async getDivisionBalance(corpId: number, division: number, accessToken: string): Promise<number | null> {
        try {
            const { data } = await this.http.axiosRef.get(
                `https://esi.evetech.net/latest/corporations/${corpId}/wallets/`,
                {
                    headers: { Authorization: `Bearer ${accessToken}` },
                    params: { datasource: 'tranquility' },
                }
            );

            const wallet = data.find((w: any) => w.division === division);
            return wallet ? wallet.balance : null;
        } catch (err: any) {
            const status = err.response?.status;
            const data = err.response?.data;
            this.logger.error(`❌ Failed to fetch balance for division ${division}: ${status} ${JSON.stringify(data || err.message)}`);
            return null;
        }
    }


    private async fetchJournalForDivision(
        corpId: number,
        division: number,
        accessToken: string
    ): Promise<JournalEntry[] | null> {
        try {
            const { data } = await this.http.axiosRef.get<JournalEntry[]>(
                `https://esi.evetech.net/latest/corporations/${corpId}/wallets/${division}/journal/`,
                {
                    headers: { Authorization: `Bearer ${accessToken}` },
                    params: { datasource: 'tranquility' },
                }
            );

            return data;
        } catch (err: any) {
            const status = err.response?.status;
            const data = err.response?.data;
            this.logger.error(`❌ Journal fetch failed ${status}: ${JSON.stringify(data || err.message)}`);
            return null;
        }
    }

    private async getCharacterInfo(characterId: number, accessToken: string): Promise<void> {
        try {
            const { data } = await this.http.axiosRef.get(`https://esi.evetech.net/latest/characters/${characterId}`, {
                headers: { Authorization: `Bearer ${accessToken}` },
                params: { datasource: 'tranquility' },
            });

            this.logger.log(`🏢 Corporation ID: ${data.corporation_id}`);
        } catch (err: any) {
            const status = err.response?.status;
            const data = err.response?.data;
            this.logger.error(`❌ character info failed ${status}: ${JSON.stringify(data || err.message)}`);
        }
    }


    private async whoAmI(accessToken: string): Promise<void> {
        try {
            const { data } = await this.http.axiosRef.get('https://esi.evetech.net/verify', {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });

            this.logger.log(`🧍 Character: ${data.CharacterName}`);
            this.logger.log(`🏢 Corporation ID: ${data.CorporationId}`);
            this.logger.log(`🆔 Character ID: ${data.CharacterID}`);
            this.logger.log(`📛 Scopes: ${data.Scopes}`);
        } catch (err: any) {
            const status = err.response?.status;
            const data = err.response?.data;
            this.logger.error(`❌ /verify failed ${status}: ${JSON.stringify(data || err.message)}`);
        }
    }

    /** Всегда запрашиваем новый access_token по refresh_token */
    private async refreshAccessToken(user: User): Promise<string | null> {
        try {
            const params = new URLSearchParams({
                grant_type: 'refresh_token',
                refresh_token: user.refreshToken!,
            });

            const response = await this.http.axiosRef.post(ESI_TOKEN_URL, params, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    Authorization:
                        'Basic ' +
                        Buffer.from(
                            `${process.env.EVE_CLIENT_ID}:${process.env.EVE_CLIENT_SECRET}`
                        ).toString('base64'),
                },
            });

            const newAccess = response.data.access_token as string;
            const newRefresh = response.data.refresh_token as string;

            // Сохраняем оба токена в БД
            await this.prisma.user.update({
                where: { id: user.id },
                data: { accessToken: newAccess, refreshToken: newRefresh },
            });

            this.logger.log('Successfully refreshed tokens');
            return newAccess;
        } catch (err: any) {
            const status = err.response?.status;
            const data = err.response?.data;
            this.logger.error(
                `Token refresh failed ${status}: ${JSON.stringify(data || err.message)}`
            );
            return null;
        }
    }

    /** Запрашиваем последние транзакции корпорации */
    private async fetchJournal(accessToken: string): Promise<JournalEntry[] | null> {
        try {
            const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
            let page = 1;
            const entries: JournalEntry[] = [];

            while (true) {
                const { data } = await this.http.axiosRef.get<JournalEntry[]>(
                    ESI_CORP_JOURNAL_URL,
                    {
                        headers: { Authorization: `Bearer ${accessToken}` },
                        params: { datasource: 'tranquility', page },
                    }
                );

                const recent = data.filter((e: { date: string | number | Date; }) => new Date(e.date) > oneHourAgo);
                entries.push(...recent);

                if (recent.length < data.length) break;
                page++;
            }

            return entries;
        } catch (err: any) {
            const status = err.response?.status;
            const data = err.response?.data;
            if (status === 401) {
                this.logger.warn('fetchJournal returned 401 Unauthorized');
                return null;
            }
            this.logger.error(
                `ESI fetch error ${status}: ${JSON.stringify(data || err.message)}`
            );
            return null;
        }
    }
}
