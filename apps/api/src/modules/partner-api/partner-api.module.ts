import { Module } from "@nestjs/common";

import { RateLimitService } from "../../common/rate-limit/rate-limit.service";
import { ApiKeyGuard } from "../../common/guards/api-key.guard";
import { PartnersModule } from "../partners/partners.module";
import { PoliciesModule } from "../policies/policies.module";
import { QuotesModule } from "../quotes/quotes.module";
import { PartnerApiController } from "./partner-api.controller";

@Module({
  imports: [PartnersModule, QuotesModule, PoliciesModule],
  controllers: [PartnerApiController],
  providers: [ApiKeyGuard, RateLimitService]
})
export class PartnerApiModule {}
