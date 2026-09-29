export function eur(value: number): string {
  return new Intl.NumberFormat("bs-BA", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);
}

export function sqm(value: number): string {
  return `${new Intl.NumberFormat("bs-BA", { maximumFractionDigits: 2 }).format(value)} m²`;
}

export function dateBs(value: string): string {
  const d = new Date(value);
  return new Intl.DateTimeFormat("bs-BA", { day: "2-digit", month: "2-digit", year: "numeric" }).format(d);
}

export const STATUSES = [
  { value: "slobodan", label: "Slobodan" },
  { value: "rezervisan", label: "Rezervisan" },
  { value: "prodan", label: "Prodan" },
] as const;
