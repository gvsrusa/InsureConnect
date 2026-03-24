import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post
} from "@nestjs/common";
import { QuoteRequestStatus, UserRole } from "@prisma/client";

import { CurrentUser, JwtUser } from "../../common/decorators/current-user.decorator";
import { PrismaService } from "../../prisma/prisma.service";

@Controller("api/v1/agent")
export class AgentController {
  constructor(private readonly prisma: PrismaService) {}

  @Get("dashboard")
  async dashboard(@CurrentUser() user: JwtUser) {
    const assignmentWhere =
      user.role === UserRole.AGENT ? { agentId: user.userId } : undefined;

    const assignments = await this.prisma.agentAssignment.findMany({
      where: assignmentWhere,
      include: {
        quoteRequest: {
          include: {
            requester: true,
            quotes: {
              orderBy: { annualPremiumCents: "asc" }
            }
          }
        }
      },
      orderBy: { assignedAt: "desc" },
      take: 5
    });

    const assignedQuotes = await this.prisma.agentAssignment.count({ where: assignmentWhere });

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const boundThisMonth = await this.prisma.policy.count({
      where: { createdAt: { gte: monthStart } }
    });

    const activePolicies = await this.prisma.policy.count({
      where: { status: "ACTIVE" }
    });

    const recentQuoteRequests = assignments.length > 0
      ? assignments.map((assignment) => this.toQuoteRequest(assignment.quoteRequest))
      : (await this.prisma.quoteRequest.findMany({
          include: {
            requester: true,
            quotes: {
              orderBy: { annualPremiumCents: "asc" }
            }
          },
          orderBy: { createdAt: "desc" },
          take: 5
        })).map((quoteRequest) => this.toQuoteRequest(quoteRequest));

    return {
      assignedQuotes,
      boundThisMonth,
      activePolicies,
      conversionRate: assignedQuotes === 0 ? 0 : Number((boundThisMonth / assignedQuotes).toFixed(2)),
      recentQuoteRequests
    };
  }

  @Get("quote-requests")
  async quoteRequests(@CurrentUser() user: JwtUser) {
    const quoteRequests = await this.prisma.quoteRequest.findMany({
      where:
        user.role === UserRole.AGENT
          ? {
              agentAssignments: {
                some: { agentId: user.userId }
              }
            }
          : undefined,
      include: {
        requester: true,
        quotes: {
          orderBy: { annualPremiumCents: "asc" }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    return quoteRequests.map((quoteRequest) => this.toQuoteRequest(quoteRequest));
  }

  @Get("quote-requests/:id")
  async quoteRequest(@Param("id") id: string, @CurrentUser() user: JwtUser) {
    const quoteRequest = await this.prisma.quoteRequest.findFirst({
      where: {
        id,
        ...(user.role === UserRole.AGENT
          ? {
              agentAssignments: {
                some: { agentId: user.userId }
              }
            }
          : {})
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

  @Get("policies")
  async policies() {
    const policies = await this.prisma.policy.findMany({
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

    return policies.map((policy) => ({
      id: policy.id,
      carrierName: policy.carrierName,
      policyNumber: policy.policyNumber,
      status: this.toPolicyStatus(policy.status),
      effectiveDate: policy.effectiveDate.toISOString(),
      expirationDate: policy.expirationDate.toISOString(),
      premium: Math.round(policy.premiumCents / 100),
      coverageType: policy.quoteRequest.coverageType,
      clientName:
        policy.user?.fullName ??
        policy.quoteRequest.requester?.fullName ??
        policy.quoteRequest.businessName
    }));
  }

  @Post("quote-requests/:id/recommend")
  async recommend(@Param("id") id: string, @Body() body: { quoteId?: string }) {
    const quoteRequest = await this.prisma.quoteRequest.findUnique({
      where: { id },
      include: { quotes: true }
    });

    if (!quoteRequest) {
      throw new NotFoundException(`Quote request ${id} not found`);
    }

    const recommendedQuote = quoteRequest.quotes.find((quote) => quote.id === body.quoteId);
    if (!recommendedQuote) {
      throw new NotFoundException(`Quote ${body.quoteId ?? ""} not found`);
    }

    await this.prisma.quoteRequest.update({
      where: { id },
      data: { status: QuoteRequestStatus.IN_REVIEW }
    });

    return { ok: true, recommendedQuoteId: recommendedQuote.id };
  }

  @Post("quote-requests/:id/requote")
  async requote(@Param("id") id: string) {
    const quoteRequest = await this.prisma.quoteRequest.findUnique({ where: { id } });
    if (!quoteRequest) {
      throw new NotFoundException(`Quote request ${id} not found`);
    }

    await this.prisma.quoteRequest.update({
      where: { id },
      data: { status: QuoteRequestStatus.IN_REVIEW }
    });

    return { ok: true };
  }

  private toQuoteRequest(quoteRequest: {
    id: string;
    status: string;
    coverageType: string;
    createdAt: Date;
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
      status: this.toQuoteStatus(quoteRequest.status),
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

  private toQuoteStatus(status: string): "PENDING" | "COMPLETED" | "FAILED" {
    if (status === "QUOTED") {
      return "COMPLETED";
    }

    if (status === "DECLINED") {
      return "FAILED";
    }

    return "PENDING";
  }

  private toPolicyStatus(status: string): "ACTIVE" | "CANCELLED" | "EXPIRED" {
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
