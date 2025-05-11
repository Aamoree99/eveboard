import { IsInt, Min, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateDepositDto {
    @ApiProperty({ example: 10000000 })
    @IsInt()
    @Min(1)
    amount!: number;

    @ApiProperty({ example: 'user123', required: false })
    @IsOptional()
    @IsString()
    reference?: string;
}
