"use client";

import React, { useState } from "react";

export interface PayslipCalculatorProps {
  employeeId?: string;
  className?: string;
}

export function PayslipCalculator({ employeeId = "emp-001", className = "" }: PayslipCalculatorProps) {
  const [hoursWorked, setHoursWorked] = useState(40);
  const [ratePerHour, setRatePerHour] = useState(50);
  const [bonus, setBonus] = useState(100);
  const [loading, setLoading] = useState(false);
  const [payroll, setPayroll] = useState<{
    grossSalary: number;
    deductions: { health: number; pension: number; tax: number; totalDeductions: number };
    netSalary: number;
  } | null>(null);

  const handleCalculate = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/payroll/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId,
          hoursWorked: Number(hoursWorked),
          ratePerHour: Number(ratePerHour),
          bonus: Number(bonus)
        })
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.payroll) {
          setPayroll(json.payroll);
          return;
        }
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }

    const gross = hoursWorked * ratePerHour + bonus;
    const health = Math.round(gross * 0.04 * 100) / 100;
    const pension = Math.round(gross * 0.04 * 100) / 100;
    const taxables = Math.max(0, gross - 2000);
    const tax = Math.round(taxables * 0.10 * 100) / 100;
    const totalDeductions = Math.round((health + pension + tax) * 100) / 100;
    const net = Math.round((gross - totalDeductions) * 100) / 100;

    setPayroll({
      grossSalary: gross,
      deductions: { health, pension, tax, totalDeductions },
      netSalary: net
    });
  };

  return (
    <div className={`relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/80 p-6 backdrop-blur-xl transition-all shadow-xl ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-slate-100 text-base">Calculador de Nómina y Payslip</h3>
            <p className="text-xs text-slate-400">Cálculo de deducciones legales (Salud, Pensión, Retención)</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Horas Trabajadas</label>
          <input
            type="number"
            value={hoursWorked}
            onChange={(e) => setHoursWorked(Number(e.target.value))}
            className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white focus:border-teal-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Tarifa por Hora ($)</label>
          <input
            type="number"
            value={ratePerHour}
            onChange={(e) => setRatePerHour(Number(e.target.value))}
            className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white focus:border-teal-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Bonificaciones ($)</label>
          <input
            type="number"
            value={bonus}
            onChange={(e) => setBonus(Number(e.target.value))}
            className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white focus:border-teal-500 focus:outline-none"
          />
        </div>
      </div>

      <button
        onClick={handleCalculate}
        disabled={loading}
        className="w-full rounded-xl bg-teal-500 py-2.5 text-xs font-semibold text-slate-950 shadow-md transition-all hover:bg-teal-400 active:scale-95 disabled:opacity-50 mb-6"
      >
        {loading ? "Calculando..." : "Calcular Desprendible de Pago"}
      </button>

      {payroll && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400">Salario Bruto (Gross):</span>
            <span className="font-semibold text-slate-200">${payroll.grossSalary.toFixed(2)}</span>
          </div>

          <div className="border-t border-slate-800 pt-2 space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Deducción Salud (4%):</span>
              <span className="text-rose-400">-${payroll.deductions.health.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Deducción Pensión (4%):</span>
              <span className="text-rose-400">-${payroll.deductions.pension.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Retención Impuesto Tax:</span>
              <span className="text-rose-400">-${payroll.deductions.tax.toFixed(2)}</span>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-3 flex justify-between items-center text-sm font-bold">
            <span className="text-slate-100">Salario Neto a Recibir:</span>
            <span className="text-emerald-400 text-base">${payroll.netSalary.toFixed(2)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
