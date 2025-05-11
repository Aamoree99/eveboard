import { IsString } from 'class-validator'

export class SetReferralDto {
    @IsString()
    code!: string
}