import { Injectable } from "@nestjs/common";
import { PolicyStatus } from "@prisma/client";

import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get dashboard analytics for admin users
   */
  async getAdminDashboardMetrics() {
    const [
      totalQuoteRequests,
      totalPolicies,
      totalPoliciesThisMonth,
      activePolicies,
      totalUsers,
      totalPartners,
      quoteRequestsByStatus,
      policiesByStatus,
      topCarriers
    ] = await Promise.all([
      this.prisma.quoteRequest.count(),
      this.prisma.policy.count(),
      this.prisma.policy.count({
        where: {
          createdAt: {
            gte: this.getMonthStart()
          }
        }
      }),
      this.prisma.policy.count({
        where: { status: PolicyStatus.ACTIVE }
      }),
      this.prisma.user.count(),
      this.prisma.partner.count(),
      this.getQuoteRequestsbyStatus(),
      this.getPoliciesByStatus(),
      this.getTopCarriers()
    ]);

    return {
      totalQuoteRequests,
      totalPolicies,
      totalPoliciesThisMonth,
      activePolicies,
      totalUsers,
      totalPartners,
      conversionRate: totalQuoteRequests === 0
        ? 0
        : Number((totalPolicies / totalQuoteRequests).toFixed(2)),
      quoteRequestsByStatus,
      policiesByStatus,
      topCarriers
    };
  }

  /**
   * Get quote analytics for a specific time range
   */
  async getQuoteAnalytics(startDate?: Date, endDate?: Date) {
    const where = startDate || endDate
      ? {
          createdAt: {
            ...(startDate && { gte: startDate }),
            ...(endDate && { lte: endDate })
          }
        }
      : {};

    const [totalQuotes, quotesByStatus, averagePremium, quotesByCarrier] = await Promise.all([
      this.prisma.quote.count({ where }),
      this.getQuotesByStatus(where),
      this.getAveragePremium(where),
      this.getQuotesByCarrier(where)
    ]);

    return {
      totalQuotes,
      quotesByStatus,
      averagePremium,
      quotesByCarrier
    };
  }

  /**
   * Get partner performance analytics
   */
  async getPartnerAnalytics(partnerId?: string) {
    const where = partnerId ? { partnerId } : {};

    const [
      totalRequests,
      totalQuotes,
      totalPolicies,
      requestsByStatus,
      conversionMetrics
    ] = await Promise.all([
      this.prisma.quoteRequest.count({ where }),
      this.prisma.quote.count({
        where: { quoteRequest: where }
      }),
      this.prisma.policy.count({
        where: { quoteRequest: where }
      }),
      this.getRequestsByStatus(where),
      this.getPartnerConversionMetrics(where)
    ]);

    return {
      totalRequests,
      totalQuotes,
      totalPolicies,
      quoteConversionRate: totalQuotes === 0 ? 0 : Number((totalPolicies / totalQuotes).toFixed(2)),
      requestsByStatus,
      conversionMetrics
    };
  }

  /**
   * Get agent performance analytics
   */
  async getAgentAnalytics(agentId?: string) {
    const where = agentId ? { agentId } : {};

    const [
      totalAssignments,
      acceptedAssignments,
      totalPolicies,
      averageTimeToClose
    ] = await Promise.all([
      this.prisma.agentAssignment.count({ where }),
      this.prisma.agentAssignment.count({
        where: {
          ...where,
          status: "ACCEPTED"
        }
      }),
      this.prisma.policy.count({
        where: agentId ? { quoteRequest: { agentAssignments: { some: { agentId } } } } : {}
      }),
      this.getAverageTimeToClose(where)
    ]);

    return {
      totalAssignments,
      acceptedAssignments,
      acceptanceRate: totalAssignments === 0
        ? 0
        : Number((acceptedAssignments / totalAssignments).toFixed(2)),
      totalPolicies,
      averageTimeToClose
    };
  }

  /**
   * Get policy lifecycle analytics
   */
  async getPolicyAnalytics(startDate?: Date, endDate?: Date) {
    const where = startDate || endDate
      ? {
          createdAt: {
            ...(startDate && { gte: startDate }),
            ...(endDate && { lte: endDate })
          }
        }
      : {};

    const [
      totalPolicies,
      policiesByStatus,
      totalPremiumCents,
      averagePolicyCents,
      expiringPolicies,
      expiredPolicies
    ] = await Promise.all([
      this.prisma.policy.count({ where }),
      this.getPoliciesByStatus(where),
      this.getTotalPremium(where),
      this.getAveragePolicyPremium(where),
      this.getExpiringPolicies(),
      this.getExpiredPolicies()
    ]);

    return {
      totalPolicies,
      policiesByStatus,
      totalPremiumCents,
      averagePolicyCents,
      expiringPolicies,
      expiredPolicies
    };
  }

  private getMonthStart(): Date {
    const date = new Date();
    date.setDate(1);
    date.setHours(0, 0, 0, 0);
    return date;
  }

  private async getQuoteRequestsbyStatus() {
    const results = await this.prisma.quoteRequest.groupBy({
      by: ["status"],
      _count: { id: true }
    });
    return results.map((r) => ({ status: r.status, count: r._count.id }));
  }

  private async getPoliciesByStatus(where = {}) {
    const results = await this.prisma.policy.groupBy({
      by: ["status"],
      _count: { id: true },
      where
    });
    return results.map((r) => ({ status: r.status, count: r._count.id }));
  }

  private async getTopCarriers(limit = 10) {
    const results = await this.prisma.quote.groupBy({
      by: ["carrierName"],
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: limit
    });
    return results.map((r) => ({ carrierName: r.carrierName, count: r._count.id }));
  }

  private async getQuotesByStatus(where = {}) {
    const results = await this.prisma.quote.groupBy({
      by: ["status"],
      _count: { id: true },
      where
    });
    return results.map((r) => ({ status: r.status, count: r._count.id }));
  }

  private async getAveragePremium(where = {}) {
    const result = await this.prisma.quote.aggregate({
      _avg: { annualPremiumCents: true },
      where
    });
    return result._avg.annualPremiumCents ?? 0;
  }

  private async getQuotesByCarrier(where = {}) {
    const results = await this.prisma.quote.groupBy({
      by: ["carrierName"],
      _count: { id: true },
      where,
      orderBy: { _count: { id: "desc" } }
    });
    return results.map((r) => ({ carrierName: r.carrierName, count: r._count.id }));
  }

  private async getRequestsByStatus(where = {}) {
    const results = await this.prisma.quoteRequest.groupBy({
      by: ["status"],
      _count: { id: true },
      where
    });
    return results.map((r) => ({ status: r.status, count: r._count.id }));
  }

  private async getPartnerConversionMetrics(where = {}) {
    const quotes = await this.prisma.quote.count({
      where: { quoteRequest: where }
    });
    const policies = await this.prisma.policy.count({ where });
    return {
      quoteConversionRate: quotes === 0 ? 0 : Number((policies / quotes).toFixed(2))
    };
  }

  private async getAverageTimeToClose(where = {}) {
    const completed = await this.prisma.agentAssignment.findMany({
      where: {
        ...where,
        quoteRequest: {
          policies: {
            some: {}
          }
        }
      },
      include: {
        quoteRequest: {
          include: {
            policies: true
          }
        }
      }
    });

    if (completed.length === 0) return 0;

    const totalTime = completed.reduce((sum, a) => {
      const policy = a.quoteRequest.policies[0];
      if (!policy) return sum;
      return sum + (policy.createdAt.getTime() - a.assignedAt.getTime());
    }, 0);

    return Math.round(totalTime / completed.length / (1000 * 60 * 60 * 24)); // days
  }

  private async getTotalPremium(where = {}) {
    const result = await this.prisma.policy.aggregate({
      _sum: { premiumCents: true },
      where
    });
    return result._sum.premiumCents ?? 0;
  }

  private async getAveragePolicyPremium(where = {}) {
    const result = await this.prisma.policy.aggregate({
      _avg: { premiumCents: true },
      where
    });
    return result._avg.premiumCents ?? 0;
  }

  private async getExpiringPolicies(daysUntil = 30) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysUntil);
    return this.prisma.policy.count({
      where: {
        status: PolicyStatus.ACTIVE,
        expirationDate: {
          lte: futureDate,
          gte: new Date()
        }
      }
    });
  }

  private async getExpiredPolicies() {
    return this.prisma.policy.count({
      where: {
        expirationDate: {
          lt: new Date()
        }
      }
    });
  }
}
