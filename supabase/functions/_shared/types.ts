export type BookingRow = {
  id: string;
  service_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  note: string | null;
  start_time: string;
  end_time: string;
  status: "pending" | "confirmed" | "cancelled" | "completed" | "no_show";
  cancel_token: string;
  notifications_opt_in: boolean;
  cancelled_by: "customer" | "salon" | null;
  services?: { name: string; duration_minutes: number; price_rsd: number | null } | null;
};

export type ReviewRow = {
  id: string;
  customer_name: string;
  rating: number;
  text: string;
  created_at: string;
  services?: { name: string } | null;
};

export type LogEntry = {
  booking_id: string | null;
  channel: "viber" | "sms" | "email";
  type: "confirmation" | "reminder" | "cancellation" | "salon_new" | "salon_cancelled" | "salon_review";
  recipient: string | null;
  status: "sent" | "failed" | "skipped";
  error?: string | null;
};

/** Minimalan interfejs prema bazi – u produkciji Supabase klijent, u testovima lažna implementacija. */
export interface Db {
  getBooking(id: string): Promise<BookingRow | null>;
  getReview(id: string): Promise<ReviewRow | null>;
  claimDueReminders(): Promise<BookingRow[]>;
  log(entry: LogEntry): Promise<void>;
}
