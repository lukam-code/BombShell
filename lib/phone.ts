/**
 * Normalizuje srpski broj mobilnog telefona u E.164 format (+3816XXXXXXX).
 * Prihvata: 06x..., +3816x..., 003816x..., 3816x... (sa razmacima, crticama, zagradama).
 * Vraća null ako broj nije validan srpski mobilni broj.
 */
export function normalizeSerbianPhone(input: string): string | null {
  if (!input) return null;
  const cleaned = input.trim().replace(/[\s\-/().]/g, "");
  let national: string | null = null;
  if (/^\+381\d+$/.test(cleaned)) national = cleaned.slice(4);
  else if (/^00381\d+$/.test(cleaned)) national = cleaned.slice(5);
  else if (/^381\d+$/.test(cleaned)) national = cleaned.slice(3);
  else if (/^0\d+$/.test(cleaned)) national = cleaned.slice(1);
  if (!national) return null;
  // Mobilni: 6x + 6–7 cifara (npr. 65 662 6031, 60 123 4567, 64 123 456)
  if (!/^6\d{7,8}$/.test(national)) return null;
  return `+381${national}`;
}

/** +381656626031 → "065 662 6031" */
export function formatPhoneLocal(e164: string) {
  const m = e164.match(/^\+381(6\d)(\d{3})(\d{3,4})$/);
  if (!m) return e164;
  return `0${m[1]} ${m[2]} ${m[3]}`;
}

/**
 * Za admin panel (zakazivanje telefonom): prihvata i fiksne brojeve (npr. 021 123 456).
 * Vraća E.164 (+381...) ili null.
 */
export function normalizeSerbianPhoneAny(input: string): string | null {
  const mobile = normalizeSerbianPhone(input);
  if (mobile) return mobile;
  const cleaned = (input || "").trim().replace(/[\s\-/().]/g, "");
  let national: string | null = null;
  if (/^\+381\d+$/.test(cleaned)) national = cleaned.slice(4);
  else if (/^00381\d+$/.test(cleaned)) national = cleaned.slice(5);
  else if (/^0\d+$/.test(cleaned)) national = cleaned.slice(1);
  if (!national || !/^[1-9]\d{6,9}$/.test(national)) return null;
  return `+381${national}`;
}
