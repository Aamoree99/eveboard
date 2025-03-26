import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UserService {
    constructor(private prisma: PrismaService) {}

    async findAll(search?: string) {
        if (!search) {
            return this.prisma.user.findMany();
        }

        return this.prisma.user.findMany({
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

    async findById(id: string) {
        console.log('[UserService] findById -> id:', id);

        const user = await this.prisma.user.findUnique({
            where: { id },
        });

        console.log('[UserService] findById -> result:', user);

        return user;
    }


    async findPublicById(id: string) {
        const user = await this.prisma.user.findUnique({
            where: { id },
        });

        if (!user) return null;

        const { accessToken, refreshToken, ...safeUser } = user;
        return safeUser;
    }

    async create(dto: CreateUserDto) {
        return this.prisma.user.create({
            data: {
                characterId: dto.characterId,
                name: dto.name,
                avatar: dto.avatar,
                accessToken: dto.accessToken,
                refreshToken: dto.refreshToken,
                role: dto.role ?? 'USER',
            },
        });
    }

}
