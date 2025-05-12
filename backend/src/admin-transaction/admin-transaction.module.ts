import { Module } from '@nestjs/common';
import { AdminTransactionController } from './admin-transaction.controller';
import {TransactionModule} from "../transaction/transaction.module";

@Module({
  imports: [TransactionModule],
  controllers: [AdminTransactionController]
})
export class AdminTransactionModule {}
