import {
  Controller,
  Post,
  Param,
  Body,
  Get,
  UseGuards,
} from '@nestjs/common';
import { ReviewService } from './review.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { JwtAuthGuard } from '../auth/strategies/jwt.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '@prisma/client';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('Reviews')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('order/:id/review')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Post()
  @ApiOperation({ summary: 'Leave a review for a completed order' })
  create(
      @Param('id') orderId: string,
      @CurrentUser() user: User,
      @Body() dto: CreateReviewDto,
  ) {
    return this.reviewService.create(orderId, user.id, dto);
  }

  @Get('/user/:userId')
  @ApiOperation({ summary: 'Get reviews for a specific user' })
  getUserReviews(@Param('userId') userId: string) {
    return this.reviewService.getByUser(userId);
  }
}
