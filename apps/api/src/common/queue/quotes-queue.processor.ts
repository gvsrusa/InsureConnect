import { Injectable, Logger } from "@nestjs/common";
import { Process, Processor } from "@nestjs/bull";
import { Job } from "bull";
import { PrismaService } from "../../prisma/prisma.service";

export interface QuoteProcessingJob {
  quoteRequestId: string;
  partnerId: string;
  businessName: string;
  coverageType: string;
  state: string;
  annualRevenue: number;
}

@Processor("quotes")
@Injectable()
export class QuotesQueueProcessor {
  private readonly logger = new Logger(QuotesQueueProcessor.name);

  constructor(
    private readonly prisma: PrismaService
  ) {}

  @Process("process-quote-request")
  async processQuoteRequest(job: Job<QuoteProcessingJob>) {
    this.logger.log(
      `Processing quote request ${job.data.quoteRequestId} (Job ${job.id})`
    );

    try {
      const { quoteRequestId } = job.data;

      // Get the quote request
      const quoteRequest = await this.prisma.quoteRequest.findUnique({
        where: { id: quoteRequestId }
      });

      if (!quoteRequest) {
        throw new Error(`Quote request ${quoteRequestId} not found`);
      }

      // Update status to IN_REVIEW
      await this.prisma.quoteRequest.update({
        where: { id: quoteRequestId },
        data: { status: "IN_REVIEW" }
      });

      // Simulate quote generation from multiple carriers
      // In production, this would call actual carrier APIs
      const quotes = await this.generateQuotes(job.data);

      // Store the generated quotes
      for (const quote of quotes) {
        await this.prisma.quote.create({
          data: {
            quoteRequestId,
            carrierName: quote.carrierName,
            premiumCents: quote.premiumCents,
            annualPremiumCents: quote.annualPremiumCents,
            termMonths: quote.termMonths,
            coverageSummary: quote.coverageSummary,
            status: "READY"
          }
        });
      }

      // Update quote request status to QUOTED
      await this.prisma.quoteRequest.update({
        where: { id: quoteRequestId },
        data: { status: "QUOTED" }
      });

      this.logger.log(
        `Successfully processed quote request ${quoteRequestId} with ${quotes.length} quotes`
      );

      return {
        quoteRequestId,
        quotesGenerated: quotes.length,
        status: "completed"
      };
    } catch (error) {
      this.logger.error(
        `Failed to process quote request ${job.data.quoteRequestId}: ${(error as Error).message}`,
        (error as Error).stack
      );

      // Mark quote request as declined on error after max retries
      if (job.attemptsMade >= job.opts.attempts!) {
        await this.prisma.quoteRequest.update({
          where: { id: job.data.quoteRequestId },
          data: { status: "DECLINED" }
        }).catch((err) => {
          this.logger.error(`Failed to mark quote as declined: ${err.message}`);
        });
      }

      throw error;
    }
  }

  @Process("assign-agent")
  async assignAgent(job: Job<{ quoteRequestId: string }>) {
    this.logger.log(`Assigning agent to quote request ${job.data.quoteRequestId}`);

    try {
      const { quoteRequestId } = job.data;

      // Get the quote request
      const quoteRequest = await this.prisma.quoteRequest.findUnique({
        where: { id: quoteRequestId }
      });

      if (!quoteRequest) {
        throw new Error(`Quote request ${quoteRequestId} not found`);
      }

      // Get all available agents
      const agents = await this.prisma.user.findMany({
        where: {
          roles: {
            some: { role: "AGENT" }
          }
        }
      });

      if (agents.length === 0) {
        throw new Error("No agents available for assignment");
      }

      // Count assignments per agent
      const assignmentCounts = await this.prisma.agentAssignment.groupBy({
        by: ["agentId"],
        _count: { agentId: true }
      });

      const countMap = new Map(
        assignmentCounts.map((a) => [a.agentId, a._count.agentId])
      );

      // Select agent with least assignments (round-robin)
      let selectedAgent = agents[0];
      let minCount = countMap.get(agents[0]?.id ?? "") ?? 0;

      for (const agent of agents.slice(1)) {
        const count = countMap.get(agent.id) ?? 0;
        if (count < minCount) {
          minCount = count;
          selectedAgent = agent;
        }
      }

      // Create assignment
      if (!selectedAgent) {
        throw new Error("Failed to select an agent");
      }

      await this.prisma.agentAssignment.create({
        data: {
          quoteRequestId,
          agentId: selectedAgent.id
        }
      });

      this.logger.log(
        `Agent ${selectedAgent.id} assigned to quote request ${quoteRequestId}`
      );

      return {
        quoteRequestId,
        agentId: selectedAgent.id,
        agentName: selectedAgent.fullName
      };
    } catch (error) {
      this.logger.error(
        `Failed to assign agent: ${(error as Error).message}`,
        (error as Error).stack
      );
      throw error;
    }
  }

  private async generateQuotes(data: QuoteProcessingJob) {
    // Simulate quote generation from multiple carriers
    // This would be replaced with actual carrier API calls in production
    const carriers = [
      { name: "SafeGuard Insurance", margin: 0.15 },
      { name: "ProShield Coverage", margin: 0.12 },
      { name: "Guardian Premium", margin: 0.18 }
    ];

    // Base premium calculation (simplified)
    const baseAnnualPremium = Math.round(data.annualRevenue * 0.005);

    return carriers.map((carrier) => ({
      carrierName: carrier.name,
      premiumCents: Math.round((baseAnnualPremium * (1 + carrier.margin)) * 100),
      annualPremiumCents: Math.round(baseAnnualPremium * 100),
      termMonths: 12,
      coverageSummary: {
        businessName: data.businessName,
        coverageType: data.coverageType,
        state: data.state,
        annualRevenue: data.annualRevenue,
        carrier: carrier.name
      }
    }));
  }
}
