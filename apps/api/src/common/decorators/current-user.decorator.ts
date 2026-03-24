import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { Request } from "express";

export interface JwtUser {
  userId: string;
  email: string;
  role: UserRole;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtUser => {
    const request = ctx
      .switchToHttp()
      .getRequest<Request & { user?: JwtUser }>();
    if (!request.user) {
      throw new Error("JwtUser not found on request");
    }
    return request.user;
  }
);
