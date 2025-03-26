import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsInt, IsOptional, IsString } from 'class-validator';
import { OrderStatus } from '@prisma/client';

export class UpdateOrderDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    title?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    requirements?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    system?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsInt()
    price?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsDateString()
    deadline?: string;

    @ApiPropertyOptional({ enum: OrderStatus })
    @IsOptional()
    @IsEnum(OrderStatus)
    status?: OrderStatus;
}
