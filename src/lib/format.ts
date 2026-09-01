const LOCALE = "ar-SA-u-ca-gregory-nu-latn";

export function formatSar(amount: number): string {
  return `${new Intl.NumberFormat(LOCALE).format(amount)} ريال`;
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat(LOCALE).format(value);
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat(LOCALE, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}

export function formatShortDate(date: Date | string): string {
  return new Intl.DateTimeFormat(LOCALE, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export function formatTime(date: Date | string): string {
  return new Intl.DateTimeFormat(LOCALE, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(date));
}

export function formatDateTime(date: Date | string): string {
  return `${formatDate(date)} — ${formatTime(date)}`;
}

export function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${formatNumber(minutes)} دقيقة`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  const hoursLabel = hours === 1 ? "ساعة" : hours === 2 ? "ساعتان" : `${formatNumber(hours)} ساعات`;
  return rest ? `${hoursLabel} و${formatNumber(rest)} دقيقة` : hoursLabel;
}

export function formatYears(years: number): string {
  if (years === 1) return "سنة واحدة";
  if (years === 2) return "سنتان";
  if (years <= 10) return `${formatNumber(years)} سنوات`;
  return `${formatNumber(years)} سنة`;
}

export function formatRelativeTime(date: Date | string): string {
  const target = new Date(date).getTime();
  const diffSeconds = Math.round((target - Date.now()) / 1000);
  const absSeconds = Math.abs(diffSeconds);

  const rtf = new Intl.RelativeTimeFormat("ar", { numeric: "auto" });
  if (absSeconds < 60) return rtf.format(Math.round(diffSeconds), "second");
  if (absSeconds < 3600) return rtf.format(Math.round(diffSeconds / 60), "minute");
  if (absSeconds < 86400) return rtf.format(Math.round(diffSeconds / 3600), "hour");
  if (absSeconds < 2592000) return rtf.format(Math.round(diffSeconds / 86400), "day");
  if (absSeconds < 31536000) return rtf.format(Math.round(diffSeconds / 2592000), "month");
  return rtf.format(Math.round(diffSeconds / 31536000), "year");
}

export function minutesToTimeLabel(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const period = hours < 12 ? "ص" : "م";
  const displayHour = hours % 12 === 0 ? 12 : hours % 12;
  return `${displayHour}:${String(mins).padStart(2, "0")} ${period}`;
}

export function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("");
}
