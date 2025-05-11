import { IsInt, Min, Max, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateReviewDto {
    @ApiProperty({ example: 5, description: 'Rating from 1 to 5' })
    @IsInt()
    @Min(1)
    @Max(5)
    rating!: number;

    @ApiProperty({
        example: 'Completed the task quickly and accurately',
        required: false,
        description: 'Optional review comment',
    })
    @IsOptional()
    @IsString()
    text?: string;
}