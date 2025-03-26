import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, IsDateString } from 'class-validator';

export class CreateOrderDto {
    @ApiProperty()
    @IsString()
    title!: string;

    @ApiProperty()
    @IsString()
    description!: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    requirements?: string;

    @ApiProperty()
    @IsString()
    system!: string;

    @ApiProperty()
    @IsInt()
    price!: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsDateString()
    deadline?: string;

    @ApiProperty()
    @IsInt()
    typeId!: number;

    @ApiProperty()
    @IsString()
    creatorId!: string;
}
