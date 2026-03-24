import {
  Injectable,
  UnauthorizedException
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { User } from "@prisma/client";
import { randomUUID } from "crypto";

import { CacheService } from "../../common/cache/cache.service";
import { UsersService } from "../users/users.service";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse extends TokenPair {
  user: {
    id: string;
    email: string;
    fullName: string;
    role: string;
  };
}

const REFRESH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days
const ACCESS_TOKEN_EXPIRY = "15m";

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly cacheService: CacheService
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponse> {
    const user = await this.usersService.create({
      email: dto.email,
      fullName: dto.fullName,
      password: dto.password
    });

    return this.buildAuthResponse(user);
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const valid = await this.usersService.validatePassword(user, dto.password);
    if (!valid) {
      throw new UnauthorizedException("Invalid credentials");
    }

    return this.buildAuthResponse(user);
  }

  async refresh(refreshToken: string): Promise<TokenPair> {
    let payload: { sub: string; email: string; role: string; jti: string };
    try {
      payload = this.jwtService.verify<typeof payload>(refreshToken, {
        secret: this.configService.getOrThrow<string>("JWT_REFRESH_SECRET")
      });
    } catch {
      throw new UnauthorizedException("Invalid or expired refresh token");
    }

    const isRevoked = await this.cacheService.has(
      `revoked:refresh:${payload.jti}`
    );
    if (isRevoked) {
      throw new UnauthorizedException("Refresh token has been revoked");
    }

    const user = await this.usersService.findById(payload.sub);
    return this.signTokens(user);
  }

  async logout(refreshToken: string): Promise<void> {
    try {
      const payload = this.jwtService.decode(refreshToken) as {
        jti?: string;
        exp?: number;
      } | null;
      if (payload?.jti) {
        const ttl = payload.exp
          ? payload.exp - Math.floor(Date.now() / 1000)
          : REFRESH_TOKEN_TTL_SECONDS;
        await this.cacheService.set(
          `revoked:refresh:${payload.jti}`,
          true,
          Math.max(ttl, 0)
        );
      }
    } catch {
      // Silently ignore malformed tokens on logout
    }
  }

  private async buildAuthResponse(user: User): Promise<AuthResponse> {
    const tokens = await this.signTokens(user);
    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role
      }
    };
  }

  private signTokens(user: User): TokenPair {
    const jti = randomUUID();

    const accessToken = this.jwtService.sign(
      { sub: user.id, email: user.email, role: user.role },
      { expiresIn: ACCESS_TOKEN_EXPIRY }
    );

    const refreshToken = this.jwtService.sign(
      { sub: user.id, email: user.email, role: user.role, jti },
      {
        secret: this.configService.getOrThrow<string>("JWT_REFRESH_SECRET"),
        expiresIn: "7d"
      }
    );

    return { accessToken, refreshToken };
  }
}
