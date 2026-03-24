import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { AnalyticsService } from "./analytics.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { UserRole } from "@prisma/client";

@Controller("api/v1/analytics")
@UseGuards(JwtAuthGuard, RolesGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get("dashboard")
  @Roles(UserRole.ADMIN)
  async getDashboard() {
    return this.analyticsService.getAdminDashboardMetrics();
  }

  @Get("quotes")
  @Roles(UserRole.ADMIN, UserRole.PARTNER_UNDERWRITER, UserRole.PARTNER_VIEWER)
  async getQuoteAnalytics(
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string
  ) {
    return this.analyticsService.getQuoteAnalytics(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    );
  }

  @Get("partners")
  @Roles(UserRole.ADMIN, UserRole.PARTNER_UNDERWRITER)
  async getPartnerAnalytics(@Query("partnerId") partnerId?: string) {
    return this.analyticsService.getPartnerAnalytics(partnerId);
  }

  @Get("agents")
  @Roles(UserRole.ADMIN, UserRole.AGENT)
  async getAgentAnalytics(@Query("agentId") agentId?: string) {
    return this.analyticsService.getAgentAnalytics(agentId);
  }

  @Get("policies")
  @Roles(UserRole.ADMIN, UserRole.PARTNER_UNDERWRITER, UserRole.AGENT)
  async getPolicyAnalytics(
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string
  ) {
    return this.analyticsService.getPolicyAnalytics(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    );
  }
}
