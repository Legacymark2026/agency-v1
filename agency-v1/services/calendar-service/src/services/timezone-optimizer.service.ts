/**
 * Intelligent Timezone Optimizer & Slot Converter
 * ─────────────────────────────────────────────────────────────────────────────
 * Finds optimal non-conflicting meeting slots across global timezones
 * (COT, EST, PST, UTC, CET).
 */

export interface TimezoneSlotInput {
  hostTimezone: string; // e.g. "America/Bogota" or "America/New_York"
  guestTimezones: string[];
  proposedHourUTC: number; // 0 to 23
}

export interface OptimizedSlotResult {
  utcHour: number;
  hostLocalTime: string;
  guestLocalTimes: Record<string, string>;
  isOptimal: boolean;
  score: number; // 0 to 100
}

export function findOptimalMeetingSlot(input: TimezoneSlotInput): OptimizedSlotResult {
  const utcHour = input.proposedHourUTC;

  // Offset map in hours relative to UTC
  const offsets: Record<string, number> = {
    "America/Bogota": -5,
    "America/New_York": -4,
    "America/Los_Angeles": -7,
    "Europe/Madrid": 2,
    "UTC": 0,
  };

  const getLocalFormatted = (tz: string, hour: number) => {
    const offset = offsets[tz] ?? 0;
    let local = (hour + offset + 24) % 24;
    const ampm = local >= 12 ? "PM" : "AM";
    const hour12 = local % 12 === 0 ? 12 : local % 12;
    return `${hour12}:00 ${ampm} (${tz})`;
  };

  const hostOffset = offsets[input.hostTimezone] ?? -5;
  const hostLocalHour = (utcHour + hostOffset + 24) % 24;

  const guestLocalTimes: Record<string, string> = {};
  let totalScore = 100;

  for (const gTz of input.guestTimezones) {
    guestLocalTimes[gTz] = getLocalFormatted(gTz, utcHour);
    const gOffset = offsets[gTz] ?? 0;
    const gHour = (utcHour + gOffset + 24) % 24;

    // Deduct points for hours outside business window (8 AM to 6 PM)
    if (gHour < 8 || gHour > 18) totalScore -= 30;
  }

  if (hostLocalHour < 8 || hostLocalHour > 18) totalScore -= 30;

  return {
    utcHour,
    hostLocalTime: getLocalFormatted(input.hostTimezone, utcHour),
    guestLocalTimes,
    isOptimal: totalScore >= 70,
    score: Math.max(0, totalScore),
  };
}
