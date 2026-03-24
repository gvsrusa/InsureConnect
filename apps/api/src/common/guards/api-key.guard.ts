import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException
} from "@nestjs/common";
import { Request } from "express";

import { RateLimitService } from "../rate-limit/rate-limit.service";
import { PartnersService } from "../../modules/partners/partners.service";

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    private readonly partnersService: PartnersService,
    private readonly rateLimitService: RateLimitService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request & { partner?: unknown }>();
    const apiKey = request.headers["x-api-key"];

    if (!apiKey || typeof apiKey !== "string") {
      throw new UnauthorizedException("API key required");
    }

    const partner = await this.partnersService.validateApiKey(apiKey);
    if (!partner) {
      throw new UnauthorizedException("Invalid API key");
    }

    if (!partner.isActive) {
      throw new ForbiddenException("Partner account is disabled");
    }

    const allowed = this.rateLimitService.isAllowed(
      partner.id,
      partner.rateLimitPerMinute
    );
    if (!allowed) {
      throw new HttpException("Rate limit exceeded", HttpStatus.TOO_MANY_REQUESTS);
    }

    request.partner = partner;
    return true;
  }
}
