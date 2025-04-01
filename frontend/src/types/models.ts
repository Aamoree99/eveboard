export type Role = 'USER' | 'EXECUTOR' | 'ADMIN' | 'TESTER' | 'PENDING'

export type OrderStatus = 'ACTIVE' | 'TAKEN' | 'DONE' | 'CANCELED'

export type TransactionType =
    | 'DEPOSIT'
    | 'WITHDRAWAL'
    | 'PAYMENT'
    | 'REWARD'
    | 'BONUS'

export type OrderType =
    | 'KILL_TARGET'
    | 'SCAN_WORMHOLE'
    | 'SCOUT_SYSTEM'
    | 'LOGISTICS'
    | 'ESCORT'
    | 'STRUCTURE_WORK'
    | 'CHARACTER_INFO'
    | 'ROUTE_PLANNING'
    | 'COUNTER_INTEL'
    | 'EVENT_FARMING'
    | 'PVP_ASSIST'
    | 'OTHER'

export interface Referral {
    id: string
    streamerName: string
    code: string
    createdAt: string
    referredUsers?: User[]
}

export interface User {
    id: string
    characterId: number
    name: string
    avatar?: string
    role: Role
    isBanned: boolean
    balance: string // BigInt → string
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
    type: OrderType

    systemId?: number
    system?: System

    creatorId: string
    creator?: User

    executorId?: string
    executor?: User

    review?: Review
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
    authorId: string
    order?: Order
    author?: User
}

export interface Review {
    id: string
    rating: number
    text?: string
    createdAt: string
    orderId: string
    fromId: string
    toId: string
    from?: User
    to?: User
}

export interface Transaction {
    id: string
    amount: number
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
    reason: string
    createdAt: string
    userId: string
    orderId: string
    user?: User
    order?: Order
}

export interface Tester {
    id: string
    characterId: string
    addedAt: string
}

export interface CreateDepositDto {
    amount: number
    reference?: string
}
