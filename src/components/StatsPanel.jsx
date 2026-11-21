import React from "react";
import { CATEGORIES, ORDERED_CATEGORY_KEYS, classifyBloodPressure } from "../utils/classification.js";

function computeAverage(list) {
  if (!list.length) return null;
  let sumSys = 0;
  let sumDia = 0;
  let sumPulse = 0;
  let pulseCount = 0;
  for (const r of list) {
    sumSys += r.systolic;
    sumDia += r.diastolic;
    if (r.pulse != null) {
      sumPulse += r.pulse;
      pulseCount += 1;
    }
  }
  return {
    sys: Math.round(sumSys / list.length),
    dia: Math.round(sumDia / list.length),
    pulse: pulseCount > 0 ? Math.round(sumPulse / pulseCount) : null,
    count: list.length
  };
}

const RANGES = [
  { key: "7", label: "7 días" },
  { key: "30", label: "30 días" },
  { key: "90", label: "90 días" },
  { key: "all", label: "Todo" }
];

export default function StatsPanel({
  allReadings,
  rangedReadings,
  selectedRange,
  onRangeChange,
  className = ""
}) {
  const latest = allReadings[0] || null;
  const latestCat = latest ? classifyBloodPressure(latest.systolic, latest.diastolic) : null;

  const avgAll = computeAverage(rangedReadings);
  const avgCat = avgAll ? classifyBloodPressure(avgAll.sys, avgAll.dia) : null;

  const morningList = rangedReadings.filter((r) => {
    const h = new Date(r.dateTime).getHours();
    return h >= 5 && h < 12;
  });
  const eveningList = rangedReadings.filter((r) => {
    const h = new Date(r.dateTime).getHours();
    return h < 5 || h >= 12;
  });

  const avgMorn = computeAverage(morningList);
  const avgEve = computeAverage(eveningList);

  const counts = {};
  for (const k of ORDERED_CATEGORY_KEYS) counts[k] = 0;
  for (const r of rangedReadings) {
    const cat = classifyBloodPressure(r.systolic, r.diastolic);
    counts[cat.key] += 1;
  }

  return (
    <div className={`stats-panel ${className}`.trim()}>
      <div className="stats-toolbar no-print">
        <h2>Resumen y Promedios</h2>
        <div className="range-pills" role="group" aria-label="Rango de fechas">
          {RANGES.map((r) => (
            <button
              key={r.key}
              type="button"
              className={`pill ${selectedRange === r.key ? "active" : ""}`}
              onClick={() => onRangeChange(r.key)}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="kpi-grid">
        <div className="card kpi-card kpi-hero">
          <span className="kpi-label">Última Medición</span>
          <div className="kpi-value">
            {latest ? `${latest.systolic} / ${latest.diastolic} mmHg` : "— / —"}
          </div>
          <div className="kpi-sub">
            {latest && latestCat ? (
              <>
                <span className={`badge ${latestCat.badgeClass}`}>{latestCat.label}</span>
                {latest.pulse != null && <span>• {latest.pulse} lpm</span>}
                <span>
                  •{" "}
                  {new Date(latest.dateTime).toLocaleString("es-ES", {
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit"
                  })}
                </span>
              </>
            ) : (
              "Sin registros aún"
            )}
          </div>
        </div>

        <div className="card kpi-card">
          <span className="kpi-label">Promedio del Período</span>
          <div className="kpi-value">
            {avgAll ? `${avgAll.sys} / ${avgAll.dia} mmHg` : "— / —"}
          </div>
          <div className="kpi-sub">
            {avgAll && avgCat ? (
              <>
                <span className={`badge ${avgCat.badgeClass}`}>{avgCat.label}</span>
                {avgAll.pulse != null && <span>• Pulso prom: {avgAll.pulse} lpm</span>}
                <span>• {avgAll.count} med.</span>
              </>
            ) : (
              "0 mediciones en el período"
            )}
          </div>
        </div>

        <div className="card kpi-card">
          <span className="kpi-label">Mañana (05:00–11:59)</span>
          <div className="kpi-value">
            {avgMorn ? `${avgMorn.sys} / ${avgMorn.dia} mmHg` : "— / —"}
          </div>
          <div className="kpi-sub">
            {avgMorn
              ? `${avgMorn.count} med.${avgMorn.pulse != null ? ` • Pulso ${avgMorn.pulse} lpm` : ""}`
              : "0 mediciones"}
          </div>
        </div>

        <div className="card kpi-card">
          <span className="kpi-label">Tarde/Noche (12:00–04:59)</span>
          <div className="kpi-value">
            {avgEve ? `${avgEve.sys} / ${avgEve.dia} mmHg` : "— / —"}
          </div>
          <div className="kpi-sub">
            {avgEve
              ? `${avgEve.count} med.${avgEve.pulse != null ? ` • Pulso ${avgEve.pulse} lpm` : ""}`
              : "0 mediciones"}
          </div>
        </div>
      </div>

      <div className="card distribution-card">
        <div className="distribution-header">
          <span className="kpi-label">Distribución según guías AHA / OMS</span>
          <span className="kpi-sub">
            {rangedReadings.length} {rangedReadings.length === 1 ? "registro" : "registros"}
          </span>
        </div>

        <div className="distribution-bar" aria-label="Distribución de categorías">
          {ORDERED_CATEGORY_KEYS.map((key) => {
            const count = counts[key];
            if (!count) return null;
            const pct = Math.round((count / rangedReadings.length) * 100);
            const cat = CATEGORIES[key];
            return (
              <div
                key={key}
                className="dist-segment"
                style={{
                  width: `${((count / rangedReadings.length) * 100).toFixed(2)}%`,
                  backgroundColor: cat.color
                }}
                title={`${cat.label}: ${count} (${pct}%)`}
              />
            );
          })}
        </div>

        <div className="distribution-legend">
          {rangedReadings.length === 0 ? (
            <span>Registra mediciones para ver la distribución por categoría.</span>
          ) : (
            ORDERED_CATEGORY_KEYS.map((key) => {
              const count = counts[key];
              if (!count) return null;
              const pct = Math.round((count / rangedReadings.length) * 100);
              const cat = CATEGORIES[key];
              return (
                <span key={key} className="legend-item">
                  <span className="legend-dot" style={{ background: cat.color }} />
                  <span>
                    {cat.label}: <strong>{count}</strong> ({pct}%)
                  </span>
                </span>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
