import { ApiProperty } from '@nestjs/swagger'
import { IsString, MinLength } from 'class-validator'

export class SearchUserDto {
    @ApiProperty({ example: 'eve', description: 'Name or part of name to search for' })
    @IsString()
    @MinLength(1)
    q!: string
}
