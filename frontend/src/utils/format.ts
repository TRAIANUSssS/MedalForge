export function formatTime(ms: number | null) {
  if (ms === null) return "N/A";
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const millis = Math.abs(ms % 1000);
  return `${minutes}:${String(seconds).padStart(2, "0")}.${String(millis).padStart(3, "0")}`;
}

export function formatGap(ms: number | null) {
  if (ms === null) return "N/A";
  const rounded = Math.round(ms);
  if (Math.abs(rounded) < 1000) return `${Math.abs(rounded)} ms`;
  return formatTime(Math.abs(rounded));
}

export function formatPercent(value: number, digits = 0) {
  return `${value.toFixed(digits)}%`;
}

export function formatNumber(value: number | null) {
  if (value === null) return "N/A";
  return new Intl.NumberFormat().format(value);
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export function cleanTrackmaniaText(value: string | null | undefined) {
  if (!value) return null;
  return value.replace(/\$[0-9a-fA-F]{3}/g, "").replace(/\$[a-zA-Z<>]/g, "").replace(/\s+/g, " ").trim();
}

export function formatRequiredPosition(value: number | null, status?: string | null) {
  if (status === "over_10000") return "10k+";
  if (value === null) return "N/A";
  return `#${formatNumber(value)}`;
}
