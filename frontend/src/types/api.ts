import {CorporationTransaction} from "./models.ts";

export interface CorpTransactionDto {
    id: string
    amount: number
    balanceAfter: number
    date: string
    type: 'Deposit from player' | 'Withdrawal to player'
}

export interface CorpBalanceResponse {
    currentBalance: number
    lockedBalance: number
    transactions: CorporationTransaction[]
}
