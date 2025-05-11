import { Module } from '@nestjs/common'
import { UserController } from './user.controller'
import { UserService } from './user.service'
import { PrismaModule } from '../prisma/prisma.module'
import { TransactionModule } from '../transaction/transaction.module'
import { OrderModule } from '../order/order.module' // ✅

@Module({
  imports: [PrismaModule, TransactionModule, OrderModule], // ✅
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
