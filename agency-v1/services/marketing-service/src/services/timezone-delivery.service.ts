export interface RecipientTimezoneGroup {
  timezone: string;
  utcOffsetHours: number;
  scheduledTimeLocal: string;
  recipientsCount: number;
  recipients: any[];
}

export class TimezoneDeliveryService {
  /**
   * Agrupar destinatarios por zona horaria y calcular la hora de despacho en UTC para que coincida con las 9:00 AM local
   */
  static groupRecipientsByTimezone(
    recipients: any[],
    targetLocalHour: number = 9
  ): RecipientTimezoneGroup[] {
    if (!recipients || recipients.length === 0) return [];

    const groupsMap: Record<string, { offset: number; recipients: any[] }> = {};

    recipients.forEach((r) => {
      const tz = r.timezone || "America/Bogota";
      const offset = this.getTimezoneOffsetHours(tz);

      if (!groupsMap[tz]) {
        groupsMap[tz] = { offset, recipients: [] };
      }
      groupsMap[tz].recipients.push(r);
    });

    return Object.entries(groupsMap).map(([tz, data]) => {
      const now = new Date();
      const scheduledUtc = new Date(now);
      // Ajustar hora objetivo 9:00 AM en la zona horaria del destinatario
      scheduledUtc.setUTCHours(targetLocalHour - data.offset, 0, 0, 0);

      return {
        timezone: tz,
        utcOffsetHours: data.offset,
        scheduledTimeLocal: `${targetLocalHour}:00 AM`,
        recipientsCount: data.recipients.length,
        recipients: data.recipients
      };
    });
  }

  private static getTimezoneOffsetHours(timezone: string): number {
    const offsets: Record<string, number> = {
      "America/Bogota": -5,
      "America/Mexico_City": -6,
      "America/New_York": -4,
      "America/Argentina/Buenos_Aires": -3,
      "Europe/Madrid": 2,
      "Europe/London": 1
    };
    return offsets[timezone] !== undefined ? offsets[timezone] : -5;
  }
}
