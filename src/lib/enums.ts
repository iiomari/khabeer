export const UserRole = {
  EXPERT: "EXPERT",
  CLIENT: "CLIENT",
  ADMIN: "ADMIN",
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const UserStatus = {
  ACTIVE: "ACTIVE",
  SUSPENDED: "SUSPENDED",
} as const;
export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus];

export const VerificationStatus = {
  DRAFT: "DRAFT",
  PENDING: "PENDING",
  VERIFIED: "VERIFIED",
  REJECTED: "REJECTED",
} as const;
export type VerificationStatus = (typeof VerificationStatus)[keyof typeof VerificationStatus];

export const BookingStatus = {
  PENDING: "PENDING",
  CONFIRMED: "CONFIRMED",
  REJECTED: "REJECTED",
  CANCELLED: "CANCELLED",
  COMPLETED: "COMPLETED",
} as const;
export type BookingStatus = (typeof BookingStatus)[keyof typeof BookingStatus];

export const PaymentStatus = {
  PAID: "PAID",
  REFUNDED: "REFUNDED",
  FAILED: "FAILED",
} as const;
export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];

export const PaymentMethod = {
  MADA: "MADA",
  APPLE_PAY: "APPLE_PAY",
  CARD: "CARD",
} as const;
export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod];

export const NotificationType = {
  BOOKING_REQUESTED: "BOOKING_REQUESTED",
  REWARD_EARNED: "REWARD_EARNED",
  BADGE_EARNED: "BADGE_EARNED",
  LICENSE_APPROVED: "LICENSE_APPROVED",
  LICENSE_REJECTED: "LICENSE_REJECTED",
  MEETING_SET: "MEETING_SET",
  BOOKING_ACCEPTED: "BOOKING_ACCEPTED",
  BOOKING_REJECTED: "BOOKING_REJECTED",
  BOOKING_CANCELLED: "BOOKING_CANCELLED",
  APPOINTMENT_REMINDER: "APPOINTMENT_REMINDER",
  NEW_MESSAGE: "NEW_MESSAGE",
  NEW_REVIEW: "NEW_REVIEW",
  PAYMENT_SUCCESS: "PAYMENT_SUCCESS",
  PROFILE_VERIFIED: "PROFILE_VERIFIED",
  PROFILE_REJECTED: "PROFILE_REJECTED",
} as const;
export type NotificationType = (typeof NotificationType)[keyof typeof NotificationType];

export const LicenseStatus = {
  /** None of the expert's fields is regulated. */
  NOT_REQUIRED: "NOT_REQUIRED",
  /** A regulated field is selected but no licence has been submitted yet. */
  MISSING: "MISSING",
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
} as const;
export type LicenseStatus = (typeof LicenseStatus)[keyof typeof LicenseStatus];

export const MeetingProvider = {
  GOOGLE_MEET: "GOOGLE_MEET",
  ZOOM: "ZOOM",
  TEAMS: "TEAMS",
  PHONE: "PHONE",
} as const;
export type MeetingProvider = (typeof MeetingProvider)[keyof typeof MeetingProvider];
