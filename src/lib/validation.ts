import { z } from "zod";
import { t } from "@/lib/i18n/ar";

const v = t.validation;

export const loginSchema = z.object({
  email: z.string().min(1, v.required).email(v.invalidEmail),
  password: z.string().min(1, v.required),
});

export const registerSchema = z
  .object({
    role: z.enum(["EXPERT", "CLIENT"]),
    name: z.string().min(2, v.nameMin).max(80, v.tooLong(80)),
    email: z.string().min(1, v.required).email(v.invalidEmail),
    password: z.string().min(8, v.passwordMin).max(72, v.tooLong(72)),
    confirmPassword: z.string().min(1, v.required),
    phone: z
      .string()
      .regex(/^0(5)\d{8}$/, v.invalidPhone)
      .or(z.literal(""))
      .optional(),
    city: z.string().optional(),
    isCompany: z.boolean().optional(),
    companyName: z.string().max(120, v.tooLong(120)).optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: v.passwordMismatch,
    path: ["confirmPassword"],
  });

export const problemSchema = z.object({
  text: z.string().trim().min(20, v.problemMin).max(1500, v.problemMax),
});

export type ProblemInput = z.infer<typeof problemSchema>;

export const accountSettingsSchema = z.object({
  name: z.string().min(2, v.nameMin).max(80, v.tooLong(80)),
  phone: z
    .string()
    .regex(/^0(5)\d{8}$/, v.invalidPhone)
    .or(z.literal(""))
    .optional(),
  city: z.string().optional(),
});

export const profileBasicsSchema = z.object({
  headline: z.string().min(10, v.tooShort(10)).max(140, v.tooLong(140)),
  bio: z.string().min(60, v.tooShort(60)).max(2000, v.tooLong(2000)),
  previousTitle: z.string().min(2, v.required).max(120, v.tooLong(120)),
  previousOrganization: z.string().min(2, v.required).max(120, v.tooLong(120)),
  yearsOfExperience: z.coerce.number().int().min(1, v.minValue(1)).max(60, v.maxValue(60)),
  city: z.string().min(1, v.required),
  categoryIds: z.array(z.string()).min(1, v.selectOne),
});

export const experienceSchema = z
  .object({
    organization: z.string().min(2, v.required).max(120, v.tooLong(120)),
    position: z.string().min(2, v.required).max(120, v.tooLong(120)),
    startYear: z.coerce.number().int().min(1950, v.invalidYear).max(new Date().getFullYear(), v.invalidYear),
    endYear: z.coerce
      .number()
      .int()
      .min(1950, v.invalidYear)
      .max(new Date().getFullYear(), v.invalidYear)
      .optional(),
    isCurrent: z.boolean().default(false),
    description: z.string().max(600, v.tooLong(600)).optional(),
  })
  .refine((data) => data.isCurrent || data.endYear !== undefined, {
    message: v.required,
    path: ["endYear"],
  });

export const educationSchema = z.object({
  institution: z.string().min(2, v.required).max(120, v.tooLong(120)),
  degree: z.string().min(2, v.required).max(120, v.tooLong(120)),
  field: z.string().max(120, v.tooLong(120)).optional(),
  graduationYear: z.coerce
    .number()
    .int()
    .min(1950, v.invalidYear)
    .max(new Date().getFullYear(), v.invalidYear)
    .optional(),
});

export const certificationSchema = z.object({
  name: z.string().min(2, v.required).max(140, v.tooLong(140)),
  issuer: z.string().min(2, v.required).max(120, v.tooLong(120)),
  issueYear: z.coerce
    .number()
    .int()
    .min(1950, v.invalidYear)
    .max(new Date().getFullYear(), v.invalidYear)
    .optional(),
  credentialUrl: z.string().url(v.required).or(z.literal("")).optional(),
});

export const skillSchema = z.object({
  name: z.string().min(2, v.tooShort(2)).max(40, v.tooLong(40)),
});

export const serviceSchema = z.object({
  name: z.string().min(6, v.tooShort(6)).max(140, v.tooLong(140)),
  description: z.string().min(30, v.tooShort(30)).max(800, v.tooLong(800)),
  durationMinutes: z.coerce.number().int().min(15, v.minValue(15)).max(480, v.maxValue(480)),
  priceSar: z.coerce.number().int().min(50, v.minValue(50)).max(20000, v.maxValue(20000)),
});

export const availabilitySchema = z
  .object({
    dayOfWeek: z.coerce.number().int().min(0).max(6),
    startMinute: z.coerce.number().int().min(0).max(1439),
    endMinute: z.coerce.number().int().min(1).max(1440),
  })
  .refine((data) => data.endMinute > data.startMinute, {
    message: "وقت النهاية يجب أن يكون بعد وقت البداية",
    path: ["endMinute"],
  });

export const bookingSchema = z.object({
  serviceId: z.string().min(1, v.required),
  scheduledAt: z.string().min(1, v.required),
  description: z.string().min(20, v.tooShort(20)).max(2000, v.tooLong(2000)),
  /** Present when the booking came out of an AI match. */
  requestId: z.string().optional(),
});

export const paymentSchema = z
  .object({
    method: z.enum(["MADA", "APPLE_PAY", "CARD"]),
    cardName: z.string().optional(),
    cardNumber: z.string().optional(),
    expiry: z.string().optional(),
    cvv: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.method === "APPLE_PAY") return;

    const digits = (data.cardNumber ?? "").replace(/\s/g, "");
    if (!/^\d{16}$/.test(digits)) {
      ctx.addIssue({ code: "custom", message: v.invalidCard, path: ["cardNumber"] });
    }
    if (!data.cardName || data.cardName.trim().length < 3) {
      ctx.addIssue({ code: "custom", message: v.required, path: ["cardName"] });
    }
    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(data.expiry ?? "")) {
      ctx.addIssue({ code: "custom", message: v.invalidExpiry, path: ["expiry"] });
    }
    if (!/^\d{3,4}$/.test(data.cvv ?? "")) {
      ctx.addIssue({ code: "custom", message: v.invalidCvv, path: ["cvv"] });
    }
  });

export const reviewSchema = z.object({
  rating: z.coerce.number().int().min(1, v.ratingRequired).max(5, v.ratingRequired),
  comment: z.string().min(10, v.tooShort(10)).max(800, v.tooLong(800)),
});

export const messageSchema = z.object({
  body: z.string().min(1, v.required).max(2000, v.tooLong(2000)),
});

export const categorySchema = z.object({
  name: z.string().min(2, v.tooShort(2)).max(60, v.tooLong(60)),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ProfileBasicsInput = z.infer<typeof profileBasicsSchema>;
export type ServiceInput = z.infer<typeof serviceSchema>;
export type BookingInput = z.infer<typeof bookingSchema>;
export type PaymentInput = z.infer<typeof paymentSchema>;
export type ReviewInput = z.infer<typeof reviewSchema>;
