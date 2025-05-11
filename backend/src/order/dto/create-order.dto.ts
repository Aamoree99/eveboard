import {
    IsInt,
    IsBoolean,
    IsEnum,
    IsNotEmpty,
    IsOptional,
    IsString,
} from 'class-validator';
import { OrderType } from '@prisma/client';

export class CreateOrderDto {
    @IsString()
    @IsNotEmpty()
    title!: string;

    @IsString()
    @IsNotEmpty()
    description!: string;

    @IsOptional()
    @IsString()
    requirements?: string;

    @IsEnum(OrderType)
    type!: OrderType;

    @IsOptional()
    @IsInt()
    systemId?: number;

    @IsInt()
    price!: number;

    @IsOptional()
    deadline?: string;

    @IsOptional()
    @IsBoolean()
    isAnonymous?: boolean;

    @IsOptional()
    @IsBoolean()
    isPromoting?: boolean;

    @IsOptional()
    @IsString()
    promotingUntil?: string;
}
