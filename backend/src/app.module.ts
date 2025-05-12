import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios'; // 👈 обязательно
import { UserModule } from './user/user.module';
import { OrderModule } from './order/order.module';
import { OrderTypeModule } from './order-type/order-type.module';
import { ReviewModule } from './review/review.module';
import { TransactionModule } from './transaction/transaction.module';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { WalletMonitorService } from './common/wallet-monitor.service';
import { ConfigModule } from '@nestjs/config';
import { SystemModule } from './system/system.module';
import {ScheduleModule} from "@nestjs/schedule";
import {OrderCronService} from "./common/order-cron.service";
import { AdminTransactionModule } from './admin-transaction/admin-transaction.module';

@Module({
    imports: [
        ScheduleModule.forRoot(),
        ConfigModule.forRoot({
            isGlobal: true,
        }),
        UserModule,
        OrderModule,
        OrderTypeModule,
        ReviewModule,
        TransactionModule,
        AuthModule,
        PrismaModule,
        HttpModule,
        SystemModule,
        AdminTransactionModule,
    ],
    providers: [WalletMonitorService,
        OrderCronService,],
})
export class AppModule {}
