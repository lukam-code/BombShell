/** Srpska množina: plural(1,"recenzija","recenzije","recenzija") */
export function plural(n: number, one: string, few: string, many: string) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}

export const reviewsWord = (n: number) => plural(n, "recenzija", "recenzije", "recenzija");
