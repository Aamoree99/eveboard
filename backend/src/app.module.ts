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

@Module({
    imports: [
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
    ],
    providers: [WalletMonitorService],
})
export class AppModule {}
