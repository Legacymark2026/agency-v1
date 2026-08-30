/**
 * AI Real-Time Fraud & Financial Anomaly Detector
 * Fix A-8: real statistical z-score calculated from the company's actual transaction history.
 * The z-score is no longer a hardcoded constant — it's derived from the mean and standard
 * deviation of the last 90 days of expenses for that specific company.
 */
import { prisma } from "@agency/database";

export interface FraudAnalysisResult {
  isAnomalous: boolean;
  riskScore: number; // 0 to 100
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  riskReason?: string;
  zScore: number;
  mean: number;
  stdDev: number;
}

/** Standard deviation population formula */
function calculateStdDev(values: number[], mean: number): number {
  if (values.length < 2) return 0;
  const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
  return Math.sqrt(variance);
}

/** Map z-score to risk level and score */
function mapZScoreToRisk(zScore: number): { riskScore: number; riskLevel: FraudAnalysisResult["riskLevel"] } {
  if (zScore >= 4.0) return { riskScore: 95, riskLevel: "CRITICAL" };
  if (zScore >= 3.0) return { riskScore: 80, riskLevel: "HIGH" };
  if (zScore >= 2.0) return { riskScore: 55, riskLevel: "MEDIUM" };
  return { riskScore: Math.round(zScore * 10), riskLevel: "LOW" };
}

export async function analyzeTransactionFraud(
  companyId: string,
  amount: number,
  vendorNit?: string
): Promise<FraudAnalysisResult> {
  try {
    const since90Days = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

    // Fetch historical expense amounts for statistical baseline
    const historicalExpenses = await prisma.expense.findMany({
      where: { companyId, createdAt: { gte: since90Days } },
      select: { amount: true, createdAt: true },
    });

    const values = historicalExpenses.map((e) => Number(e.amount));

    // Detect exact duplicate in last 7 days
    if (vendorNit) {
      const since7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const recentDuplicates = await prisma.expense.findMany({
        where: {
          companyId,
          amount: { gte: amount * 0.99, lte: amount * 1.01 }, // within 1% tolerance
          createdAt: { gte: since7Days },
        },
        select: { id: true },
      });

      if (recentDuplicates.length > 0) {
        const mean = values.length > 0 ? values.reduce((s, v) => s + v, 0) / values.length : amount;
        const stdDev = calculateStdDev(values, mean);
        const zScore = stdDev > 0 ? Math.abs(amount - mean) / stdDev : 0;

        return {
          isAnomalous: true,
          riskScore: 88,
          riskLevel: "HIGH",
          riskReason: `Posible transacción duplicada: monto $${amount.toLocaleString("es-CO")} ya registrado en los últimos 7 días (${recentDuplicates.length} coincidencia(s)).`,
          zScore: Math.round(zScore * 100) / 100,
          mean: Math.round(mean),
          stdDev: Math.round(stdDev),
        };
      }
    }

    // Statistical anomaly detection
    if (values.length >= 5) {
      const mean = values.reduce((s, v) => s + v, 0) / values.length;
      const stdDev = calculateStdDev(values, mean);
      const zScore = stdDev > 0 ? Math.abs(amount - mean) / stdDev : 0;
      const { riskScore, riskLevel } = mapZScoreToRisk(zScore);

      const isAnomalous = zScore >= 2.0;
      const riskReason = isAnomalous
        ? `Monto $${amount.toLocaleString("es-CO")} es ${zScore.toFixed(1)} desviaciones estándar por encima del promedio histórico ($${Math.round(mean).toLocaleString("es-CO")} ± $${Math.round(stdDev).toLocaleString("es-CO")}) para esta empresa.`
        : undefined;

      return {
        isAnomalous,
        riskScore,
        riskLevel,
        riskReason,
        zScore: Math.round(zScore * 100) / 100,
        mean: Math.round(mean),
        stdDev: Math.round(stdDev),
      };
    }

    // Insufficient history: use absolute threshold as fallback, but flag it clearly
    const ABSOLUTE_THRESHOLD = Number(process.env.FRAUD_HIGH_VALUE_THRESHOLD || "50000000"); // 50M COP default
    if (amount > ABSOLUTE_THRESHOLD) {
      return {
        isAnomalous: true,
        riskScore: 70,
        riskLevel: "HIGH",
        riskReason: `Monto $${amount.toLocaleString("es-CO")} supera el umbral absoluto de $${ABSOLUTE_THRESHOLD.toLocaleString("es-CO")} COP. Historial insuficiente para análisis estadístico.`,
        zScore: 0,
        mean: 0,
        stdDev: 0,
      };
    }

    return {
      isAnomalous: false,
      riskScore: 5,
      riskLevel: "LOW",
      zScore: 0,
      mean: 0,
      stdDev: 0,
    };
  } catch (err) {
    console.error("[FraudDetector] Error during fraud analysis:", err);
    return {
      isAnomalous: false,
      riskScore: 0,
      riskLevel: "LOW",
      zScore: 0,
      mean: 0,
      stdDev: 0,
    };
  }
}
