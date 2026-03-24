import { Module } from "@nestjs/common";
import { AgentController } from "./agent.controller";
import { AgentsService } from "./agents.service";
import { UsersModule } from "../users/users.module";

@Module({
  imports: [UsersModule],
  controllers: [AgentController],
  providers: [AgentsService],
  exports: [AgentsService]
})
export class AgentsModule {}
