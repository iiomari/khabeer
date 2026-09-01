import { MockPaymentProvider } from "./mock-provider";
import type { PaymentProvider } from "./provider";

let provider: PaymentProvider | null = null;

/** Swap this factory to return a real gateway implementation when one is configured. */
export function getPaymentProvider(): PaymentProvider {
  provider ??= new MockPaymentProvider();
  return provider;
}

export type { ChargeInput, ChargeResult, PaymentProvider } from "./provider";
