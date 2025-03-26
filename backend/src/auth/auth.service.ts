import { Injectable, InternalServerErrorException } from '@nestjs/common';
import axios from 'axios';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { Logger } from '@nestjs/common';

interface EveTokenResponse {
    access_token: string;
    refresh_token: string;
}

interface EveVerifyResponse {
    CharacterID: number;
    CharacterName: string;
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
        const scope = 'publicData';
        const state = Math.random().toString(36).substring(2); // можно использовать uuid

        if (!callback || !clientId) {
            throw new InternalServerErrorException('EVE OAuth env vars not set');
        }

        // Возможно, стоит сохранить state в сессии или Redis, чтобы потом сверить

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

            // 3. Создаём или обновляем пользователя
            const user = await this.prisma.user.upsert({
                where: { characterId: CharacterID },
                update: {
                    name: CharacterName,
                    avatar,
                    accessToken: access_token,
                    refreshToken: refresh_token,
                },
                create: {
                    characterId: CharacterID,
                    name: CharacterName,
                    avatar,
                    accessToken: access_token,
                    refreshToken: refresh_token,
                    role: 'USER',
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
}
