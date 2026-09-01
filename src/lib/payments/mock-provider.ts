import type { ChargeInput, ChargeResult, PaymentProvider } from "./provider";

/**
 * Sandbox provider for the MVP: no money moves and no gateway is contacted.
 * A real Saudi gateway (Moyasar / HyperPay / Tap) implements the same interface.
 */
export class MockPaymentProvider implements PaymentProvider {
  readonly name = "mock";

  async charge(input: ChargeInput): Promise<ChargeResult> {
    await new Promise((resolve) => setTimeout(resolve, 900));

    const digits = (input.cardNumber ?? "").replace(/\D/g, "");
    return {
      success: true,
      transactionRef: `KHB-${Date.now().toString(36).toUpperCase()}-${Math.random()
        .toString(36)
        .slice(2, 6)
        .toUpperCase()}`,
      cardLast4: digits.length >= 4 ? digits.slice(-4) : undefined,
      provider: this.name,
    };
  }

  async refund(): Promise<{ success: boolean }> {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return { success: true };
  }
}
