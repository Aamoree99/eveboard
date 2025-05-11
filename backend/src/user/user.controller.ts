import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
  Request,
  InternalServerErrorException
} from '@nestjs/common';
import {ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam, ApiBearerAuth} from '@nestjs/swagger';
import { UserService } from './user.service';
import {JwtAuthGuard} from "../auth/strategies/jwt.guard";
import {CurrentUser} from "../common/decorators/current-user.decorator";
import { TransactionService } from '../transaction/transaction.service';
import {SetReferralDto} from "./dto/set-referral.dto";
import {SearchUserDto} from "./dto/search-user.dto";

@ApiTags('Users')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService,
              private readonly transactionService: TransactionService,) {}

  @Get()
  @ApiOperation({ summary: 'Get users (all or filtered)' })
  @ApiQuery({ name: 'search', required: false, description: 'Search by name or characterId' })
  @ApiResponse({ status: 200, description: 'List of users', type: [Object] })
  getAll(@Query('search') search?: string) {
    return this.userService.findAll(search);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiOperation({ summary: 'Get full profile of the authenticated user' })
  @ApiBearerAuth()
  async getMe(@CurrentUser() user: { id: string }) {

    return await this.userService.findById(user.id)
  }

  @Get('search')
  @ApiOperation({ summary: 'Search users' })
  @ApiQuery({ name: 'q', type: String, description: 'Search query' })
  async searchUsers(@Query() query: SearchUserDto) {
    try {
      const results = await this.userService.searchUsers(query.q)
      console.log(results)
      return { success: true, data: results }
    } catch (error) {
      console.error('Error during user search:', error)
      throw new InternalServerErrorException('Failed to search users')
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiParam({ name: 'id', description: 'User ID (cuid)' })
  @ApiResponse({ status: 200, description: 'User found', type: Object })
  getOne(@Param('id') id: string) {
    return this.userService.findPublicById(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('transactions')
  @ApiOperation({ summary: 'Get transactions of the authenticated user' })
  @ApiBearerAuth()
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getMyTransactions(
      @CurrentUser() user: { id: string },
      @Query('page') page = 1,
      @Query('limit') limit = 20,
  ) {
    return this.transactionService.findByUserId(user.id, page, limit);
  }

  @UseGuards(JwtAuthGuard)
  @Post('set-referral')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Set referral code for the current user' })
  @ApiResponse({ status: 200, description: 'Referral code set successfully' })
  async setReferral(
      @CurrentUser() user: { id: string },
      @Body() dto: SetReferralDto,
  ) {
    try {
      return await this.userService.setReferral(user.id, dto.code);
    } catch (err: any) {
      throw new BadRequestException(err.message);
    }
  }


  @UseGuards(JwtAuthGuard)
  @Post('become-executor')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Become executor' })
  @ApiResponse({ status: 200, description: 'Role updated to EXECUTOR' })
  async becomeExecutor(@Request() req: any) {
    await this.userService.setExecutorRole(req.user.id)
    return { message: 'Role updated to EXECUTOR' }
  }
}
