import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards
} from "@nestjs/common";
import { Request, Response } from "express";

import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { Public } from "../../common/decorators/public.decorator";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";

const REFRESH_COOKIE = "refresh_token";
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days in ms

@Controller("api/v1/auth")
@UseGuards(JwtAuthGuard)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post("register")
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response
  ) {
    const result = await this.authService.register(dto);
    this.setRefreshCookie(res, result.refreshToken);
    return { accessToken: result.accessToken, user: result.user };
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post("login")
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response
  ) {
    const result = await this.authService.login(dto);
    this.setRefreshCookie(res, result.refreshToken);
    return { accessToken: result.accessToken, user: result.user };
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post("refresh")
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token = req.cookies?.[REFRESH_COOKIE] as string | undefined;
    if (!token) {
      res.status(HttpStatus.UNAUTHORIZED).json({ message: "No refresh token" });
      return;
    }
    const tokens = await this.authService.refresh(token);
    this.setRefreshCookie(res, tokens.refreshToken);
    return { accessToken: tokens.accessToken };
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Post("logout")
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token = req.cookies?.[REFRESH_COOKIE] as string | undefined;
    if (token) {
      await this.authService.logout(token);
    }
    res.clearCookie(REFRESH_COOKIE);
  }

  private setRefreshCookie(res: Response, token: string): void {
    res.cookie(REFRESH_COOKIE, token, {
      httpOnly: true,
      secure: process.env["NODE_ENV"] === "production",
      sameSite: "lax",
      maxAge: COOKIE_MAX_AGE
    });
  }
}
