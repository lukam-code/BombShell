import type { PostgrestError } from "@supabase/supabase-js";

export type Slot = { start_time: string; label: string };

export type BookingErrorKind = "slot_taken" | "validation" | "limit" | "not_found" | "deadline" | "network";

/** Prevodi greške iz Supabase RPC funkcija (SQLSTATE BSxxx) u poruke za korisnika. */
export function mapRpcError(error: PostgrestError | Error | null | undefined): { kind: BookingErrorKind; message: string } {
  const code = (error as PostgrestError | undefined)?.code;
  const message = error?.message ?? "";
  switch (code) {
    case "BS409":
      return { kind: "slot_taken", message: "Nažalost, ovaj termin je upravo zauzet. Izaberite drugi." };
    case "BS429":
      return { kind: "limit", message };
    case "BS404":
      return { kind: "not_found", message };
    case "BS410":
      return { kind: "deadline", message };
    case "BS400":
    case "BS422":
      return { kind: "validation", message };
    default:
      return {
        kind: "network",
        message: "Došlo je do greške u komunikaciji. Proverite internet vezu i pokušajte ponovo, ili nas pozovite.",
      };
  }
}
