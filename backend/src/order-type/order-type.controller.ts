import { Controller } from '@nestjs/common';
import { OrderTypeService } from './order-type.service';

@Controller('order-type')
export class OrderTypeController {
  constructor(private readonly orderTypeService: OrderTypeService) {}
}
