import {
  Controller,
  Post,
  Body,
  Get,
  Delete,
  Param,
  UseGuards, Query,
} from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { CreateDepositDto } from './dto/create-deposit.dto';
import { JwtAuthGuard } from '../auth/strategies/jwt.guard';
import {ApiBearerAuth, ApiTags, ApiOperation, ApiParam, ApiQuery, ApiBody} from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '@prisma/client';
import {GetTransactionQueryDto} from "./dto/GetTransactionQueryDto";

interface CorpBalanceResponse {
  currentBalance: number;
  lockedBalance: number;
  transactions: CorpTransactionDto[];
}

interface CorpTransactionDto {
  id: string;
  amount: number;
  balanceAfter: number;
  date: string;
  type: 'Deposit from player' | 'Withdrawal to player';
}

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
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  getAll(
      @CurrentUser() user: User,
      @Query() query: GetTransactionQueryDto,
  ) {
    return this.transactionService.getUserTransactions(user.id, query);
  }

  @Post('withdraw')
  @ApiOperation({ summary: 'Request a withdrawal from your internal balance' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        amount: {
          type: 'number',
          example: 1000000000,
        },
      },
      required: ['amount'],
    },
  })
  requestWithdraw(
      @CurrentUser() user: User,
      @Body('amount') amount: number,
  ) {
    return this.transactionService.requestWithdraw(user.id, amount)
  }
  /*
  @Post('withdraw/:id/confirm')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Manually confirm a withdrawal (MAIN_WALLET only)' })
  @ApiParam({ name: 'id', description: 'Transaction ID of the withdrawal' })
  confirmWithdraw(
      @Param('id') id: string,
      @CurrentUser() user: User,
  ) {
    return this.transactionService.confirmWithdrawManually(id, user.id);
  }
  */

  @Delete('withdraw/:id')
  @ApiOperation({ summary: 'Cancel a pending withdrawal request' })
  @ApiParam({ name: 'id', description: 'Transaction ID of the withdrawal' })
  cancelWithdraw(@Param('id') id: string) {
    return this.transactionService.cancelWithdraw(id);
  }

  @Get('corporate')
  @ApiOperation({ summary: 'Get current corporation wallet balance' })
  getBalance(): Promise<CorpBalanceResponse> {
    return this.transactionService.getCorpBalanceData();
  }
}
