import React from "react";
import { CATEGORIES, ORDERED_CATEGORY_KEYS, classifyBloodPressure } from "../utils/classification.js";
import { STRINGS, getBPLabel, getLocale } from "../utils/i18n.js";

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

export default function StatsPanel({
  allReadings,
  rangedReadings,
  selectedRange,
  onRangeChange,
  lang = "es",
  className = ""
}) {
  const t = STRINGS[lang] || STRINGS.es;
  const locale = getLocale(lang);
  const pulseUnit = lang === "en" ? "bpm" : "lpm";

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
        <h2>{t.summaryTitle}</h2>
        <div className="range-pills" role="group">
          {["7", "30", "90", "all"].map((key) => (
            <button
              key={key}
              type="button"
              className={`pill ${selectedRange === key ? "active" : ""}`}
              onClick={() => onRangeChange(key)}
            >
              {t.ranges[key]}
            </button>
          ))}
        </div>
      </div>

      <div className="kpi-grid">
        <div className="card kpi-card kpi-hero">
          <span className="kpi-label">{t.latestReading}</span>
          <div className="kpi-value">
            {latest ? `${latest.systolic} / ${latest.diastolic} mmHg` : "— / —"}
          </div>
          <div className="kpi-sub">
            {latest && latestCat ? (
              <>
                <span className={`badge ${latestCat.badgeClass}`}>
                  {getBPLabel(latestCat.key, lang)}
                </span>
                {latest.pulse != null && (
                  <span>
                    • {latest.pulse} {pulseUnit}
                  </span>
                )}
                <span>
                  •{" "}
                  {new Date(latest.dateTime).toLocaleString(locale, {
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit"
                  })}
                </span>
              </>
            ) : (
              t.noReadingsYet
            )}
          </div>
        </div>

        <div className="card kpi-card">
          <span className="kpi-label">{t.periodAvg}</span>
          <div className="kpi-value">
            {avgAll ? `${avgAll.sys} / ${avgAll.dia} mmHg` : "— / —"}
          </div>
          <div className="kpi-sub">
            {avgAll && avgCat ? (
              <>
                <span className={`badge ${avgCat.badgeClass}`}>
                  {getBPLabel(avgCat.key, lang)}
                </span>
                {avgAll.pulse != null && (
                  <span>
                    • {t.avgPulse}: {avgAll.pulse} {pulseUnit}
                  </span>
                )}
                <span>
                  • {avgAll.count} {t.measurements}
                </span>
              </>
            ) : (
              t.noPeriodReadings
            )}
          </div>
        </div>

        <div className="card kpi-card">
          <span className="kpi-label">{t.morning}</span>
          <div className="kpi-value">
            {avgMorn ? `${avgMorn.sys} / ${avgMorn.dia} mmHg` : "— / —"}
          </div>
          <div className="kpi-sub">
            {avgMorn
              ? `${avgMorn.count} ${t.measurements}${
                  avgMorn.pulse != null ? ` • ${t.pulse} ${avgMorn.pulse} ${pulseUnit}` : ""
                }`
              : `0 ${t.measurements}`}
          </div>
        </div>

        <div className="card kpi-card">
          <span className="kpi-label">{t.evening}</span>
          <div className="kpi-value">
            {avgEve ? `${avgEve.sys} / ${avgEve.dia} mmHg` : "— / —"}
          </div>
          <div className="kpi-sub">
            {avgEve
              ? `${avgEve.count} ${t.measurements}${
                  avgEve.pulse != null ? ` • ${t.pulse} ${avgEve.pulse} ${pulseUnit}` : ""
                }`
              : `0 ${t.measurements}`}
          </div>
        </div>
      </div>

      <div className="card distribution-card">
        <div className="distribution-header">
          <span className="kpi-label">{t.distAHA}</span>
          <span className="kpi-sub">
            {rangedReadings.length} {rangedReadings.length === 1 ? t.record : t.records}
          </span>
        </div>

        <div className="distribution-bar">
          {ORDERED_CATEGORY_KEYS.map((key) => {
            const count = counts[key];
            if (!count) return null;
            const pct = Math.round((count / rangedReadings.length) * 100);
            const cat = CATEGORIES[key];
            const lbl = getBPLabel(key, lang);
            return (
              <div
                key={key}
                className="dist-segment"
                style={{
                  width: `${((count / rangedReadings.length) * 100).toFixed(2)}%`,
                  backgroundColor: cat.color
                }}
                title={`${lbl}: ${count} (${pct}%)`}
              />
            );
          })}
        </div>

        <div className="distribution-legend">
          {rangedReadings.length === 0 ? (
            <span>{t.emptyDist}</span>
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
                    {getBPLabel(key, lang)}: <strong>{count}</strong> ({pct}%)
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
