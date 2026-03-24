import { Body, Controller, Get, Param, Post } from "@nestjs/common";

import { PrismaService } from "../../prisma/prisma.service";
import { PartnersService } from "./partners.service";
import { CreatePartnerDto } from "./dto/create-partner.dto";

@Controller("api/v1/admin")
export class AdminController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly partnersService: PartnersService
  ) {}

  @Get("analytics")
  async analytics() {
    const [totalRequests, successfulRequests, boundPolicies, callsToday, quotes] = await Promise.all([
      this.prisma.quoteRequest.count(),
      this.prisma.quoteRequest.count({ where: { status: "QUOTED" } }),
      this.prisma.policy.count({ where: { status: "ACTIVE" } }),
      this.prisma.quoteRequest.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      }),
      this.prisma.quote.findMany({
        select: {
          createdAt: true,
          quoteRequest: {
            select: { createdAt: true }
          }
        }
      })
    ]);

    const avgResponseMs =
      quotes.length === 0
        ? 180
        : Math.max(
            180,
            Math.round(
              quotes.reduce((total, quote) => {
                return total + (quote.createdAt.getTime() - quote.quoteRequest.createdAt.getTime());
              }, 0) / quotes.length
            )
          );

    return {
      totalRequests,
      successRate: totalRequests === 0 ? 0 : Number((successfulRequests / totalRequests).toFixed(2)),
      boundPolicies,
      apiCallsToday: callsToday,
      avgResponseMs
    };
  }

  @Get("partners")
  async partners() {
    const partners = await this.partnersService.listAll();
    return partners.map((partner) => ({
      id: partner.id,
      name: partner.name,
      slug: partner.slug,
      apiKeyPrefix: partner.apiKeyPrefix,
      rateLimitPerMinute: partner.rateLimitPerMinute,
      isActive: partner.isActive,
      createdAt: partner.createdAt.toISOString()
    }));
  }

  @Post("partners")
  async createPartner(@Body() dto: CreatePartnerDto) {
    const slug = dto.slug ?? this.slugify(dto.name);
    const result = await this.partnersService.create({
      name: dto.name,
      slug,
      rateLimitPerMinute: dto.rateLimitPerMinute
    });

    return {
      id: result.partner.id,
      name: result.partner.name,
      slug: result.partner.slug,
      apiKeyPrefix: result.partner.apiKeyPrefix,
      rawApiKey: result.rawApiKey,
      rateLimitPerMinute: result.partner.rateLimitPerMinute,
      isActive: result.partner.isActive,
      createdAt: result.partner.createdAt.toISOString()
    };
  }

  @Post("partners/:id/rotate-key")
  async rotatePartnerKey(@Param("id") id: string) {
    const result = await this.partnersService.rotateApiKey(id);
    const partner = await this.partnersService.findById(id);

    return {
      id: partner.id,
      apiKeyPrefix: partner.apiKeyPrefix,
      rawApiKey: result.rawApiKey
    };
  }

  @Get("quote-requests")
  async quoteRequests() {
    const quoteRequests = await this.prisma.quoteRequest.findMany({
      include: {
        requester: true,
        quotes: {
          orderBy: { annualPremiumCents: "asc" }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    return quoteRequests.map((quoteRequest) => ({
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
    }));
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

  private slugify(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
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
