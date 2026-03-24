import {
  AssignmentStatus,
  PolicyEventType,
  PolicyStatus,
  PrismaClient,
  QuoteRequestStatus,
  QuoteStatus,
  UserRole
} from "@prisma/client";
import { createHash } from "node:crypto";

const prisma = new PrismaClient();

function hashApiKey(rawKey: string): string {
  return createHash("sha256").update(rawKey).digest("hex");
}

async function main(): Promise<void> {
  const agent = await prisma.user.upsert({
    where: { email: "agent@insureconnect.local" },
    update: {
      fullName: "Alex Agent",
      role: UserRole.AGENT
    },
    create: {
      email: "agent@insureconnect.local",
      fullName: "Alex Agent",
      role: UserRole.AGENT
    }
  });

  const partner = await prisma.partner.upsert({
    where: { slug: "oakline-partners" },
    update: {
      name: "Oakline Partners",
      apiKey: hashApiKey("seed-oakline-partner-api-key"),
      apiKeyPrefix: "seed-oak"
    },
    create: {
      name: "Oakline Partners",
      slug: "oakline-partners",
      apiKey: hashApiKey("seed-oakline-partner-api-key"),
      apiKeyPrefix: "seed-oak"
    }
  });

  const quoteRequest = await prisma.quoteRequest.upsert({
    where: { externalRef: "QR-0001" },
    update: {
      status: QuoteRequestStatus.IN_REVIEW
    },
    create: {
      externalRef: "QR-0001",
      partnerId: partner.id,
      requesterId: agent.id,
      businessName: "Harbor Cafe Group",
      coverageType: "General Liability",
      state: "TX",
      annualRevenue: 3200000,
      status: QuoteRequestStatus.IN_REVIEW
    }
  });

  await prisma.agentAssignment.upsert({
    where: {
      quoteRequestId_agentId: {
        quoteRequestId: quoteRequest.id,
        agentId: agent.id
      }
    },
    update: {
      status: AssignmentStatus.ACCEPTED
    },
    create: {
      quoteRequestId: quoteRequest.id,
      agentId: agent.id,
      partnerId: partner.id,
      status: AssignmentStatus.ACCEPTED
    }
  });

  await prisma.quote.create({
    data: {
      quoteRequestId: quoteRequest.id,
      carrierName: "Northshore Mutual",
      premiumCents: 412500,
      termMonths: 12,
      status: QuoteStatus.READY
    }
  });

  const policy = await prisma.policy.upsert({
    where: { policyNumber: "POL-0001" },
    update: {
      status: PolicyStatus.ACTIVE
    },
    create: {
      quoteRequestId: quoteRequest.id,
      userId: agent.id,
      policyNumber: "POL-0001",
      carrierName: "Northshore Mutual",
      premiumCents: 412500,
      status: PolicyStatus.ACTIVE,
      effectiveDate: new Date("2026-01-01T00:00:00.000Z"),
      expirationDate: new Date("2027-01-01T00:00:00.000Z")
    }
  });

  await prisma.policyEvent.create({
    data: {
      policyId: policy.id,
      type: PolicyEventType.ISSUED,
      payload: {
        source: "seed",
        notes: "Initial sample policy issuance"
      }
    }
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });