import {
  CarrierAdapter,
  CarrierQuoteRequest,
  CarrierQuoteResult
} from "../carrier.types";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class StateFarmAdapter implements CarrierAdapter {
  readonly name = "state_farm";

  async getQuote(request: CarrierQuoteRequest): Promise<CarrierQuoteResult> {
    // Simulate latency 250–650 ms
    await sleep(250 + Math.floor(Math.random() * 400));

    // 4% failure rate
    if (Math.random() < 0.04) {
      throw new Error("State Farm: carrier temporarily unavailable");
    }

    // Base $130/month; scales with revenue
    const base = 13_000;
    const revenueBump = Math.floor((request.annualRevenue / 100_000) * 1_800);
    const variance = Math.floor((Math.random() - 0.5) * 2_000);
    const premiumCents = Math.max(8_000, base + revenueBump + variance);

    return {
      carrierName: this.name,
      premiumCents,
      annualPremiumCents: premiumCents * 12,
      termMonths: 12,
      coverageSummary: {
        carrier: "State Farm",
        liabilityLimit: "$1,000,000",
        propertyDamage: "included",
        coverageType: request.coverageType,
        state: request.state
      }
    };
  }
}
