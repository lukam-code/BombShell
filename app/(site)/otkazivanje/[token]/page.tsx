import type { Metadata } from "next";
import { CancelBooking } from "@/components/cancel/CancelBooking";
import { getPublicSupabase } from "@/lib/supabase/public";
import type { BookingByToken } from "@/lib/types";

export const metadata: Metadata = {
  title: "Otkazivanje termina",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function CancelPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  let booking: BookingByToken | null = null;
  let loadError = false;

  if (UUID_RE.test(token)) {
    const sb = getPublicSupabase();
    if (!sb) loadError = true;
    else {
      const { data, error } = await sb.rpc("get_booking_by_token", { p_token: token }).maybeSingle<BookingByToken>();
      if (error) loadError = true;
      booking = data ?? null;
    }
  }

  return (
    <div className="min-h-[80vh] bg-gradient-to-b from-rose-50 to-cream">
      <div className="container-page max-w-xl pb-24 pt-28 sm:pt-36">
        <CancelBooking token={token} initial={booking} loadError={loadError} />
      </div>
    </div>
  );
}
