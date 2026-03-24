export interface CarrierQuoteRequest {
  businessName: string;
  coverageType: string;
  state: string;
  annualRevenue: number;
}

export interface CarrierQuoteResult {
  carrierName: string;
  /** Monthly premium in cents */
  premiumCents: number;
  /** Annual premium in cents */
  annualPremiumCents: number;
  termMonths: number;
  coverageSummary: Record<string, unknown>;
}

export interface CarrierAdapter {
  readonly name: string;
  getQuote(request: CarrierQuoteRequest): Promise<CarrierQuoteResult>;
}
