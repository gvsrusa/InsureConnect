import { BadRequestException, Injectable } from "@nestjs/common";
import { User } from "@prisma/client";

import { PrismaService } from "../../prisma/prisma.service";
import { UsersService } from "../users/users.service";

@Injectable()
export class AgentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService
  ) {}

  async getAgents(): Promise<User[]> {
    return this.usersService.findAllAgents();
  }

  /**
   * Assign an agent to a quote request using least-loaded round-robin.
   * Creates an AgentAssignment record and returns the assigned agent.
   */
  async assignAgent(quoteRequestId: string): Promise<User> {
    const agents = await this.usersService.findAllAgents();
    if (agents.length === 0) {
      throw new BadRequestException("No agents available for assignment");
    }

    // Count existing assignments per agent
    const assignmentCounts = await this.prisma.agentAssignment.groupBy({
      by: ["agentId"],
      _count: { agentId: true },
      where: {
        agentId: { in: agents.map((a) => a.id) }
      }
    });

    const countMap = new Map<string, number>(
      assignmentCounts.map((a) => [a.agentId, a._count.agentId])
    );

    let selectedAgent: User | undefined;
    let minCount = Infinity;

    for (const agent of agents) {
      const count = countMap.get(agent.id) ?? 0;
      if (count < minCount) {
        minCount = count;
        selectedAgent = agent;
      }
    }

    if (!selectedAgent) {
      throw new BadRequestException("Could not select an agent");
    }

    // Create assignment (upsert to avoid duplicate error on re-assignment)
    await this.prisma.agentAssignment.upsert({
      where: {
        quoteRequestId_agentId: {
          quoteRequestId,
          agentId: selectedAgent.id
        }
      },
      create: {
        quoteRequestId,
        agentId: selectedAgent.id
      },
      update: {}
    });

    return selectedAgent;
  }
}
