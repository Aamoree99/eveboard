export type Role =
    'USER' |
    'EXECUTOR' |
    'ADMIN' |
    'TESTER' |
    'PENDING' |
    'EARLY_BIRD'

export type OrderStatus =
    'ACTIVE' |
    'TAKEN' |
    'DONE' |
    'CANCELED'

export type TransactionType =
    'DEPOSIT' |
    'WITHDRAWAL' |
    'PAYMENT' |
    'REWARD' |
    'BONUS'

export type OrderType =
    'KILL_TARGET' |
    'SCAN_WORMHOLE' |
    'SCOUT_SYSTEM' |
    'LOGISTICS' |
    'ESCORT' |
    'STRUCTURE_WORK' |
    'CHARACTER_INFO' |
    'ROUTE_PLANNING' |
    'COUNTER_INTEL' |
    'EVENT_FARMING' |
    'PVP_ASSIST' |
    'OTHER'

export type ComplaintReason =
    | 'SCAM'
    | 'SPAM'
    | 'HARASSMENT'
    | 'ABUSE_OF_POWER'
    | 'OTHER'


export interface User {
    id: string
    characterId: number
    name: string
    avatar?: string
    role: Role
    isBanned: boolean
    balance: string // BigInt
    rating: number
    accessToken: string
    refreshToken: string
    createdAt: string
    updatedAt: string
    discordId?: string

    referralId?: string
    referral?: Referral

    createdOrders?: Order[]
    takenOrders?: Order[]
    reviewsGiven?: Review[]
    reviewsReceived?: Review[]
    transactions?: Transaction[]
    messages?: OrderMessage[]
    complaints?: Complaint[]
}

export interface Order {
    id: string
    title: string
    description: string
    requirements?: string
    language: string
    price: number
    deadline?: string
    status: OrderStatus
    createdAt: string
    updatedAt: string
    isAnonymous: boolean
    minRating: number
    isPromoting: boolean
    promotingUntil?: string
    type: OrderType

    systemId?: number
    system?: System

    creatorId: string
    creator?: User

    executorId?: string
    executor?: User

    reviews?: Review[]
    complaints?: Complaint[]
    messages?: OrderMessage[]
}

export interface System {
    id: number
    name: string
    orders?: Order[]
}

export interface OrderMessage {
    id: string
    text: string
    createdAt: string
    orderId: string
    order?: Order
    authorId: string
    author?: User
}

export interface Review {
    id: string
    rating: number
    text?: string
    createdAt: string
    orderId: string
    order?: Order
    fromId: string
    from?: User
    toId: string
    to?: User
}

export interface Transaction {
    id: string
    amount: bigint
    reason: string
    type: TransactionType
    createdAt: string
    confirmed: boolean
    externalId?: string
    userId: string
    user?: User
}

export interface Complaint {
    id: string
    reason: ComplaintReason
    comment?: string
    createdAt: string
    userId: string
    user?: User
    orderId: string
    order?: Order
}

export interface Tester {
    id: string
    characterId: string
    addedAt: string
}

export interface Referral {
    id: string
    streamerName: string
    code: string
    createdAt: string
    referredUsers?: User[]
}

export interface CreateDepositDto {
    amount: number
    reference?: string
}

export interface CorporationTransaction {
    id: string
    externalId: string
    amount: string
    balance: string
    date: string
    createdAt: string
}


