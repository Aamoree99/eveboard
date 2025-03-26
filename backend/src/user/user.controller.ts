import {Body, Controller, Get, Param, Post, Query, UseGuards} from '@nestjs/common';
import {ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam, ApiBearerAuth} from '@nestjs/swagger';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import {JwtAuthGuard} from "../auth/strategies/jwt.guard";
import {CurrentUser} from "../common/decorators/current-user.decorator";

@ApiTags('Users')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

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
  async getMe(@CurrentUser() user: { userId: string }) {
    return this.userService.findById(user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiParam({ name: 'id', description: 'User ID (cuid)' })
  @ApiResponse({ status: 200, description: 'User found', type: Object })
  getOne(@Param('id') id: string) {
    return this.userService.findPublicById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ status: 201, description: 'User created successfully', type: Object })
  create(@Body() body: CreateUserDto) {
    return this.userService.create(body);
  }
}
