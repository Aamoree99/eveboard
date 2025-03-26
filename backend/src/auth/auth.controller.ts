import {Controller, Get, Post, Req, Res, UseGuards, Body, Query} from '@nestjs/common';
import { AuthService } from './auth.service';
import { Response, Request } from 'express';
import { JwtAuthGuard } from './strategies/jwt.guard';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody, ApiOkResponse } from '@nestjs/swagger';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Get('eve')
    @ApiOperation({ summary: 'Редирект на EVE Online SSO' })
    redirectToEve(@Res() res: Response): void {
        const url = this.authService.getEveLoginUrl();
        res.redirect(url);
    }

    @Get('eve/callback')
    async eveGetCallback(
        @Query('code') code: string,
        @Res() res: Response,
    ): Promise<void> {
        // Можно пробросить в фронт, или сразу получить токен
        try {
            const jwt = await this.authService.handleCallback(code);
            res.redirect(`/auth-success?token=${jwt}`); // или отдай токен в cookie
        } catch (err) {
            res.redirect(`/auth-error`);
        }
    }


    @Post('eve/callback')
    @ApiOperation({ summary: 'Получить JWT по коду от EVE' })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                code: { type: 'string', example: 'abc123...' },
            },
        },
    })
    @ApiOkResponse({
        schema: {
            type: 'object',
            properties: {
                token: { type: 'string', example: 'jwt-token-here' },
            },
        },
    })
    async eveCallback(@Body('code') code: string): Promise<{ token: string }> {
        const jwt = await this.authService.handleCallback(code);
        return { token: jwt };
    }

    @UseGuards(JwtAuthGuard)
    @Get('me')
    @ApiOperation({ summary: 'Получить текущего пользователя по JWT' })
    @ApiBearerAuth()
    getMe(@Req() req: Request): any {
        return req.user;
    }
}
