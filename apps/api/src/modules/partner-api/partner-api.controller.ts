import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards
} from "@nestjs/common";
import { Partner } from "@prisma/client";

import { CurrentPartner } from "../../common/decorators/current-partner.decorator";
import { Public } from "../../common/decorators/public.decorator";
import { ApiKeyGuard } from "../../common/guards/api-key.guard";
import { BindPolicyDto } from "../policies/dto/bind-policy.dto";
import { PoliciesService } from "../policies/policies.service";
import { CreateQuoteRequestDto } from "../quotes/dto/create-quote-request.dto";
import { QuotesService } from "../quotes/quotes.service";
import { PartnerApiService } from "./partner-api.service";

@Public()
@Controller("api/v1/partner")
@UseGuards(ApiKeyGuard)
export class PartnerApiController {
  constructor(
    private readonly quotesService: QuotesService,
    private readonly policiesService: PoliciesService,
    private readonly partnerApiService: PartnerApiService
  ) {}

  @Post("quotes")
  @HttpCode(HttpStatus.CREATED)
  async createQuoteRequest(
    @Body() dto: CreateQuoteRequestDto,
    @CurrentPartner() partner: Partner
  ) {
    return this.quotesService.createQuoteRequest(dto, partner.id);
  }

  @Get("quotes")
  async listQuoteRequests(@CurrentPartner() partner: Partner) {
    return this.quotesService.listQuoteRequests(partner.id);
  }

  @Get("quotes/:id")
  async getQuoteRequest(
    @Param("id") id: string,
    @CurrentPartner() partner: Partner
  ) {
    return this.quotesService.getQuoteRequest(id, partner.id);
  }

  @Post("policies/bind")
  @HttpCode(HttpStatus.CREATED)
  async bindPolicy(
    @Body() dto: BindPolicyDto,
    @CurrentPartner() partner: Partner
  ) {
    return this.policiesService.bindPolicy(dto, partner.id);
  }

  @Get("policies")
  async listPolicies(@CurrentPartner() partner: Partner) {
    return this.policiesService.listPoliciesForPartner(partner.id);
  }

  @Get("usage-stats")
  async getUsageStats(@CurrentPartner() partner: Partner) {
    return this.partnerApiService.getApiUsageStats(partner.id);
  }
}
