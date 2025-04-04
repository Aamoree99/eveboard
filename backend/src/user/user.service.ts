import {Injectable, NotFoundException} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { convertBigIntToString } from '../common/bigIntToString'; // ← путь адаптируй

@Injectable()
export class UserService {
    constructor(private prisma: PrismaService) {}

    async findAll(search?: string) {
        let users;

        if (!search) {
            users = await this.prisma.user.findMany();
        } else {
            users = await this.prisma.user.findMany({
                where: {
                    OR: [
                        { name: { contains: search, mode: 'insensitive' } },
                        {
                            characterId: !isNaN(Number(search))
                                ? Number(search)
                                : undefined,
                        },
                    ],
                },
            });
        }

        return convertBigIntToString(users);
    }

    async findById(id: string) {

        const user = await this.prisma.user.findUnique({
            where: { id },
        });


        return convertBigIntToString(user);
    }

    async findPublicById(id: string) {
        const user = await this.prisma.user.findUnique({
            where: { id },
        });

        if (!user) return null;

        const { accessToken, refreshToken, ...safeUser } = user;
        return convertBigIntToString(safeUser);
    }

    async setReferral(userId: string, code: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) throw new Error('User not found');
        if (user.referralId) throw new Error('Referral already set');

        const referral = await this.prisma.referral.findUnique({
            where: { code },
        });

        if (!referral) throw new Error('Referral code not found');

        await this.prisma.user.update({
            where: { id: userId },
            data: {
                referral: {
                    connect: { id: referral.id },
                },
            },
        });

        return { success: true, message: 'Referral code linked successfully' };
    }

    async setExecutorRole(userId: string): Promise<void> {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        })

        if (!user) {
            throw new NotFoundException('User not found')
        }

        await this.prisma.user.update({
            where: { id: userId },
            data: { role: 'EXECUTOR' },
        })
    }

    async searchUsers(query: string) {
        return this.prisma.user.findMany({
            where: {
                name: {
                    contains: query,
                    mode: 'insensitive',
                },
            },
            select: {
                id: true,
                name: true,
                avatar: true,
            },
            take: 10,
        })
    }
}
