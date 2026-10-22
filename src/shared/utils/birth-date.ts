import { onlyDigits } from "./cpf";

export function maskBirthDate(value: string): string {
  const digits = onlyDigits(value).slice(0, 8);

  return digits
    .replace(/^(\d{2})(\d)/, "$1/$2")
    .replace(/^(\d{2})\/(\d{2})(\d)/, "$1/$2/$3");
}

/** `DD/MM/AAAA` → `AAAA-MM-DD`, or null if it isn't a real date. */
export function birthDateToIso(value: string): string | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  if (!match) {
    return null;
  }

  const [, day, month, year] = match;
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  const isRealDate =
    date.getUTCFullYear() === Number(year) &&
    date.getUTCMonth() === Number(month) - 1 &&
    date.getUTCDate() === Number(day);

  if (!isRealDate || Number(year) < 1900 || date.getTime() > Date.now()) {
    return null;
  }

  return `${year}-${month}-${day}`;
}
