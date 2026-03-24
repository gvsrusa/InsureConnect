import { Injectable } from "@nestjs/common";

interface WindowEntry {
  count: number;
  windowStart: number;
}

@Injectable()
export class RateLimitService {
  private readonly windows = new Map<string, WindowEntry>();

  /**
   * Check if a partner is within their rate limit.
   * Uses a fixed 60-second window.
   */
  isAllowed(partnerId: string, limitPerMinute: number): boolean {
    const now = Date.now();
    const existing = this.windows.get(partnerId);

    if (!existing || now - existing.windowStart > 60_000) {
      this.windows.set(partnerId, { count: 1, windowStart: now });
      return true;
    }

    if (existing.count >= limitPerMinute) {
      return false;
    }

    existing.count += 1;
    return true;
  }
}
