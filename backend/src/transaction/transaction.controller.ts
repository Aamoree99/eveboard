import {
  Controller,
  Post,
  Body,
  Get,
  Delete,
  Param,
  UseGuards,
} from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { CreateDepositDto } from './dto/create-deposit.dto';
import { JwtAuthGuard } from '../auth/strategies/jwt.guard';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '@prisma/client';

@ApiTags('Transactions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('transaction')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Post('deposit')
  @ApiOperation({ summary: 'Create a deposit request to top up your balance' })
  create(@CurrentUser() user: User, @Body() dto: CreateDepositDto) {
    return this.transactionService.createDeposit(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get your transaction history' })
  getAll(@CurrentUser() user: User) {
    return this.transactionService.getUserTransactions(user.id);
  }

  @Post('withdraw')
  @ApiOperation({ summary: 'Request a withdrawal from your internal balance' })
  requestWithdraw(
      @CurrentUser() user: User,
      @Body('amount') amount: number,
  ) {
    return this.transactionService.requestWithdraw(user.id, amount);
  }

  @Post('withdraw/:id/confirm')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Manually confirm a withdrawal (MAIN_WALLET only)' })
  @ApiParam({ name: 'id', description: 'Transaction ID of the withdrawal' })
  confirmWithdraw(
      @Param('id') id: string,
      @CurrentUser() user: User,
  ) {
    return this.transactionService.confirmWithdrawManually(id, user.characterId);
  }


  @Delete('withdraw/:id')
  @ApiOperation({ summary: 'Cancel a pending withdrawal request' })
  @ApiParam({ name: 'id', description: 'Transaction ID of the withdrawal' })
  cancelWithdraw(@Param('id') id: string) {
    return this.transactionService.cancelWithdraw(id);
  }
}
