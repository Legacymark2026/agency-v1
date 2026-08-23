/**
 * Predictive Send-Time Optimization (STO) Engine (Mailchimp AI / Seventh Sense style)
 * ─────────────────────────────────────────────────────────────────────────────
 * Calculates the optimal personalized delivery hour for each recipient
 * based on their historical open timestamp clusters and timezone offsets.
 */

export interface RecipientEngagementProfile {
  email: string;
  timezone: string; // e.g. "America/Bogota", "America/New_York", "Europe/Madrid"
  historicalOpenHoursUTC: number[]; // Array of past open hours in UTC (0 to 23)
  personaType: "B2B_EXECUTIVE" | "FREELANCER_NIGHTOWL" | "STANDARD_CONSUMER";
}

export interface OptimalSendSchedule {
  email: string;
  recommendedLocalHour: number; // 0 to 23
  recommendedUTCHour: number;
  confidenceScore: number; // 0 to 100
  timeSlotDescription: string;
}

export class SendTimeOptimizerService {
  /**
   * Predicts the highest open probability hour for a recipient.
   */
  public calculateOptimalSendTime(profile: RecipientEngagementProfile): OptimalSendSchedule {
    let chosenLocalHour = 9; // Default 9:00 AM

    if (profile.historicalOpenHoursUTC.length > 0) {
      // Find mode of historical open hours
      const hourCounts: Record<number, number> = {};
      for (const h of profile.historicalOpenHoursUTC) {
        hourCounts[h] = (hourCounts[h] || 0) + 1;
      }

      let maxCount = 0;
      let modeHourUTC = 14; // Default ~9 AM COT (UTC-5)
      for (const [hStr, count] of Object.entries(hourCounts)) {
        const h = parseInt(hStr, 10);
        if (count > maxCount) {
          maxCount = count;
          modeHourUTC = h;
        }
      }

      // Timezone offset adjustment (assuming COT UTC-5 if America/Bogota)
      const offset = profile.timezone.includes("Bogota") ? -5 : profile.timezone.includes("New_York") ? -4 : 0;
      chosenLocalHour = (modeHourUTC + offset + 24) % 24;

      return {
        email: profile.email,
        recommendedLocalHour: chosenLocalHour,
        recommendedUTCHour: modeHourUTC,
        confidenceScore: Math.min(95, 60 + maxCount * 10),
        timeSlotDescription: `${chosenLocalHour}:00 horas (Basado en ${profile.historicalOpenHoursUTC.length} aperturas históricas)`,
      };
    }

    // Persona-based fallback
    if (profile.personaType === "B2B_EXECUTIVE") {
      chosenLocalHour = 8; // 8:00 AM
    } else if (profile.personaType === "FREELANCER_NIGHTOWL") {
      chosenLocalHour = 20; // 8:00 PM
    } else {
      chosenLocalHour = 11; // 11:00 AM
    }

    return {
      email: profile.email,
      recommendedLocalHour: chosenLocalHour,
      recommendedUTCHour: (chosenLocalHour + 5) % 24, // Assuming COT UTC-5
      confidenceScore: 70,
      timeSlotDescription: `${chosenLocalHour}:00 horas (Perfil ${profile.personaType})`,
    };
  }
}

export const sendTimeOptimizer = new SendTimeOptimizerService();
