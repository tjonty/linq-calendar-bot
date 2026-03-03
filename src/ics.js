import crypto from "crypto";

function pad2(n) {
    return String(n).padStart(2, "0");
}

export function buildIcs({ startUtc, endUtc, summary = "Meeting", description = "" }) {
    const uid = crypto.randomUUID();
    const dtstamp = formatUtc(new Date());
    const dtstart = formatUtc(startUtc);
    const dtend = formatUtc(endUtc);

    return [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//Linq Calendar Bot//EN",
        "CALSCALE:GREGORIAN",
        "METHOD:REQUEST",
        "BEGIN:VEVENT",
        `UID:${uid}`,
        `DTSTAMP:${dtstamp}`,
        `DTSTART:${dtstart}`,
        `DTEND:${dtend}`,
        `SUMMARY:${escapeIcs(summary)}`,
        `DESCRIPTION:${escapeIcs(description)}`,
        "END:VEVENT",
        "END:VCALENDAR",
        ""
    ].join("\r\n");
}

function formatUtc(d) {
    const yyyy = d.getUTCFullYear();
    const mm = pad2(d.getUTCMonth() + 1);
    const dd = pad2(d.getUTCDate());
    const hh = pad2(d.getUTCHours());
    const mi = pad2(d.getUTCMinutes());
    const ss = pad2(d.getUTCSeconds());
    return `${yyyy}${mm}${dd}T${hh}${mi}${ss}Z`;
}

function escapeIcs(s) {
    return String(s)
        .replace(/\\/g, "\\\\")
        .replace(/\n/g, "\\n")
        .replace(/,/g, "\\,")
        .replace(/;/g, "\\;");
}