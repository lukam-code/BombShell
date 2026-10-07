import { siteConfig } from "./siteConfig";
import { formatBelgrade, formatTime } from "./time";
import type { Booking } from "./types";

/**
 * PROBNI REŽIM za dugmad "SMS / Viber / WhatsApp" u admin panelu:
 * dok je ovde upisan broj, poruke se otvaraju ka ovom broju umesto ka klijentkinji.
 * Za pravi rad postavite na null. (Ovaj fajl koristi samo admin panel – broj nije na javnom sajtu.)
 */
export const ADMIN_MESSAGE_TEST_RECIPIENT: string | null = "+381629603888";

export type ManualMessageType = "confirmation" | "reminder" | "cancellation";

/** Tekst poruke koju salon šalje sa svog telefona (SMS / Viber / WhatsApp) – bez ikakvog servisa. */
export function buildCustomerMessage(type: ManualMessageType, b: Booking) {
  const first = b.customer_name.trim().split(/\s+/)[0];
  const service = b.services?.name ?? "tretman";
  const day = formatBelgrade(b.start_time, "EEEE d.M.");
  const time = formatTime(b.start_time);
  const cancelUrl = `${siteConfig.url}/otkazivanje/${b.cancel_token}`;
  switch (type) {
    case "confirmation":
      return `Poštovana ${first}, Vaš termin u salonu BOMBSHELL je potvrđen: ${service}, ${day} u ${time}. Adresa: ${siteConfig.address.street}, ${siteConfig.address.city}. Ako ne možete da dođete, otkažite najkasnije 24h ranije: ${cancelUrl} Vidimo se! BOMBSHELL`;
    case "reminder":
      return `Poštovana ${first}, podsetnik: ${day} u ${time} imate termin u salonu BOMBSHELL (${service}). Ako ne možete da dođete, otkažite ovde: ${cancelUrl} ili nas pozovite na ${siteConfig.phone.display}.`;
    case "cancellation":
      return `Poštovana ${first}, Vaš termin u salonu BOMBSHELL (${service}, ${day} u ${time}) je otkazan. Novi termin možete zakazati na ${siteConfig.url}/zakazivanje ili pozivom na ${siteConfig.phone.display}.`;
  }
}

/** Linkovi koji otvaraju aplikaciju na telefonu sa već upisanim brojem i porukom. */
export function messageLinks(phoneE164: string, text: string) {
  const digits = phoneE164.replace(/\D/g, "");
  const enc = encodeURIComponent(text);
  return {
    // "?&body=" radi i na iPhone-u i na Androidu
    sms: `sms:${phoneE164}?&body=${enc}`,
    whatsapp: `https://wa.me/${digits}?text=${enc}`,
    viber: `viber://chat?number=%2B${digits}&draft=${enc}`,
  };
}
