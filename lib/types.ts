export type ServiceCategory = {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  sort_order: number;
};

export type Service = {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  price_rsd: number | null;
  is_active: boolean;
  sort_order: number;
};

export type CategoryWithServices = ServiceCategory & { services: Service[] };

export type BookingStatus = "pending" | "confirmed" | "cancelled" | "completed" | "no_show";

export type Booking = {
  id: string;
  service_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  note: string | null;
  start_time: string;
  end_time: string;
  status: BookingStatus;
  cancel_token: string;
  notifications_opt_in: boolean;
  reminder_sent_at: string | null;
  cancelled_by: "customer" | "salon" | null;
  created_at: string;
  services?: { name: string; duration_minutes: number; price_rsd: number | null } | null;
};

/** Javni prikaz recenzije – bez punog imena (anonimni korisnici ne vide customer_name). */
export type PublicReview = {
  id: string;
  display_name: string;
  rating: number;
  text: string;
  service_id: string | null;
  created_at: string;
  services?: { name: string } | null;
};

export type Review = PublicReview & { customer_name: string; is_approved: boolean };

export type ReviewsSummary = { average: number; count: number };

export type WorkingHours = {
  id: number;
  day_of_week: number;
  open_time: string;
  close_time: string;
  is_closed: boolean;
};

export type BlockedDate = { id: number; date: string; reason: string | null };

export type NotificationLog = {
  id: number;
  booking_id: string | null;
  channel: "viber" | "sms" | "email";
  type: string;
  recipient: string | null;
  status: "sent" | "failed" | "skipped";
  error: string | null;
  created_at: string;
};

export type BookingByToken = {
  service_name: string;
  start_time: string;
  end_time: string;
  status: BookingStatus;
  can_cancel: boolean;
};

export const STATUS_LABELS: Record<BookingStatus, string> = {
  pending: "Na čekanju",
  confirmed: "Potvrđen",
  cancelled: "Otkazan",
  completed: "Završen",
  no_show: "Nije došla",
};
