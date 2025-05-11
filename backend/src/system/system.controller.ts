import {Controller, Get, Param, Query, Req, UseGuards} from '@nestjs/common';
import {ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags} from '@nestjs/swagger';
import { SystemService } from './system.service';
import { JwtAuthGuard } from '../auth/strategies/jwt.guard';
import {CurrentUser} from "../common/decorators/current-user.decorator";
import {User as PrismaUser} from "@prisma/client";

@ApiTags('Systems')
@Controller('system')
export class SystemController {
  constructor(private readonly systemService: SystemService) {}

  @Get()
  @ApiOperation({ summary: 'Get all systems' })
  getAll() {
    return this.systemService.findAll();
  }

  @Get('search')
  @ApiOperation({ summary: 'Search systems by name (min 3 chars)' })
  @ApiQuery({ name: 'q', required: true, type: String })
  search(@Query('q') query: string) {
    if (!query || query.length < 3) return [];
    return this.systemService.searchByName(query);
  }

  @UseGuards(JwtAuthGuard)
  @Get('info/:systemId')
  @ApiOperation({ summary: 'Get EVE system info from ESI (auth required)' })
  @ApiParam({ name: 'systemId', type: Number, example: 30000142 })
  async getSystemInfo(
      @Param('systemId') systemId: number,
      @CurrentUser() user: PrismaUser,
  ) {
    return this.systemService.getSystemInfo(systemId, user.id)
  }
}
