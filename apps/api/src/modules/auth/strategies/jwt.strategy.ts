import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { UserRole } from "@prisma/client";
import { ExtractJwt, Strategy } from "passport-jwt";

import { JwtUser } from "../../../common/decorators/current-user.decorator";

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, "jwt") {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>("JWT_SECRET")
    });
  }

  validate(payload: JwtPayload): JwtUser {
    if (!payload.sub || !payload.email || !payload.role) {
      throw new UnauthorizedException("Invalid token payload");
    }
    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role
    };
  }
}
