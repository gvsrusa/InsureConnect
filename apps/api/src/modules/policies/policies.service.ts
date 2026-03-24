import {
  Injectable,
  NotFoundException
} from "@nestjs/common";
import { Policy, PolicyEventType, PolicyStatus } from "@prisma/client";

import { PrismaService } from "../../prisma/prisma.service";
import { AgentsService } from "../agents/agents.service";
import { BindPolicyDto } from "./dto/bind-policy.dto";

export interface PolicyDetail {
  id: string;
  policyNumber: string;
  carrierName: string;
  premiumCents: number;
  status: string;
  effectiveDate: string;
  expirationDate: string;
  assignedAgentId: string | null;
  createdAt: string;
}

@Injectable()
export class PoliciesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly agentsService: AgentsService
  ) {}

  async bindPolicy(
    dto: BindPolicyDto,
    partnerId: string
  ): Promise<PolicyDetail> {
    // Validate the quote request belongs to this partner
    const quoteRequest = await this.prisma.quoteRequest.findFirst({
      where: { id: dto.quoteRequestId, partnerId }
    });
    if (!quoteRequest) {
      throw new NotFoundException(
        `Quote request ${dto.quoteRequestId} not found for this partner`
      );
    }

    // Validate the quote belongs to that request
    const quote = await this.prisma.quote.findFirst({
      where: { id: dto.quoteId, quoteRequestId: dto.quoteRequestId }
    });
    if (!quote) {
      throw new NotFoundException(`Quote ${dto.quoteId} not found`);
    }

    // Assign an agent (round-robin)
    let agentId: string | null = null;
    try {
      const agent = await this.agentsService.assignAgent(dto.quoteRequestId);
      agentId = agent.id;
    } catch {
      // If no agents available, continue without assignment
    }

    // Generate policy number
    const policyNumber = `POL-${Date.now()}-${Math.floor(Math.random() * 9000) + 1000}`;

    const effectiveDate = new Date();
    const expirationDate = new Date(effectiveDate);
    expirationDate.setFullYear(expirationDate.getFullYear() + 1);

    const policy = await this.prisma.policy.create({
      data: {
        quoteRequestId: dto.quoteRequestId,
        quoteId: dto.quoteId,
        policyNumber,
        carrierName: quote.carrierName,
        premiumCents: quote.premiumCents,
        status: PolicyStatus.ACTIVE,
        effectiveDate,
        expirationDate
      }
    });

    // Record the policy issuance event
    await this.prisma.policyEvent.create({
      data: {
        policyId: policy.id,
        type: PolicyEventType.ISSUED,
        payload: {
          agentId,
          carrierName: quote.carrierName,
          bindDate: new Date().toISOString(),
          partnerId
        }
      }
    });

    return this.toPolicyDetail(policy, agentId);
  }

  async listPoliciesForPartner(partnerId: string): Promise<PolicyDetail[]> {
    const quoteRequests = await this.prisma.quoteRequest.findMany({
      where: { partnerId },
      select: { id: true }
    });

    const qrIds = quoteRequests.map((qr) => qr.id);

    const policies = await this.prisma.policy.findMany({
      where: { quoteRequestId: { in: qrIds } },
      orderBy: { createdAt: "desc" },
      include: { events: { orderBy: { createdAt: "desc" }, take: 1 } }
    });

    return policies.map((policy) => {
      const lastEvent = policy.events[0];
      const payload = lastEvent?.payload as Record<string, unknown> | null;
      const agentId =
        typeof payload?.agentId === "string" ? payload.agentId : null;
      return this.toPolicyDetail(policy, agentId);
    });
  }

  private toPolicyDetail(policy: Policy, agentId: string | null): PolicyDetail {
    return {
      id: policy.id,
      policyNumber: policy.policyNumber,
      carrierName: policy.carrierName,
      premiumCents: policy.premiumCents,
      status: policy.status,
      effectiveDate: policy.effectiveDate.toISOString(),
      expirationDate: policy.expirationDate.toISOString(),
      assignedAgentId: agentId,
      createdAt: policy.createdAt.toISOString()
    };
  }
}
