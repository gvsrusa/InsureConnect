import {
  CarrierAdapter,
  CarrierQuoteRequest,
  CarrierQuoteResult
} from "../carrier.types";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class GeicoAdapter implements CarrierAdapter {
  readonly name = "geico";

  async getQuote(request: CarrierQuoteRequest): Promise<CarrierQuoteResult> {
    // Simulate latency 180–580 ms — Geico is fast
    await sleep(180 + Math.floor(Math.random() * 400));

    // 3% failure rate
    if (Math.random() < 0.03) {
      throw new Error("Geico: API error");
    }

    // Base $115/month — slightly cheaper
    const base = 11_500;
    const revenueBump = Math.floor((request.annualRevenue / 100_000) * 1_600);
    const variance = Math.floor((Math.random() - 0.5) * 1_800);
    const premiumCents = Math.max(7_500, base + revenueBump + variance);

    return {
      carrierName: this.name,
      premiumCents,
      annualPremiumCents: premiumCents * 12,
      termMonths: 12,
      coverageSummary: {
        carrier: "Geico",
        liabilityLimit: "$1,000,000",
        propertyDamage: "included",
        bundleDiscount: "available",
        coverageType: request.coverageType,
        state: request.state
      }
    };
  }
}
