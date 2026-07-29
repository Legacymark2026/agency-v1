import { prisma } from "@agency/database";

export interface AbTestMetrics {
  variantA: {
    subject: string;
    recipientsCount: number;
    opens: number;
    clicks: number;
    openRate: number;
    clickRate: number;
  };
  variantB: {
    subject: string;
    recipientsCount: number;
    opens: number;
    clicks: number;
    openRate: number;
    clickRate: number;
  };
  winner: "A" | "B" | "TIE";
  winningSubject: string;
}

export class AbTestingService {
  /**
   * Dividir una lista de destinatarios para prueba A/B (10% A, 10% B, 80% Pendientes para el ganador)
   */
  static splitRecipientsForAbTest(recipients: any[]): {
    sampleA: any[];
    sampleB: any[];
    remaining: any[];
  } {
    if (!recipients || recipients.length === 0) {
      return { sampleA: [], sampleB: [], remaining: [] };
    }

    const total = recipients.length;
    const sampleSize = Math.max(1, Math.floor(total * 0.1));

    const sampleA = recipients.slice(0, sampleSize);
    const sampleB = recipients.slice(sampleSize, sampleSize * 2);
    const remaining = recipients.slice(sampleSize * 2);

    return { sampleA, sampleB, remaining };
  }

  /**
   * Evaluar la métrica de apertura o clics y declarar la variante ganadora
   */
  static async evaluateAbWinner(
    blastId: string,
    metricGoal: "OPENS" | "CLICKS" = "OPENS"
  ): Promise<AbTestMetrics> {
    const blast = await (prisma as any).emailBlast.findUnique({
      where: { id: blastId },
      include: { recipients: true }
    });

    if (!blast) throw new Error("Campaña no encontrada");

    const recipientsA = blast.recipients.filter((r: any) => r.variant === "A");
    const recipientsB = blast.recipients.filter((r: any) => r.variant === "B");

    const opensA = recipientsA.filter((r: any) => r.openedAt !== null).length;
    const opensB = recipientsB.filter((r: any) => r.openedAt !== null).length;

    const clicksA = recipientsA.filter((r: any) => r.clickedAt !== null).length;
    const clicksB = recipientsB.filter((r: any) => r.clickedAt !== null).length;

    const openRateA = recipientsA.length > 0 ? (opensA / recipientsA.length) * 100 : 0;
    const openRateB = recipientsB.length > 0 ? (opensB / recipientsB.length) * 100 : 0;

    const clickRateA = recipientsA.length > 0 ? (clicksA / recipientsA.length) * 100 : 0;
    const clickRateB = recipientsB.length > 0 ? (clicksB / recipientsB.length) * 100 : 0;

    let winner: "A" | "B" | "TIE" = "TIE";
    if (metricGoal === "OPENS") {
      if (openRateA > openRateB) winner = "A";
      else if (openRateB > openRateA) winner = "B";
    } else {
      if (clickRateA > clickRateB) winner = "A";
      else if (clickRateB > clickRateA) winner = "B";
    }

    const winningSubject = winner === "B" ? blast.subjectB || blast.subject : blast.subject;

    return {
      variantA: {
        subject: blast.subject,
        recipientsCount: recipientsA.length,
        opens: opensA,
        clicks: clicksA,
        openRate: Math.round(openRateA * 10) / 10,
        clickRate: Math.round(clickRateA * 10) / 10
      },
      variantB: {
        subject: blast.subjectB || blast.subject,
        recipientsCount: recipientsB.length,
        opens: opensB,
        clicks: clicksB,
        openRate: Math.round(openRateB * 10) / 10,
        clickRate: Math.round(clickRateB * 10) / 10
      },
      winner,
      winningSubject
    };
  }
}
