import { Injectable, NotFoundException } from "@nestjs/common";
import { Partner } from "@prisma/client";
import * as crypto from "crypto";

import { PrismaService } from "../../prisma/prisma.service";

function sha256(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex");
}

export interface GeneratedApiKey {
  rawKey: string;
  prefix: string;
}

@Injectable()
export class PartnersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Validate a raw API key from the x-api-key header.
   * Returns the Partner if valid, null if not found.
   */
  async validateApiKey(rawKey: string): Promise<Partner | null> {
    const prefix = rawKey.substring(0, 8);
    const hash = sha256(rawKey);

    return this.prisma.partner.findFirst({
      where: { apiKeyPrefix: prefix, apiKey: hash }
    });
  }

  async findById(id: string): Promise<Partner> {
    const partner = await this.prisma.partner.findUnique({ where: { id } });
    if (!partner) throw new NotFoundException(`Partner ${id} not found`);
    return partner;
  }

  async listAll(): Promise<Partner[]> {
    return this.prisma.partner.findMany({ orderBy: { createdAt: "asc" } });
  }

  /**
   * Create a new partner and return it plus the plaintext API key (shown once).
   */
  async create(params: {
    name: string;
    slug: string;
    rateLimitPerMinute?: number;
  }): Promise<{ partner: Partner; rawApiKey: string }> {
    const rawKey = crypto.randomBytes(32).toString("hex");
    const prefix = rawKey.substring(0, 8);
    const hash = sha256(rawKey);

    const partner = await this.prisma.partner.create({
      data: {
        name: params.name,
        slug: params.slug,
        apiKey: hash,
        apiKeyPrefix: prefix,
        rateLimitPerMinute: params.rateLimitPerMinute ?? 60
      }
    });

    return { partner, rawApiKey: rawKey };
  }

  /**
   * Rotate an existing partner's API key. Returns the new plaintext key (shown once).
   */
  async rotateApiKey(id: string): Promise<{ rawApiKey: string }> {
    const rawKey = crypto.randomBytes(32).toString("hex");
    const prefix = rawKey.substring(0, 8);
    const hash = sha256(rawKey);

    await this.prisma.partner.update({
      where: { id },
      data: { apiKey: hash, apiKeyPrefix: prefix }
    });

    return { rawApiKey: rawKey };
  }
}
