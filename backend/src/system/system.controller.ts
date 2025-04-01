import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { SystemService } from './system.service';

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
}
