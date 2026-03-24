import {
  CarrierAdapter,
  CarrierQuoteRequest,
  CarrierQuoteResult
} from "../carrier.types";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class ClearcoverAdapter implements CarrierAdapter {
  readonly name = "clearcover";

  async getQuote(request: CarrierQuoteRequest): Promise<CarrierQuoteResult> {
    // Clearcover is digital-first — fast 150–450 ms
    await sleep(150 + Math.floor(Math.random() * 300));

    // 5% failure rate
    if (Math.random() < 0.05) {
      throw new Error("Clearcover: rating engine timeout");
    }

    // Base $108/month — usually cheapest, lower overhead
    const base = 10_800;
    const revenueBump = Math.floor((request.annualRevenue / 100_000) * 1_500);
    const variance = Math.floor((Math.random() - 0.5) * 1_600);
    const premiumCents = Math.max(7_000, base + revenueBump + variance);

    return {
      carrierName: this.name,
      premiumCents,
      annualPremiumCents: premiumCents * 12,
      termMonths: 12,
      coverageSummary: {
        carrier: "Clearcover",
        liabilityLimit: "$1,000,000",
        propertyDamage: "included",
        digitalFirst: true,
        coverageType: request.coverageType,
        state: request.state
      }
    };
  }
}
