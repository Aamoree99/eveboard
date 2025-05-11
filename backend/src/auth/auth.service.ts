import {BadRequestException, Injectable, InternalServerErrorException, NotFoundException} from '@nestjs/common';
import axios from 'axios';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { Logger } from '@nestjs/common';
import {addUserToGuildWithRole, setNickname} from '../discordBot';
import 'dotenv/config';

interface EveTokenResponse {
    access_token: string;
    refresh_token: string;
}

interface EveVerifyResponse {
    CharacterID: number;
    CharacterName: string;
}

interface DiscordTokenResponse {
    access_token: string;
    token_type: string;
    expires_in: number;
    refresh_token: string;
    scope: string;
}

interface DiscordUserResponse {
    id: string;
    username: string;
    discriminator: string;
    avatar: string;
}


@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);
    constructor(
        private readonly prisma: PrismaService,
        private readonly jwtService: JwtService,
    ) {}

    getEveLoginUrl(): string {
        const callback = process.env.EVE_CALLBACK_URL;
        const clientId = process.env.EVE_CLIENT_ID;
        const scope = process.env.EVE_SCOPES;
        const state = Math.random().toString(36).substring(2); // можно использовать uuid

        if (!callback || !clientId) {
            throw new InternalServerErrorException('EVE OAuth env vars not set');
        }

        return `https://login.eveonline.com/v2/oauth/authorize?response_type=code&redirect_uri=${encodeURIComponent(
            callback,
        )}&client_id=${clientId}&scope=${scope}&state=${state}`;
    }

    async handleCallback(code: string): Promise<string> {
        const callback = process.env.EVE_CALLBACK_URL;
        const clientId = process.env.EVE_CLIENT_ID;
        const clientSecret = process.env.EVE_CLIENT_SECRET;

        if (!callback || !clientId || !clientSecret) {
            throw new InternalServerErrorException('EVE OAuth env vars not set');
        }

        try {
            // 1. Получаем access / refresh токены
            const tokenRes = await axios.post<EveTokenResponse>(
                'https://login.eveonline.com/v2/oauth/token',
                new URLSearchParams({
                    grant_type: 'authorization_code',
                    code,
                    redirect_uri: callback,
                }),
                {
                    auth: {
                        username: clientId,
                        password: clientSecret,
                    },
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                },
            );

            const { access_token, refresh_token } = tokenRes.data;

            // 2. Получаем инфу о пользователе
            const verifyRes = await axios.get<EveVerifyResponse>(
                'https://esi.evetech.net/verify/',
                {
                    headers: {
                        Authorization: `Bearer ${access_token}`,
                    },
                },
            );

            const { CharacterID, CharacterName } = verifyRes.data;

            const avatar = `https://images.evetech.net/characters/${CharacterID}/portrait`;

            const tester = await this.prisma.tester.findUnique({
                where: { characterId: String(CharacterID) },
            });

            const role = tester ? 'TESTER' : 'PENDING';

            const user = await this.prisma.user.upsert({
                where: { id: String(CharacterID) },
                update: {
                    name: CharacterName,
                    avatar,
                    accessToken: access_token,
                    refreshToken: refresh_token,
                },
                create: {
                    id: String(CharacterID),
                    characterId: CharacterID,
                    name: CharacterName,
                    avatar,
                    accessToken: access_token,
                    refreshToken: refresh_token,
                    role,
                },
            });


            // 4. Возвращаем JWT
            return this.jwtService.sign({
                sub: user.id,
                name: user.name,
                role: user.role,
            });
        } catch (error) {
            this.logger.error('OAuth callback failed', error instanceof Error ? error.stack : String(error));
            throw new InternalServerErrorException('Failed to authorize EVE account. Please try again later.');
        }
    }

    async fetchDiscordData(code: string) {
        const tokenResponse = await axios.post<DiscordTokenResponse>(
            'https://discord.com/api/oauth2/token',
            new URLSearchParams({
                client_id: process.env.DISCORD_CLIENT_ID!,
                client_secret: process.env.DISCORD_CLIENT_SECRET!,
                grant_type: 'authorization_code',
                code,
                redirect_uri: process.env.DISCORD_REDIRECT_URI!,
            }).toString(),
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            }
        );

        const accessToken = tokenResponse.data.access_token;

        const userResponse = await axios.get<DiscordUserResponse>(
            'https://discord.com/api/users/@me',
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            }
        );

        const { id, username, discriminator, avatar } = userResponse.data;

        try {
            await addUserToGuildWithRole(id, accessToken);
        } catch (err) {
            console.warn('⚠️ Failed to add user to guild:', err);
            return; // ← без этого будет undefined (но всё равно завершится)
        }

        const avatarUrl = avatar
            ? `https://cdn.discordapp.com/avatars/${id}/${avatar}.${avatar.startsWith('a_') ? 'gif' : 'png'}`
            : null;

        return {
            id,
            username,
            discriminator,
            avatar,
            avatarUrl,
        };
    }

    async linkDiscord(userId: string, disid: string) {
        if (!disid) throw new BadRequestException('Discord ID is required');

        // Получаем пользователя из базы данных, чтобы взять имя
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { name: true, role: true },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        await this.prisma.user.update({
            where: { id: userId },
            data: { discordId: disid },
        });

        if (user?.role === 'PENDING') {
            await this.prisma.user.update({
                where: { id: userId },
                data: { role: 'USER' },
            });
        }

        try {
            await setNickname(disid, user.name);
        } catch (err: unknown) {
            if (typeof err === 'object' && err !== null && 'code' in err && err['code'] === 50013) {
                this.logger.warn(`⚠️ Bot has no permission to change nickname for ${user.name}`);
            } else {
                throw err;
            }
        }



        return { message: 'Discord linked and nickname set on server' };
    }

}
