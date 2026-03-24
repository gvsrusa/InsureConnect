import { Module } from "@nestjs/common";

import { RateLimitService } from "../../common/rate-limit/rate-limit.service";
import { ApiKeyGuard } from "../../common/guards/api-key.guard";
import { PartnersModule } from "../partners/partners.module";
import { PoliciesModule } from "../policies/policies.module";
import { QuotesModule } from "../quotes/quotes.module";
import { WebhooksModule } from "../webhooks/webhooks.module";
import { PartnerApiController } from "./partner-api.controller";
import { PartnerApiService } from "./partner-api.service";

@Module({
  imports: [PartnersModule, QuotesModule, PoliciesModule, WebhooksModule],
  controllers: [PartnerApiController],
  providers: [PartnerApiService, ApiKeyGuard, RateLimitService],
  exports: [PartnerApiService]
})
export class PartnerApiModule {}
