import { Injectable, Logger } from "@nestjs/common";

import { CarrierAdapter, CarrierQuoteRequest, CarrierQuoteResult } from "./carrier.types";
import { ClearcoverAdapter } from "./adapters/clearcover.adapter";
import { GeicoAdapter } from "./adapters/geico.adapter";
import { ProgressiveAdapter } from "./adapters/progressive.adapter";
import { StateFarmAdapter } from "./adapters/state-farm.adapter";

const ADAPTER_TIMEOUT_MS = 3_000;

@Injectable()
export class CarriersService {
  private readonly logger = new Logger(CarriersService.name);
  private readonly adapters: CarrierAdapter[];

  constructor() {
    this.adapters = [
      new StateFarmAdapter(),
      new GeicoAdapter(),
      new ProgressiveAdapter(),
      new ClearcoverAdapter()
    ];
  }

  getAdapterNames(): string[] {
    return this.adapters.map((a) => a.name);
  }

  /**
   * Fan out to all carrier adapters with per-adapter timeout.
   * Returns successfully resolved quotes sorted by annual premium (cheapest first).
   */
  async aggregateQuotes(
    request: CarrierQuoteRequest
  ): Promise<CarrierQuoteResult[]> {
    const withTimeout = (adapter: CarrierAdapter): Promise<CarrierQuoteResult> =>
      Promise.race([
        adapter.getQuote(request),
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error(`${adapter.name}: timeout after ${ADAPTER_TIMEOUT_MS}ms`)),
            ADAPTER_TIMEOUT_MS
          )
        )
      ]);

    const settled = await Promise.allSettled(
      this.adapters.map((adapter) => withTimeout(adapter))
    );

    const results: CarrierQuoteResult[] = [];
    for (const result of settled) {
      if (result.status === "fulfilled") {
        results.push(result.value);
      } else {
        this.logger.warn(`Carrier failed: ${result.reason instanceof Error ? result.reason.message : String(result.reason)}`);
      }
    }

    return results.sort((a, b) => a.annualPremiumCents - b.annualPremiumCents);
  }
}
