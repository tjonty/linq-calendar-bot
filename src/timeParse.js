import * as chrono from "chrono-node";
import { DateTime } from "luxon";

/**
 * Parse input like: "Tue 4:30pm 15 min CST"
 * Returns { startUtc: Date, endUtc: Date, debug: {...} }
 */
export function parseMeetingRequest(text) {
    const raw = (text || "").trim();

    // Duration: supports "15", "15m", "15 min", "1h", "60 minutes"
    const dur = parseDurationMinutes(raw) ?? 30;

    // Timezone: map common inputs to IANA zones
    // For your user (America/Chicago), "CST" in March is actually CDT in practice,
    // but users say CST loosely. We'll treat CST/CT as America/Chicago.
    const zone = extractZone(raw) ?? "America/Chicago";

    // Parse the date/time (next occurrence if weekday)
    const ref = new Date(); // now
    const result = chrono.parse(raw, ref, { forwardDate: true })[0];
    if (!result) {
        throw new Error(`Could not parse date/time from: "${raw}"`);
    }

    // Chrono gives us a Date in local machine timezone. We rebuild it in the chosen zone.
    const startJS = result.start.date(); // JS Date
    const startInZone = DateTime.fromJSDate(startJS, { zone }); // interpret in zone

    // If chrono parsed without a year, it's still okay; forwardDate helps for weekday names.
    // But if your machine timezone isn't the same as "zone", we should recompose from components.
    // This is more reliable:
    const comps = result.start.knownValues; // {year, month, day, hour, minute, ...} subset
    const startFixed = DateTime.fromObject(
        {
            year: comps.year ?? startInZone.year,
            month: comps.month ?? startInZone.month,
            day: comps.day ?? startInZone.day,
            hour: comps.hour ?? startInZone.hour,
            minute: comps.minute ?? startInZone.minute,
            second: 0,
        },
        { zone }
    );

    const endFixed = startFixed.plus({ minutes: dur });

    return {
        startUtc: startFixed.toUTC().toJSDate(),
        endUtc: endFixed.toUTC().toJSDate(),
        debug: {
            zone,
            durationMinutes: dur,
            startLocal: startFixed.toISO(),
            endLocal: endFixed.toISO(),
            startUtc: startFixed.toUTC().toISO(),
            endUtc: endFixed.toUTC().toISO(),
        },
    };
}

function parseDurationMinutes(text) {
    const t = text.toLowerCase();

    // "15 min", "15 minutes", "15m"
    let m = t.match(/\b(\d{1,3})\s*(m|min|mins|minute|minutes)\b/);
    if (m) return Number(m[1]);

    // "1h", "2 hours"
    m = t.match(/\b(\d{1,2})\s*(h|hr|hrs|hour|hours)\b/);
    if (m) return Number(m[1]) * 60;

    // trailing "15" (risky, but handy)
    m = t.match(/\b(\d{1,3})\b/);
    if (m) return Number(m[1]);

    return null;
}

function extractZone(text) {
    const t = text.toUpperCase();

    // Treat CST/CDT/CT as America/Chicago for your use case
    if (/\b(CST|CDT|CT)\b/.test(t)) return "America/Chicago";

    if (/\bEST|EDT|ET\b/.test(t)) return "America/New_York";
    if (/\bPST|PDT|PT\b/.test(t)) return "America/Los_Angeles";
    if (/\bMST|MDT|MT\b/.test(t)) return "America/Denver";

    return null;
}
