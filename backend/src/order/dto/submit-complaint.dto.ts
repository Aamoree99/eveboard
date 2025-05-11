import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ComplaintReason } from '@prisma/client';

export class SubmitComplaintDto {
    @IsEnum(ComplaintReason)
    reason!: ComplaintReason;

    @IsOptional()
    @IsString()
    @MaxLength(500)
    comment?: string;
}
