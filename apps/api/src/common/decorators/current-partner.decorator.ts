import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { Partner } from "@prisma/client";
import { Request } from "express";

export const CurrentPartner = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): Partner => {
    const request = ctx
      .switchToHttp()
      .getRequest<Request & { partner?: Partner }>();
    if (!request.partner) {
      throw new Error("Partner not found on request");
    }
    return request.partner;
  }
);
