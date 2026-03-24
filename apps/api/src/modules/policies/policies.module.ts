import { Module } from "@nestjs/common";
import { AgentsModule } from "../agents/agents.module";
import { PoliciesService } from "./policies.service";
import { PortalController } from "./portal.controller";

@Module({
  imports: [AgentsModule],
  controllers: [PortalController],
  providers: [PoliciesService],
  exports: [PoliciesService]
})
export class PoliciesModule {}
