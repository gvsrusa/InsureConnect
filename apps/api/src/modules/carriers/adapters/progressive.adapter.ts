import {
  CarrierAdapter,
  CarrierQuoteRequest,
  CarrierQuoteResult
} from "../carrier.types";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class ProgressiveAdapter implements CarrierAdapter {
  readonly name = "progressive";

  async getQuote(request: CarrierQuoteRequest): Promise<CarrierQuoteResult> {
    // Progressive is a bit slower 300–900 ms
    await sleep(300 + Math.floor(Math.random() * 600));

    // 8% failure rate — slightly less reliable
    if (Math.random() < 0.08) {
      throw new Error("Progressive: underwriting service unavailable");
    }

    // Base $122/month — mid-range
    const base = 12_200;
    const revenueBump = Math.floor((request.annualRevenue / 100_000) * 1_700);
    const variance = Math.floor((Math.random() - 0.5) * 2_400);
    const premiumCents = Math.max(8_500, base + revenueBump + variance);

    return {
      carrierName: this.name,
      premiumCents,
      annualPremiumCents: premiumCents * 12,
      termMonths: 12,
      coverageSummary: {
        carrier: "Progressive",
        liabilityLimit: "$1,000,000",
        propertyDamage: "included",
        snapshotDiscount: "eligible",
        coverageType: request.coverageType,
        state: request.state
      }
    };
  }
}
