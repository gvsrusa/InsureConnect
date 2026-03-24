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
  // Create/update agent user
  // bcrypt hash of 'Password1!' (12 rounds) — for local dev/testing only
  const agentPasswordHash = "$2b$12$MfLKRRSm9fDSe2QAiSuYqudfakKqmuHjRJdvE7iE1kd8wFsQnXflW";

  const agent = await prisma.user.upsert({
    where: { email: "agent@insureconnect.local" },
    update: {
      fullName: "Alex Agent",
      passwordHash: agentPasswordHash
    },
    create: {
      email: "agent@insureconnect.local",
      fullName: "Alex Agent",
      passwordHash: agentPasswordHash
    }
  });

  // Assign AGENT role to agent user
  await prisma.userRoleAssignment.upsert({
    where: { userId_role: { userId: agent.id, role: UserRole.AGENT } },
    update: {},
    create: {
      userId: agent.id,
      role: UserRole.AGENT
    }
  });

  // Create/update customer user
  const customerPasswordHash = "$2b$12$MfLKRRSm9fDSe2QAiSuYqudfakKqmuHjRJdvE7iE1kd8wFsQnXflW";

  const customer = await prisma.user.upsert({
    where: { email: "customer@insureconnect.local" },
    update: {
      fullName: "Chris Customer",
      passwordHash: customerPasswordHash
    },
    create: {
      email: "customer@insureconnect.local",
      fullName: "Chris Customer",
      passwordHash: customerPasswordHash
    }
  });

  // Assign CUSTOMER role to customer user
  await prisma.userRoleAssignment.upsert({
    where: { userId_role: { userId: customer.id, role: UserRole.CUSTOMER } },
    update: {},
    create: {
      userId: customer.id,
      role: UserRole.CUSTOMER
    }
  });

  // Create/update partner underwriter user
  const partnerUnderwriterPasswordHash = "$2b$12$MfLKRRSm9fDSe2QAiSuYqudfakKqmuHjRJdvE7iE1kd8wFsQnXflW";

  const partnerUnderwriter = await prisma.user.upsert({
    where: { email: "underwriter@insureconnect.local" },
    update: {
      fullName: "Pat Underwriter",
      passwordHash: partnerUnderwriterPasswordHash
    },
    create: {
      email: "underwriter@insureconnect.local",
      fullName: "Pat Underwriter",
      passwordHash: partnerUnderwriterPasswordHash
    }
  });

  // Assign PARTNER_UNDERWRITER role to underwriter user
  await prisma.userRoleAssignment.upsert({
    where: { userId_role: { userId: partnerUnderwriter.id, role: UserRole.PARTNER_UNDERWRITER } },
    update: {},
    create: {
      userId: partnerUnderwriter.id,
      role: UserRole.PARTNER_UNDERWRITER
    }
  });

  // Create/update partner viewer user
  const partnerViewerPasswordHash = "$2b$12$MfLKRRSm9fDSe2QAiSuYqudfakKqmuHjRJdvE7iE1kd8wFsQnXflW";

  const partnerViewer = await prisma.user.upsert({
    where: { email: "viewer@insureconnect.local" },
    update: {
      fullName: "Val Viewer",
      passwordHash: partnerViewerPasswordHash
    },
    create: {
      email: "viewer@insureconnect.local",
      fullName: "Val Viewer",
      passwordHash: partnerViewerPasswordHash
    }
  });

  // Assign PARTNER_VIEWER role to viewer user
  await prisma.userRoleAssignment.upsert({
    where: { userId_role: { userId: partnerViewer.id, role: UserRole.PARTNER_VIEWER } },
    update: {},
    create: {
      userId: partnerViewer.id,
      role: UserRole.PARTNER_VIEWER
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

  await prisma.quote.deleteMany({
    where: { quoteRequestId: quoteRequest.id }
  });

  await prisma.quote.create({
    data: {
      quoteRequestId: quoteRequest.id,
      carrierName: "Northshore Mutual",
      premiumCents: 34375,
      annualPremiumCents: 412500,
      termMonths: 12,
      status: QuoteStatus.READY,
      coverageSummary: {
        liability: 1000000,
        deductible: 2500,
        propertyDamage: 500000
      }
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

  await prisma.policyEvent.deleteMany({
    where: { policyId: policy.id }
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

  const customerQuoteRequest = await prisma.quoteRequest.upsert({
    where: { externalRef: "QR-0002" },
    update: {
      requesterId: customer.id,
      status: QuoteRequestStatus.IN_REVIEW
    },
    create: {
      externalRef: "QR-0002",
      partnerId: partner.id,
      requesterId: customer.id,
      businessName: "Chris Customer",
      coverageType: "AUTO",
      state: "TX",
      annualRevenue: 125000,
      status: QuoteRequestStatus.IN_REVIEW
    }
  });

  await prisma.quote.deleteMany({
    where: { quoteRequestId: customerQuoteRequest.id }
  });

  await prisma.quote.createMany({
    data: [
      {
        quoteRequestId: customerQuoteRequest.id,
        carrierName: "Progressive",
        premiumCents: 9600,
        annualPremiumCents: 115200,
        termMonths: 12,
        status: QuoteStatus.READY,
        coverageSummary: {
          liability: 250000,
          collision: 500,
          comprehensive: 250
        }
      },
      {
        quoteRequestId: customerQuoteRequest.id,
        carrierName: "State Farm",
        premiumCents: 10450,
        annualPremiumCents: 125400,
        termMonths: 12,
        status: QuoteStatus.READY,
        coverageSummary: {
          liability: 300000,
          collision: 500,
          roadside: true
        }
      }
    ]
  });

  const customerQuote = await prisma.quote.findFirstOrThrow({
    where: { quoteRequestId: customerQuoteRequest.id },
    orderBy: { annualPremiumCents: "asc" }
  });

  const customerPolicy = await prisma.policy.upsert({
    where: { policyNumber: "POL-0002" },
    update: {
      userId: customer.id,
      quoteRequestId: customerQuoteRequest.id,
      quoteId: customerQuote.id,
      status: PolicyStatus.ACTIVE
    },
    create: {
      quoteRequestId: customerQuoteRequest.id,
      quoteId: customerQuote.id,
      userId: customer.id,
      policyNumber: "POL-0002",
      carrierName: customerQuote.carrierName,
      premiumCents: customerQuote.annualPremiumCents ?? customerQuote.premiumCents * 12,
      status: PolicyStatus.ACTIVE,
      effectiveDate: new Date("2026-02-01T00:00:00.000Z"),
      expirationDate: new Date("2027-02-01T00:00:00.000Z")
    }
  });

  await prisma.policyEvent.deleteMany({
    where: { policyId: customerPolicy.id }
  });

  await prisma.policyEvent.create({
    data: {
      policyId: customerPolicy.id,
      type: PolicyEventType.ISSUED,
      payload: {
        source: "seed",
        notes: "Customer sample policy"
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