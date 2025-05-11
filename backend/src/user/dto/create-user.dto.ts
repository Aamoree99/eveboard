import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString } from 'class-validator';
import { Role } from '@prisma/client';

export class CreateUserDto {
    @ApiProperty()
    @IsInt()
    characterId!: number;

    @ApiProperty()
    @IsString()
    name!: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    avatar?: string;

    @ApiProperty()
    @IsString()
    accessToken!: string;

    @ApiProperty()
    @IsString()
    refreshToken!: string;

    @ApiProperty({ enum: Role, required: false })
    @IsOptional()
    @IsEnum(Role)
    role?: Role;
}