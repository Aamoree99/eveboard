import { Module } from '@nestjs/common';
import { OrderTypeService } from './order-type.service';
import { OrderTypeController } from './order-type.controller';

@Module({
  controllers: [OrderTypeController],
  providers: [OrderTypeService],
})
export class OrderTypeModule {}
