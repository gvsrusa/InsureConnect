import { Module } from "@nestjs/common";
import { AgentsModule } from "../agents/agents.module";
import { QuotesModule } from "../quotes/quotes.module";
import { PoliciesService } from "./policies.service";
import { PortalController } from "./portal.controller";

@Module({
  imports: [AgentsModule, QuotesModule],
  controllers: [PortalController],
  providers: [PoliciesService],
  exports: [PoliciesService]
})
export class PoliciesModule {}
