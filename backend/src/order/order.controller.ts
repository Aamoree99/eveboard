import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { OrderStatus, User as PrismaUser } from '@prisma/client';
import { JwtAuthGuard } from '../auth/strategies/jwt.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Orders')
@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Get()
  @ApiOperation({ summary: 'Get orders (optionally filtered)' })
  @ApiQuery({ name: 'status', required: false, enum: OrderStatus })
  @ApiQuery({ name: 'typeId', required: false, type: Number })
  getAll(
      @Query('status') status?: OrderStatus,
      @Query('typeId') typeId?: number,
  ) {
    return this.orderService.findAll(status, typeId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order by ID' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  getOne(@Param('id') id: string) {
    return this.orderService.findById(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new order' })
  create(@Body() body: CreateOrderDto, @CurrentUser() user: PrismaUser) {
    return this.orderService.create(body, user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/take')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Take order as executor' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  take(@Param('id') id: string, @CurrentUser() user: PrismaUser) {
    return this.orderService.takeOrder(id, user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update order (creator only)' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  update(
      @Param('id') id: string,
      @Body() body: UpdateOrderDto,
      @CurrentUser() user: PrismaUser,
  ) {
    return this.orderService.update(id, body, user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete order (creator only)' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  delete(@Param('id') id: string, @CurrentUser() user: PrismaUser) {
    return this.orderService.delete(id, user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/message')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Send message to order chat' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiQuery({ name: 'text', required: true, type: String })
  sendMessage(
      @Param('id') orderId: string,
      @Query('text') text: string,
      @CurrentUser() user: PrismaUser,
  ) {
    return this.orderService.sendMessage(orderId, user.id, text);
  }

  @Get(':id/messages')
  @ApiOperation({ summary: 'Get messages for order' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  getMessages(@Param('id') orderId: string) {
    return this.orderService.getMessages(orderId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/complain')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit a complaint for an order' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiQuery({ name: 'reason', required: true, type: String })
  complain(
      @Param('id') orderId: string,
      @Query('reason') reason: string,
      @CurrentUser() user: PrismaUser,
  ) {
    return this.orderService.complain(orderId, user.id, reason);
  }
}
