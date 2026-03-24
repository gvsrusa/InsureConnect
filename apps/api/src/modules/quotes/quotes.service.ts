import { Injectable, NotFoundException } from "@nestjs/common";
import { QuoteRequestStatus } from "@prisma/client";
import * as crypto from "crypto";
import { randomUUID } from "crypto";

import { CacheService } from "../../common/cache/cache.service";
import { PrismaService } from "../../prisma/prisma.service";
import { CarriersService } from "../carriers/carriers.service";
import { CreateQuoteRequestDto } from "./dto/create-quote-request.dto";

export interface QuoteItem {
  id: string;
  carrierName: string;
  premiumCents: number;
  annualPremiumCents: number;
  termMonths: number;
  coverageSummary: Record<string, unknown>;
}

export interface QuoteRequestResponse {
  quoteRequestId: string;
  status: string;
  quotes: QuoteItem[];
}

export interface QuoteRequestListItem {
  id: string;
  externalRef: string;
  businessName: string;
  coverageType: string;
  state: string;
  annualRevenue: number;
  status: string;
  createdAt: string;
  quoteCount: number;
}

@Injectable()
export class QuotesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly carriersService: CarriersService,
    private readonly cacheService: CacheService
  ) {}

  async createQuoteRequest(
    dto: CreateQuoteRequestDto,
    partnerId: string,
    requesterId?: string
  ): Promise<QuoteRequestResponse> {
    const cacheKey = this.buildCacheKey(dto, partnerId);
    const cached = await this.cacheService.get<QuoteRequestResponse>(cacheKey);
    if (cached) {
      return cached;
    }

    // Create QuoteRequest record
    const quoteRequest = await this.prisma.quoteRequest.create({
      data: {
        externalRef: randomUUID(),
        partnerId,
        requesterId,
        businessName: dto.businessName,
        coverageType: dto.coverageType,
        state: dto.state,
        annualRevenue: dto.annualRevenue,
        status: QuoteRequestStatus.NEW
      }
    });

    // Fan out to all carriers
    const carrierResults = await this.carriersService.aggregateQuotes({
      businessName: dto.businessName,
      coverageType: dto.coverageType,
      state: dto.state,
      annualRevenue: dto.annualRevenue
    });

    // Persist each quote result
    const savedQuotes = await Promise.all(
      carrierResults.map((result) =>
        this.prisma.quote.create({
          data: {
            quoteRequestId: quoteRequest.id,
            carrierName: result.carrierName,
            premiumCents: result.premiumCents,
            annualPremiumCents: result.annualPremiumCents,
            termMonths: result.termMonths,
            coverageSummary: result.coverageSummary as object,
            status: "READY"
          }
        })
      )
    );

    const finalStatus =
      carrierResults.length > 0
        ? QuoteRequestStatus.QUOTED
        : QuoteRequestStatus.DECLINED;

    await this.prisma.quoteRequest.update({
      where: { id: quoteRequest.id },
      data: { status: finalStatus }
    });

    const response: QuoteRequestResponse = {
      quoteRequestId: quoteRequest.id,
      status: finalStatus,
      quotes: savedQuotes.map((q) => ({
        id: q.id,
        carrierName: q.carrierName,
        premiumCents: q.premiumCents,
        annualPremiumCents: q.annualPremiumCents ?? q.premiumCents * 12,
        termMonths: q.termMonths,
        coverageSummary: (q.coverageSummary as Record<string, unknown>) ?? {}
      }))
    };

    await this.cacheService.set(cacheKey, response, 300);
    return response;
  }

  async getQuoteRequest(
    quoteRequestId: string,
    partnerId: string
  ): Promise<QuoteRequestResponse> {
    const qr = await this.prisma.quoteRequest.findFirst({
      where: { id: quoteRequestId, partnerId },
      include: { quotes: true }
    });

    if (!qr) {
      throw new NotFoundException(`Quote request ${quoteRequestId} not found`);
    }

    return {
      quoteRequestId: qr.id,
      status: qr.status,
      quotes: qr.quotes.map((q) => ({
        id: q.id,
        carrierName: q.carrierName,
        premiumCents: q.premiumCents,
        annualPremiumCents: q.annualPremiumCents ?? q.premiumCents * 12,
        termMonths: q.termMonths,
        coverageSummary: (q.coverageSummary as Record<string, unknown>) ?? {}
      }))
    };
  }

  async listQuoteRequests(partnerId: string): Promise<QuoteRequestListItem[]> {
    const quoteRequests = await this.prisma.quoteRequest.findMany({
      where: { partnerId },
      include: {
        _count: {
          select: { quotes: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    return quoteRequests.map((quoteRequest) => ({
      id: quoteRequest.id,
      externalRef: quoteRequest.externalRef,
      businessName: quoteRequest.businessName,
      coverageType: quoteRequest.coverageType,
      state: quoteRequest.state,
      annualRevenue: quoteRequest.annualRevenue,
      status: quoteRequest.status,
      createdAt: quoteRequest.createdAt.toISOString(),
      quoteCount: quoteRequest._count.quotes
    }));
  }

  private buildCacheKey(dto: CreateQuoteRequestDto, partnerId: string): string {
    const payload = JSON.stringify({ ...dto, partnerId });
    const hash = crypto.createHash("sha256").update(payload).digest("hex");
    return `quote:${hash}`;
  }
}
