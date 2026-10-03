import { z } from "zod";
import { normalizeSerbianPhone } from "./phone";

export const customerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Unesite ime i prezime.")
    .max(100, "Ime je predugačko.")
    .refine((v) => v.split(/\s+/).length >= 2, "Unesite i ime i prezime."),
  phone: z
    .string()
    .trim()
    .min(1, "Unesite broj telefona.")
    .refine((v) => normalizeSerbianPhone(v) !== null, "Unesite ispravan broj mobilnog telefona (npr. 065 123 4567)."),
  email: z
    .string()
    .trim()
    .max(200)
    .optional()
    .refine((v) => !v || z.string().email().safeParse(v).success, "Unesite ispravnu email adresu."),
  note: z.string().trim().max(300, "Napomena može imati najviše 300 karaktera.").optional(),
  optIn: z.boolean(),
  website: z.string().optional(), // honeypot
});

export type CustomerForm = z.infer<typeof customerSchema>;

export const reviewSchema = z.object({
  name: z.string().trim().min(2, "Unesite ime.").max(60, "Ime je predugačko."),
  rating: z.number({ invalid_type_error: "Izaberite ocenu." }).int().min(1, "Izaberite ocenu.").max(5),
  serviceId: z.string().optional(),
  text: z
    .string()
    .trim()
    .min(10, "Recenzija mora imati najmanje 10 karaktera.")
    .max(500, "Recenzija može imati najviše 500 karaktera."),
  website: z.string().optional(), // honeypot
});

export type ReviewForm = z.infer<typeof reviewSchema>;
