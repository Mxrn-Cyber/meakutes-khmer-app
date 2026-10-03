// Turns an event's date into real dates.
// Uses event_date (YYYY-MM-DD) when the admin set one, otherwise reads the
// label shown on the site, e.g. "November 25", "April 13 - April 16",
// "September 15 - October 15", "May 2, 2026".
const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

function parsePart(text, fallbackMonth) {
  const t = text.trim().toLowerCase().replace(",", " ");
  const m = t.match(/([a-z]+)?\s*(\d{1,2})?\s*(\d{4})?/);
  if (!m) return null;
  const monthIdx = m[1] ? MONTHS.findIndex((x) => m[1].startsWith(x)) : fallbackMonth;
  if (monthIdx == null || monthIdx < 0) return null;
  const day = m[2] ? Number(m[2]) : 1;
  const year = m[3] ? Number(m[3]) : null;
  return { month: monthIdx, day, year };
}

export function eventRange(item, today = new Date()) {
  if (item?.event_date) {
    const start = new Date(`${item.event_date}T00:00:00`);
    if (!Number.isNaN(start.getTime())) {
      const end = new Date(start);
      end.setHours(23, 59, 59);
      return { start, end };
    }
  }
  const label = item?.date || item?.date_label || "";
  if (!label) return null;
  const [a, b] = label.split(/\s[-–]\s|-/);
  const first = parsePart(a);
  if (!first) return null;
  const second = b ? parsePart(b, first.month) : first;
  if (!second) return null;

  const baseYear = first.year || today.getFullYear();
  let start = new Date(baseYear, first.month, first.day);
  let end = new Date(second.year || baseYear, second.month, second.day, 23, 59, 59);
  if (end < start) end.setFullYear(end.getFullYear() + 1);
  // No year given and it already ended this year: it's next year's edition.
  if (!first.year && end < today) {
    start.setFullYear(start.getFullYear() + 1);
    end.setFullYear(end.getFullYear() + 1);
  }
  return { start, end };
}

export function eventStatus(item, today = new Date()) {
  const r = eventRange(item, today);
  if (!r) return "unknown";
  if (today >= r.start && today <= r.end) return "now";
  return r.start > today ? "upcoming" : "past";
}

export function daysUntil(item, today = new Date()) {
  const r = eventRange(item, today);
  if (!r) return null;
  return Math.ceil((r.start - today) / 86400000);
}

const ymd = (d) => `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;

export function googleCalendarUrl(item) {
  const r = eventRange(item);
  if (!r) return null;
  const endExclusive = new Date(r.end);
  endExclusive.setDate(endExclusive.getDate() + 1);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: item.title || "Event",
    dates: `${ymd(r.start)}/${ymd(endExclusive)}`,
    details: [item.description, item.bestTime && `Best time: ${item.bestTime}`].filter(Boolean).join("\n\n"),
    location: item.location || "Cambodia",
  });
  return `https://calendar.google.com/calendar/render?${params}`;
}

const icsEscape = (s = "") => String(s).replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");

export function downloadIcs(item) {
  const r = eventRange(item);
  if (!r) return false;
  const endExclusive = new Date(r.end);
  endExclusive.setDate(endExclusive.getDate() + 1);
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Meakutes-Khmer//Events//EN",
    "BEGIN:VEVENT",
    `UID:event-${item.id}@meakutes-khmer`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").split(".")[0]}Z`,
    `DTSTART;VALUE=DATE:${ymd(r.start)}`,
    `DTEND;VALUE=DATE:${ymd(endExclusive)}`,
    `SUMMARY:${icsEscape(item.title)}`,
    `DESCRIPTION:${icsEscape(item.description)}`,
    `LOCATION:${icsEscape(item.location || "Cambodia")}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `${(item.title || "event").replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return true;
}

const KHMER_MONTHS = ["មករា", "កុម្ភៈ", "មីនា", "មេសា", "ឧសភា", "មិថុនា", "កក្កដា", "សីហា", "កញ្ញា", "តុលា", "វិច្ឆិកា", "ធ្នូ"];
const KHMER_DIGITS = "០១២៣៤៥៦៧៨៩";

export function dateBadge(item, locale = "en") {
  const r = eventRange(item);
  if (!r) return null;
  if (locale.startsWith("km")) {
    return {
      month: KHMER_MONTHS[r.start.getMonth()],
      day: String(r.start.getDate()).replace(/[0-9]/g, (d) => KHMER_DIGITS[d]),
    };
  }
  return {
    month: r.start.toLocaleString("en", { month: "short" }).toUpperCase(),
    day: r.start.getDate(),
  };
}
