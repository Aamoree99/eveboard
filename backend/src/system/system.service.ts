import {Injectable, NotFoundException} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SystemService {
    constructor(private readonly prisma: PrismaService) {}

    async findAll() {
        return this.prisma.system.findMany({
            select: {
                id: true,
                name: true,
            },
            orderBy: {
                name: 'asc',
            },
        });
    }

    async searchByName(query: string) {
        return this.prisma.system.findMany({
            where: {
                name: {
                    startsWith: query,
                    mode: 'insensitive',
                },
            },
            select: {
                id: true,
                name: true,
            },
            take: 10,
            orderBy: {
                name: 'asc',
            },
        });
    }

    async getSystemInfo(systemId: number, userId: string) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } })
        if (!user) throw new NotFoundException('User not found')

        const refresh = await fetch('https://login.eveonline.com/v2/oauth/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                Authorization: 'Basic ' + Buffer.from(
                    `${process.env.EVE_CLIENT_ID}:${process.env.EVE_CLIENT_SECRET}`
                ).toString('base64'),
            },
            body: new URLSearchParams({
                grant_type: 'refresh_token',
                refresh_token: user.refreshToken,
            }),
        })

        if (!refresh.ok) {
            const errorText = await refresh.text()
            throw new Error('Failed to refresh token: ' + errorText)
        }

        const tokenData = await refresh.json() as {
            access_token: string
            refresh_token: string
        }

        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                accessToken: tokenData.access_token,
                refreshToken: tokenData.refresh_token,
            },
        })


        const res = await fetch(`https://esi.evetech.net/latest/ui/autopilot/waypoint/` +
            `?destination_id=${systemId}&add_to_beginning=false&clear_other_waypoints=true`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${tokenData.access_token}`,
                'Content-Type': 'application/json',
            },
        })

        if (!res.ok) {
            const msg = await res.text()
            throw new Error('Failed to set waypoint: ' + msg)
        }

        return {
            success: true,
            message: 'Route set successfully',
        }
    }
}
