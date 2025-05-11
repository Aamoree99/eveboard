import {BadRequestException, Injectable, Logger, NotFoundException} from '@nestjs/common';
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

        if (!user) {
            throw new BadRequestException('User not found');
        }

        if (user.referralId) {
            throw new BadRequestException('Referral already set');
        }

        const referral = await this.prisma.referral.findUnique({
            where: { code },
        });

        if (!referral) {
            throw new BadRequestException('Referral code not found');
        }


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
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        const fee = 100_000_000;

        if (user.balance < fee) {
            throw new BadRequestException('Insufficient balance to become an executor');
        }

        await this.prisma.$transaction([
            this.prisma.user.update({
                where: { id: userId },
                data: {
                    role: 'EXECUTOR',
                    balance: { decrement: fee },
                },
            }),
            this.prisma.transaction.create({
                data: {
                    userId,
                    amount: fee,
                    reason: 'Fee for becoming EXECUTOR',
                    type: 'WITHDRAWAL',
                    confirmed: true,
                },
            }),
        ]);
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
