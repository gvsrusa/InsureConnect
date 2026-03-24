import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { PolicyEventType } from "@prisma/client";
import { Prisma } from "@prisma/client";

export interface WebhookPayload {
  event: PolicyEventType;
  policyId: string;
  timestamp: Date;
  data: Prisma.InputJsonValue;
}

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Register a webhook handler for a specific event
   */
  async registerWebhook(partnerId: string, event: PolicyEventType, url: string) {
    this.logger.debug(`Registering webhook for partner ${partnerId}: ${event} -> ${url}`);
    // This would typically be stored in a database
    // For now, this is a placeholder for the webhook registry
    return {
      partnerId,
      event,
      url,
      createdAt: new Date()
    };
  }

  /**
   * Trigger a webhook for a policy event
   */
  async triggerWebhook(payload: WebhookPayload) {
    this.logger.log(
      `Triggering webhook for policy ${payload.policyId}: ${payload.event}`
    );

    try {
      // Get the policy to find associated partner
      const policy = await this.prisma.policy.findUnique({
        where: { id: payload.policyId },
        include: {
          quoteRequest: {
            include: { partner: true }
          }
        }
      });

      if (!policy) {
        this.logger.warn(`Policy not found: ${payload.policyId}`);
        return;
      }

      // Create a policy event record
      await this.prisma.policyEvent.create({
        data: {
          policyId: payload.policyId,
          type: payload.event,
          payload: payload.data
        }
      });

      // In a production system, this would:
      // 1. Look up registered webhooks for this partner and event
      // 2. Send HTTP POST requests to the webhook URLs
      // 3. Implement retry logic with exponential backoff
      // 4. Store webhook delivery logs

      this.logger.debug(
        `Webhook event recorded for policy ${payload.policyId}`
      );
    } catch (error) {
      this.logger.error(
        `Failed to trigger webhook: ${(error as Error).message}`,
        (error as Error).stack
      );
      throw error;
    }
  }

  /**
   * Handle policy creation event
   */
  async onPolicyCreated(policyId: string, data: Prisma.InputJsonValue) {
    await this.triggerWebhook({
      event: PolicyEventType.CREATED,
      policyId,
      timestamp: new Date(),
      data
    });
  }

  /**
   * Handle policy update event
   */
  async onPolicyUpdated(policyId: string, data: Prisma.InputJsonValue) {
    await this.triggerWebhook({
      event: PolicyEventType.UPDATED,
      policyId,
      timestamp: new Date(),
      data
    });
  }

  /**
   * Handle policy issued event
   */
  async onPolicyIssued(policyId: string, data: Prisma.InputJsonValue) {
    await this.triggerWebhook({
      event: PolicyEventType.ISSUED,
      policyId,
      timestamp: new Date(),
      data
    });
  }

  /**
   * Handle policy cancelled event
   */
  async onPolicyCancelled(policyId: string, data: Prisma.InputJsonValue) {
    await this.triggerWebhook({
      event: PolicyEventType.CANCELLED,
      policyId,
      timestamp: new Date(),
      data
    });
  }

  /**
   * Handle policy renewed event
   */
  async onPolicyRenewed(policyId: string, data: Prisma.InputJsonValue) {
    await this.triggerWebhook({
      event: PolicyEventType.RENEWED,
      policyId,
      timestamp: new Date(),
      data
    });
  }

  /**
   * Get webhook history for a policy
   */
  async getWebhookHistory(policyId: string) {
    return this.prisma.policyEvent.findMany({
      where: { policyId },
      orderBy: { createdAt: "desc" }
    });
  }

  /**
   * Get webhook history for a partner
   */
  async getPartnerWebhookHistory(partnerId: string) {
    return this.prisma.policyEvent.findMany({
      where: {
        policy: {
          quoteRequest: {
            partnerId
          }
        }
      },
      orderBy: { createdAt: "desc" },
      include: { policy: true }
    });
  }
}
