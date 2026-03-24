import { Injectable, Logger, BadRequestException } from "@nestjs/common";
import { QuoteRequest, Policy } from "@prisma/client";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateQuoteRequestDto } from "../quotes/dto/create-quote-request.dto";
import { BindPolicyDto } from "../policies/dto/bind-policy.dto";
import { WebhooksService } from "../webhooks/webhooks.service";

@Injectable()
export class PartnerApiService {
  private readonly logger = new Logger(PartnerApiService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly webhooksService: WebhooksService
  ) {}

  /**
   * Create and submit a quote request from a partner
   */
  async createQuoteRequest(
    dto: CreateQuoteRequestDto,
    partnerId: string
  ): Promise<QuoteRequest> {
    this.logger.debug(`Creating quote request for partner ${partnerId}`);

    const quoteRequest = await this.prisma.quoteRequest.create({
      data: {
        externalRef: `${partnerId}-${Date.now()}`,
        partnerId,
        businessName: dto.businessName,
        coverageType: dto.coverageType,
        state: dto.state,
        annualRevenue: dto.annualRevenue
      }
    });

    this.logger.log(
      `Quote request created: ${quoteRequest.id} for partner ${partnerId}`
    );

    return quoteRequest;
  }

  /**
   * List all quote requests for a partner
   */
  async listQuoteRequests(partnerId: string) {
    return this.prisma.quoteRequest.findMany({
      where: { partnerId },
      include: {
        quotes: {
          orderBy: { annualPremiumCents: "asc" }
        }
      },
      orderBy: { createdAt: "desc" }
    });
  }

  /**
   * Get a specific quote request for a partner
   */
  async getQuoteRequest(id: string, partnerId: string) {
    const quoteRequest = await this.prisma.quoteRequest.findFirst({
      where: { id, partnerId },
      include: {
        quotes: {
          orderBy: { annualPremiumCents: "asc" }
        },
        agentAssignments: {
          include: { agent: true }
        }
      }
    });

    if (!quoteRequest) {
      throw new BadRequestException(
        `Quote request ${id} not found for partner ${partnerId}`
      );
    }

    return quoteRequest;
  }

  /**
   * Bind a policy from a quote for a partner
   */
  async bindPolicy(dto: BindPolicyDto, partnerId: string): Promise<Policy> {
    this.logger.debug(`Binding policy for partner ${partnerId}`);

    // Verify the quote request belongs to this partner
    const quoteRequest = await this.prisma.quoteRequest.findFirst({
      where: { id: dto.quoteRequestId, partnerId }
    });

    if (!quoteRequest) {
      throw new BadRequestException(
        `Quote request ${dto.quoteRequestId} not found for partner ${partnerId}`
      );
    }

    // Verify the quote exists and belongs to this quote request
    const quote = await this.prisma.quote.findFirst({
      where: { id: dto.quoteId, quoteRequestId: dto.quoteRequestId }
    });

    if (!quote) {
      throw new BadRequestException(
        `Quote ${dto.quoteId} not found for quote request ${dto.quoteRequestId}`
      );
    }

    // Create the policy
    const policy = await this.prisma.policy.create({
      data: {
        policyNumber: `POL-${Date.now()}`,
        quoteRequestId: dto.quoteRequestId,
        quoteId: dto.quoteId,
        carrierName: quote.carrierName,
        premiumCents: quote.premiumCents,
        effectiveDate: dto.effectiveDate,
        expirationDate: dto.expirationDate
      }
    });

    this.logger.log(
      `Policy bound: ${policy.policyNumber} for partner ${partnerId}`
    );

    // Trigger webhook event
    try {
      await this.webhooksService.onPolicyCreated(policy.id, {
        policyNumber: policy.policyNumber,
        carrierName: policy.carrierName,
        premiumCents: policy.premiumCents,
        effectiveDate: policy.effectiveDate.toISOString(),
        expirationDate: policy.expirationDate.toISOString()
      } as Prisma.InputJsonValue);
    } catch (error) {
      this.logger.warn(`Failed to trigger webhook for policy ${policy.id}: ${(error as Error).message}`);
      // Don't fail the policy creation if webhook fails
    }

    return policy;
  }

  /**
   * List all policies for a partner
   */
  async listPolicies(partnerId: string) {
    return this.prisma.policy.findMany({
      where: {
        quoteRequest: {
          partnerId
        }
      },
      include: {
        quote: true,
        quoteRequest: true
      },
      orderBy: { createdAt: "desc" }
    });
  }

  /**
   * Get partner API usage statistics
   */
  async getApiUsageStats(partnerId: string) {
    const [
      totalQuoteRequests,
      quotesThisMonth,
      policiesBound,
      activePolicies
    ] = await Promise.all([
      this.prisma.quoteRequest.count({ where: { partnerId } }),
      this.prisma.quoteRequest.count({
        where: {
          partnerId,
          createdAt: {
            gte: this.getMonthStart()
          }
        }
      }),
      this.prisma.policy.count({
        where: {
          quoteRequest: { partnerId }
        }
      }),
      this.prisma.policy.count({
        where: {
          quoteRequest: { partnerId },
          status: "ACTIVE"
        }
      })
    ]);

    return {
      totalQuoteRequests,
      quotesThisMonth,
      policiesBound,
      activePolicies,
      bindRate: totalQuoteRequests === 0 ? 0 : (policiesBound / totalQuoteRequests)
    };
  }

  private getMonthStart(): Date {
    const date = new Date();
    date.setDate(1);
    date.setHours(0, 0, 0, 0);
    return date;
  }
}
