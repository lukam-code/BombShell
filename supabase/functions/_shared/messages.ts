// Tekstovi SMS/Viber poruka. Viber koristi pravilna slova (č, ć, š, ž, đ),
// a SMS verzija se automatski prevodi u GSM-7 (bez kvačica i bez emotikona).
import { shortDate, time, toGsm7, weekday } from "./format.ts";
import { SALON } from "./salon.ts";

export type CustomerMessageType = "confirmation" | "reminder" | "cancellation";

export type MessageInput = {
  serviceName: string;
  startTime: string;
  cancelUrl: string;
  siteUrl: string;
};

export function viberText(type: CustomerMessageType, m: MessageInput) {
  switch (type) {
    case "confirmation":
      return `BOMBSHELL: Vaš termin je zakazan – ${m.serviceName}, ${weekday(m.startTime)} ${shortDate(m.startTime)} u ${time(m.startTime)}. Adresa: ${SALON.address}. Otkazivanje najkasnije 24h ranije: ${m.cancelUrl}`;
    case "reminder":
      return `BOMBSHELL: Podsetnik – sutra u ${time(m.startTime)} imate termin (${m.serviceName}). Ako ne možete da dođete, otkažite ovde: ${m.cancelUrl} ili pozovite ${SALON.phoneShort}.`;
    case "cancellation":
      return `BOMBSHELL: Vaš termin ${shortDate(m.startTime)} u ${time(m.startTime)} je otkazan. Za novi termin: ${m.siteUrl}/zakazivanje`;
  }
}

export function smsText(type: CustomerMessageType, m: MessageInput) {
  return toGsm7(viberText(type, m));
}
