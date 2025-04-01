import {
    Controller,
    Get,
    Post,
    Req,
    Res,
    UseGuards,
    Body,
    Query,
    HttpCode,
    HttpStatus,
    BadRequestException
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { Response, Request } from 'express';
import { JwtAuthGuard } from './strategies/jwt.guard';
import {ApiTags, ApiOperation, ApiBearerAuth, ApiBody, ApiOkResponse, ApiResponse, ApiQuery} from '@nestjs/swagger';

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
            const redirectUrl = `${process.env.FRONTEND_URL}/auth-success?token=${jwt}`
            return res.redirect(redirectUrl)
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

    @Get('discord/callback')
    async discordCallback(@Query('code') code: string, @Res() res: Response) {
        const data = await this.authService.fetchDiscordData(code)
        const script = `
            window.opener.postMessage({
                type: 'DISCORD_LINK',
                payload: {
                    id: "${data?.id}"
                }
            }, '*');
            window.close();
            `;

        res.setHeader('Content-Type', 'text/html')
        res.send(`<html><body><script>${script}</script></body></html>`)
    }


    @Post('link')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Link Discord account to current user' })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                id: { type: 'string', example: '235822777678954496' },
            },
            required: ['id'],
        },
    })
    @ApiResponse({ status: 200, description: 'Discord account linked' })
    @ApiResponse({ status: 400, description: 'Missing or invalid Discord ID' })
    async linkDiscord(@Body('id') id: string, @Req() req: any) {
        console.log('🟡 Discord ID:', id);
        console.log('🟢 User ID from JWT:', req.user?.id);

        if (!id) {
            console.error('🔴 Missing Discord ID!');
            throw new BadRequestException('Discord ID is required');
        }

        const result = await this.authService.linkDiscord(req.user.id, id );

        console.log('✅ Discord linked successfully for user:', req.user.id);

        return result;
    }

}
