import { Body, Controller, Get, NotFoundException, Param, Post } from "@nestjs/common";
import { PolicyStatus, UserRole } from "@prisma/client";

import { CurrentUser, JwtUser } from "../../common/decorators/current-user.decorator";
import { PrismaService } from "../../prisma/prisma.service";
import { PoliciesService } from "./policies.service";
import { BindPolicyDto } from "./dto/bind-policy.dto";
import { QuotesService } from "../quotes/quotes.service";
import { CreateQuoteRequestDto } from "../quotes/dto/create-quote-request.dto";

type PortalPolicyRecord = Awaited<ReturnType<PrismaService["policy"]["findMany"]>>[number];
type PortalQuoteRequestRecord = Awaited<ReturnType<PrismaService["quoteRequest"]["findFirst"]>>;

@Controller("api/v1/portal")
export class PortalController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly quotesService: QuotesService,
    private readonly policiesService: PoliciesService
  ) {}

  @Get("dashboard")
  async dashboard(@CurrentUser() user: JwtUser) {
    const quoteRequestWhere = user.role === UserRole.ADMIN ? undefined : { requesterId: user.userId };

    const policies = await this.prisma.policy.findMany({
      where: user.role === UserRole.ADMIN ? undefined : { userId: user.userId },
      include: {
        quoteRequest: {
          include: {
            requester: true
          }
        },
        user: true
      },
      orderBy: { createdAt: "desc" },
      take: 4
    });

    const activePolicies = await this.prisma.policy.count({
      where: {
        status: PolicyStatus.ACTIVE,
        ...(user.role === UserRole.ADMIN ? {} : { userId: user.userId })
      }
    });

    const pendingQuotes = await this.prisma.quoteRequest.count({
      where: {
        status: { in: ["NEW", "IN_REVIEW"] },
        ...(quoteRequestWhere ?? {})
      }
    });

    const latestQuoteRequest = await this.prisma.quoteRequest.findFirst({
      where: quoteRequestWhere,
      orderBy: { createdAt: "desc" },
      select: { id: true }
    });

    const annualPremiumAggregate = await this.prisma.policy.aggregate({
      _sum: { premiumCents: true },
      where: {
        status: PolicyStatus.ACTIVE,
        ...(user.role === UserRole.ADMIN ? {} : { userId: user.userId })
      }
    });

    return {
      activePolicies,
      pendingQuotes,
      annualPremium: Math.round((annualPremiumAggregate._sum.premiumCents ?? 0) / 100),
      latestQuoteRequestId: latestQuoteRequest?.id,
      recentPolicies: policies.map((policy) => this.toPolicy(policy))
    };
  }

  @Get("policies")
  async policies(@CurrentUser() user: JwtUser) {
    const policies = await this.prisma.policy.findMany({
      where: user.role === UserRole.ADMIN ? undefined : { userId: user.userId },
      include: {
        quoteRequest: {
          include: {
            requester: true
          }
        },
        user: true
      },
      orderBy: { createdAt: "desc" }
    });

    return policies.map((policy) => this.toPolicy(policy));
  }

  @Get("policies/:id")
  async policy(@Param("id") id: string, @CurrentUser() user: JwtUser) {
    const policy = await this.prisma.policy.findFirst({
      where: {
        id,
        ...(user.role === UserRole.ADMIN ? {} : { userId: user.userId })
      },
      include: {
        quoteRequest: {
          include: {
            requester: true
          }
        },
        user: true
      }
    });

    if (!policy) {
      throw new NotFoundException(`Policy ${id} not found`);
    }

    return this.toPolicy(policy);
  }

  @Get("agent")
  async agent() {
    const agent = await this.prisma.user.findFirst({
      where: {
        roles: {
          some: {
            role: UserRole.AGENT
          }
        }
      },
      orderBy: { createdAt: "asc" }
    });

    if (!agent) {
      throw new NotFoundException("No agent is available");
    }

    const policiesManaged = await this.prisma.agentAssignment.count({
      where: { agentId: agent.id }
    });

    return {
      id: agent.id,
      name: agent.fullName,
      email: agent.email,
      phone: "(512) 555-0143",
      bio: "Licensed Goosehead-style advisor specializing in bundled coverage and policy comparisons.",
      rating: 4.9,
      policiesManaged,
      isOnline: true
    };
  }

  @Post("quotes")
  async createQuoteRequest(
    @Body() dto: CreateQuoteRequestDto,
    @CurrentUser() user: JwtUser
  ) {
    const partner = await this.prisma.partner.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: "asc" }
    });

    if (!partner) {
      throw new NotFoundException("No active quoting partner is available");
    }

    return this.quotesService.createQuoteRequest(dto, partner.id, user.userId);
  }

  @Get("quotes/:id")
  async quoteRequest(@Param("id") id: string, @CurrentUser() user: JwtUser) {
    const quoteRequest = await this.prisma.quoteRequest.findFirst({
      where: {
        id,
        ...(user.role === UserRole.ADMIN ? {} : { requesterId: user.userId })
      },
      include: {
        requester: true,
        quotes: {
          orderBy: { annualPremiumCents: "asc" }
        }
      }
    });

    if (!quoteRequest) {
      throw new NotFoundException(`Quote request ${id} not found`);
    }

    return this.toQuoteRequest(quoteRequest);
  }

  @Post("quotes/:id/bind")
  async bindQuoteRequest(
    @Param("id") id: string,
    @Body() body: Omit<BindPolicyDto, "quoteRequestId">,
    @CurrentUser() user: JwtUser
  ) {
    const quoteRequest = await this.prisma.quoteRequest.findFirst({
      where: {
        id,
        ...(user.role === UserRole.ADMIN ? {} : { requesterId: user.userId })
      },
      select: {
        id: true,
        partnerId: true
      }
    });

    if (!quoteRequest) {
      throw new NotFoundException(`Quote request ${id} not found`);
    }

    return this.policiesService.bindPolicy(
      {
        quoteRequestId: quoteRequest.id,
        quoteId: body.quoteId
      },
      quoteRequest.partnerId,
      user.userId
    );
  }

  private toPolicy(policy: PortalPolicyRecord & {
    quoteRequest: { coverageType: string; businessName: string; requester: { fullName: string; email: string } | null };
    user: { fullName: string | null } | null;
  }) {
    return {
      id: policy.id,
      carrierName: policy.carrierName,
      policyNumber: policy.policyNumber,
      status: this.toPortalPolicyStatus(policy.status),
      effectiveDate: policy.effectiveDate.toISOString(),
      expirationDate: policy.expirationDate.toISOString(),
      premium: Math.round(policy.premiumCents / 100),
      coverageType: policy.quoteRequest.coverageType,
      clientName:
        policy.user?.fullName ??
        policy.quoteRequest.requester?.fullName ??
        policy.quoteRequest.businessName
    };
  }

  private toQuoteRequest(quoteRequest: NonNullable<PortalQuoteRequestRecord> & {
    requester: { email: string } | null;
    quotes: Array<{
      id: string;
      carrierName: string;
      premiumCents: number;
      annualPremiumCents: number | null;
      coverageSummary: unknown;
      updatedAt: Date;
    }>;
  }) {
    return {
      id: quoteRequest.id,
      status: this.toPortalQuoteStatus(quoteRequest.status),
      productType: this.toProductType(quoteRequest.coverageType),
      createdAt: quoteRequest.createdAt.toISOString(),
      clientEmail: quoteRequest.requester?.email,
      quotes: quoteRequest.quotes.map((quote) => ({
        id: quote.id,
        carrierName: quote.carrierName,
        monthlyPremium: Math.round(quote.premiumCents / 100),
        annualPremium: Math.round((quote.annualPremiumCents ?? quote.premiumCents * 12) / 100),
        coverageSummary: (quote.coverageSummary as Record<string, unknown> | null) ?? {},
        expiresAt: new Date(quote.updatedAt.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()
      }))
    };
  }

  private toPortalQuoteStatus(status: string): "PENDING" | "COMPLETED" | "FAILED" {
    if (status === "QUOTED") {
      return "COMPLETED";
    }

    if (status === "DECLINED") {
      return "FAILED";
    }

    return "PENDING";
  }

  private toPortalPolicyStatus(status: string): "ACTIVE" | "CANCELLED" | "EXPIRED" {
    if (status === "CANCELLED") {
      return "CANCELLED";
    }

    if (status === "EXPIRED") {
      return "EXPIRED";
    }

    return "ACTIVE";
  }

  private toProductType(coverageType: string): "AUTO" | "HOME" {
    return coverageType === "HOME" ? "HOME" : "AUTO";
  }
}
