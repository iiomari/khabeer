import type { PaymentMethod } from "@/lib/enums";

export type ChargeInput = {
  bookingRef: string;
  amountSar: number;
  method: PaymentMethod;
  cardNumber?: string;
};

export type ChargeResult = {
  success: boolean;
  transactionRef: string;
  cardLast4?: string;
  provider: string;
  error?: string;
};

export interface PaymentProvider {
  readonly name: string;
  charge(input: ChargeInput): Promise<ChargeResult>;
  refund(transactionRef: string): Promise<{ success: boolean }>;
}
