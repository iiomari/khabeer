import type { LicenseStatus } from "@/lib/enums";

export type LicenseGate = {
  /** True when at least one of the expert's fields is regulated. */
  regulated: boolean;
  status: LicenseStatus;
  bookable: boolean;
};

/**
 * Seven consulting fields require a practising licence in Saudi Arabia. An expert
 * working in any of them cannot take bookings until the licence is on file and
 * approved — the check lives here so the booking action, the profile page and
 * the admin review all read the same rule.
 */
export function evaluateLicense(input: {
  licenseStatus: string;
  categories: { requiresLicense: boolean }[];
}): LicenseGate {
  const regulated = input.categories.some((category) => category.requiresLicense);
  const status = input.licenseStatus as LicenseStatus;

  return {
    regulated,
    status,
    bookable: !regulated || status === "APPROVED",
  };
}
