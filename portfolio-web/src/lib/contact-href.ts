const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";

export function toAsciiDigits(value: string): string {
  return value.replace(/[۰-۹]/g, (digit) => String(PERSIAN_DIGITS.indexOf(digit)));
}

export function toTelHref(phone: string | undefined): string | null {
  if (!phone?.trim()) return null;
  const ascii = toAsciiDigits(phone.trim());
  const plus = ascii.startsWith("+");
  const digits = ascii.replace(/\D/g, "");
  if (digits.length < 8) return null;
  if (plus) return `tel:+${digits}`;
  if (digits.startsWith("00") && digits.length > 8) return `tel:+${digits.slice(2)}`;
  if (digits.startsWith("0") && digits.length >= 10) return `tel:+98${digits.slice(1)}`;
  return `tel:${digits}`;
}

export function toMailtoHref(email: string | undefined): string | null {
  if (!email?.includes("@")) return null;
  return `mailto:${email.trim()}`;
}

export function toWhatsAppHref(number: string | undefined): string | null {
  if (!number?.trim()) return null;
  const ascii = toAsciiDigits(number.trim());
  const digits = ascii.replace(/\D/g, "");
  if (digits.length < 8) return null;
  return `https://wa.me/${digits}`;
}
