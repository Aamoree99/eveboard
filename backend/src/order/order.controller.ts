import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query, Req, Res,
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
import {OrderStatus, OrderType, User as PrismaUser} from '@prisma/client';
import { JwtAuthGuard } from '../auth/strategies/jwt.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import {SubmitComplaintDto} from "./dto/submit-complaint.dto";

@ApiTags('Orders')
@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Get('/types')
  @ApiOperation({ summary: 'Get available order types (enum values)' })
  getTypes() {
    const formattedTypes = this.orderService.getFormattedOrderTypes();
    return { data: formattedTypes };
  }

  @Get()
  @ApiOperation({ summary: 'Get orders (optionally filtered)' })
  @ApiQuery({ name: 'status', required: false, enum: OrderStatus })
  @ApiQuery({ name: 'type', required: false, enum: OrderType })
  @ApiQuery({ name: 'userId', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getAll(
      @Query('status') status?: OrderStatus,
      @Query('type') type?: OrderType, // 👈 теперь это enum
      @Query('userId') userId?: string,
      @Query('page') page = 1,
      @Query('limit') limit = 20,
  ){
    return this.orderService.findAll(status, type, userId, page, limit);
  }

  @Get('/promoted')
  @ApiOperation({ summary: 'Get promoted orders (sorted by oldest + most expensive)' })
  async getPromotedOrders() {
    return this.orderService.getPromotedOrders();
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
    console.log('[OrderController] Create body:', body);
    console.log('[OrderController] Current user:', user);
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
  @Patch(':id/status')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update order status (DONE or CANCELED)' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiQuery({ name: 'status', enum: OrderStatus, required: true })
  updateStatus(
      @Param('id') id: string,
      @Query('status') status: OrderStatus,
      @CurrentUser() user: PrismaUser,
  ) {
    console.log(id, status);
    return this.orderService.updateStatus(id, status, user.id);
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
  complain(
      @Param('id') orderId: string,
      @Body() dto: SubmitComplaintDto,
      @CurrentUser() user: PrismaUser,
  ) {
    return this.orderService.complain(orderId, user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('completed-count')
  async getCompletedOrderCount(@Req() req: any): Promise<{ count: number }> {
    const userId = req.user.id
    const count = await this.orderService.getCompletedOrderCount(userId)
    return { count }
  }
}
