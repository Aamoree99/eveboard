import { Controller, Get, Post, Delete, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/strategies/jwt.guard';
import { AdminGuard } from '../auth/admin/admin.guard';
import { TransactionService } from '../transaction/transaction.service';

@ApiTags('Admin Transactions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin/transactions')
export class AdminTransactionController {
    constructor(private readonly transactionService: TransactionService) {}

    @Get('pending-withdraws')
    @ApiOperation({ summary: 'Get all pending withdrawal transactions' })
    getPendingWithdrawals() {
        return this.transactionService.getPendingWithdrawals();
    }

    @Post('confirm/:id')
    @ApiOperation({ summary: 'Confirm a withdrawal transaction' })
    confirm(@Param('id') id: string) {
        return this.transactionService.confirmWithdraw(id);
    }

    @Delete('cancel/:id')
    @ApiOperation({ summary: 'Cancel a withdrawal transaction' })
    cancel(@Param('id') id: string) {
        return this.transactionService.cancelWithdraw(id);
    }
}
