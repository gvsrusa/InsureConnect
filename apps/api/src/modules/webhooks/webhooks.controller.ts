import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards
} from "@nestjs/common";
import { WebhooksService } from "./webhooks.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { UserRole, PolicyEventType } from "@prisma/client";
import { Prisma } from "@prisma/client";

@Controller("api/v1/webhooks")
@UseGuards(JwtAuthGuard, RolesGuard)
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Post("policy/:policyId/events")
  @Roles(UserRole.ADMIN, UserRole.PARTNER_UNDERWRITER)
  async triggerPolicyEvent(
    @Param("policyId") policyId: string,
    @Body() body: { event: PolicyEventType; data: Prisma.InputJsonValue }
  ) {
    await this.webhooksService.triggerWebhook({
      event: body.event,
      policyId,
      timestamp: new Date(),
      data: body.data
    });
    return { success: true };
  }

  @Get("policy/:policyId/history")
  @Roles(UserRole.ADMIN, UserRole.PARTNER_UNDERWRITER, UserRole.AGENT)
  async getPolicyWebhookHistory(@Param("policyId") policyId: string) {
    return this.webhooksService.getWebhookHistory(policyId);
  }

  @Get("partner/:partnerId/history")
  @Roles(UserRole.ADMIN, UserRole.PARTNER_UNDERWRITER)
  async getPartnerWebhookHistory(@Param("partnerId") partnerId: string) {
    return this.webhooksService.getPartnerWebhookHistory(partnerId);
  }

  @Post("register")
  @Roles(UserRole.ADMIN, UserRole.PARTNER_UNDERWRITER)
  async registerWebhook(
    @Body() body: { partnerId: string; event: PolicyEventType; url: string }
  ) {
    return this.webhooksService.registerWebhook(body.partnerId, body.event, body.url);
  }
}
