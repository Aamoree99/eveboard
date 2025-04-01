import { Injectable } from '@nestjs/common';
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
}
