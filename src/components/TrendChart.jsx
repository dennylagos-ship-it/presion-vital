import React, { useRef, useState } from "react";
import { classifyBloodPressure } from "../utils/classification.js";
import { STRINGS, getBPLabel, getLocale } from "../utils/i18n.js";

export default function TrendChart({ readings, lang = "es", className = "" }) {
  const t = STRINGS[lang] || STRINGS.es;
  const locale = getLocale(lang);
  const pulseUnit = lang === "en" ? "bpm" : "lpm";
  const [showPulse, setShowPulse] = useState(true);
  const [tooltip, setTooltip] = useState(null);
  const wrapperRef = useRef(null);

  const width = 800;
  const height = 300;
  const pad = { top: 28, right: 24, bottom: 42, left: 46 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;

  let minVal = 50;
  let maxVal = 170;
  for (const r of readings) {
    if (r.diastolic < minVal) minVal = Math.floor(r.diastolic / 10) * 10;
    if (r.systolic > maxVal) maxVal = Math.ceil(r.systolic / 10) * 10;
    if (showPulse && r.pulse != null) {
      if (r.pulse < minVal) minVal = Math.floor(r.pulse / 10) * 10;
      if (r.pulse > maxVal) maxVal = Math.ceil(r.pulse / 10) * 10;
    }
  }
  minVal = Math.max(30, minVal - 10);
  maxVal = Math.min(280, maxVal + 10);

  const xFor = (i) =>
    readings.length <= 1 ? pad.left + plotW / 2 : pad.left + (i / (readings.length - 1)) * plotW;

  const yFor = (val) => pad.top + ((maxVal - val) / (maxVal - minVal)) * plotH;

  const step = maxVal - minVal > 120 ? 30 : 20;
  const yTicks = [];
  for (let v = Math.ceil(minVal / step) * step; v <= maxVal; v += step) {
    yTicks.push(v);
  }

  const labelEvery = Math.max(1, Math.ceil(readings.length / 6));
  const sysCoords = readings.map((r, i) => ({ x: xFor(i), y: yFor(r.systolic) }));
  const sysPoints = sysCoords.map((p) => `${p.x},${p.y}`).join(" ");
  const diaPoints = readings.map((r, i) => `${xFor(i)},${yFor(r.diastolic)}`).join(" ");
  const pulsePoints = showPulse
    ? readings
        .map((r, i) => (r.pulse != null ? `${xFor(i)},${yFor(r.pulse)}` : null))
        .filter(Boolean)
    : [];

  const areaBottom = pad.top + plotH;
  const sysAreaPath =
    sysCoords.length >= 2
      ? `M ${sysCoords[0].x},${areaBottom} ` +
        sysCoords.map((p) => `L ${p.x},${p.y}`).join(" ") +
        ` L ${sysCoords[sysCoords.length - 1].x},${areaBottom} Z`
      : "";

  const y120 = yFor(120);
  const y80 = yFor(80);

  function handleHover(evt, r) {
    if (!wrapperRef.current) return;
    const rect = wrapperRef.current.getBoundingClientRect();
    const clientX = evt.touches ? evt.touches[0].clientX : evt.clientX;
    const clientY = evt.touches ? evt.touches[0].clientY : evt.clientY;
    let left = clientX - rect.left + 12;
    let top = clientY - rect.top - 16;
    if (left + 175 > rect.width) left = Math.max(8, left - 190);
    if (top < 0) top = 8;

    const cat = classifyBloodPressure(r.systolic, r.diastolic);
    const dt = new Date(r.dateTime).toLocaleString(locale, {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit"
    });

    setTooltip({ left, top, dt, r, catLabel: getBPLabel(cat.key, lang) });
  }

  return (
    <section className={`card chart-card ${className}`.trim()}>
      <div className="card-header">
        <div>
          <h2>{t.trendBPTitle}</h2>
          <p className="card-subtitle">{t.trendBPSub}</p>
        </div>
        <div className="chart-controls no-print">
          <label className="checkbox-inline">
            <input
              type="checkbox"
              checked={showPulse}
              onChange={(e) => setShowPulse(e.target.checked)}
            />
            <span>{t.showPulse}</span>
          </label>
        </div>
      </div>

      <div className="chart-wrapper" ref={wrapperRef}>
        {readings.length < 2 ? (
          <div className="empty-state">{t.emptyChartBP}</div>
        ) : (
          <svg
            className="bp-chart"
            viewBox={`0 0 ${width} ${height}`}
            preserveAspectRatio="xMidYMid meet"
            role="img"
            aria-label="Gráfico de tendencia de presión arterial"
          >
            <defs>
              <linearGradient id="sysAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0d9488" stopOpacity="0.20" />
                <stop offset="100%" stopColor="#0d9488" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Banda de referencia normal */}
            <rect
              x={pad.left}
              y={Math.min(y120, y80)}
              width={plotW}
              height={Math.abs(y80 - y120)}
              fill="#22c55e"
              opacity="0.10"
            />

            {/* Grilla horizontal */}
            {yTicks.map((v) => {
              const y = yFor(v);
              return (
                <g key={v}>
                  <line
                    x1={pad.left}
                    y1={y}
                    x2={pad.left + plotW}
                    y2={y}
                    stroke="var(--border)"
                    strokeWidth="1"
                  />
                  <text
                    x={pad.left - 8}
                    y={y + 4}
                    textAnchor="end"
                    fontSize="11"
                    fill="var(--text-muted)"
                  >
                    {v}
                  </text>
                </g>
              );
            })}

            {/* Líneas guía 120 / 80 */}
            {[120, 80].map((val) =>
              val >= minVal && val <= maxVal ? (
                <line
                  key={val}
                  x1={pad.left}
                  y1={yFor(val)}
                  x2={pad.left + plotW}
                  y2={yFor(val)}
                  stroke="#16a34a"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                  opacity="0.65"
                />
              ) : null
            )}

            {/* Etiquetas eje X */}
            {readings.map((r, i) => {
              if (i % labelEvery !== 0 && i !== readings.length - 1) return null;
              const d = new Date(r.dateTime);
              const label = d.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit" });
              return (
                <text
                  key={r.id}
                  x={xFor(i)}
                  y={height - 14}
                  textAnchor="middle"
                  fontSize="11"
                  fill="var(--text-muted)"
                >
                  {label}
                </text>
              );
            })}

            {/* Área bajo sistólica */}
            {sysAreaPath && <path d={sysAreaPath} fill="url(#sysAreaGrad)" />}

            {/* Polilíneas */}
            {showPulse && pulsePoints.length >= 2 && (
              <polyline
                fill="none"
                stroke="#f59e0b"
                strokeWidth="2"
                strokeDasharray="5 4"
                points={pulsePoints.join(" ")}
              />
            )}
            <polyline
              fill="none"
              stroke="#0d9488"
              strokeWidth="2.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={sysPoints}
            />
            <polyline
              fill="none"
              stroke="#6366f1"
              strokeWidth="2.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={diaPoints}
            />

            {/* Leyenda superior derecha */}
            <g>
              <circle cx={width - 250} cy={12} r={4} fill="#0d9488" />
              <text x={width - 242} y={16} fontSize="11" fontWeight="600" fill="var(--text)">
                {t.systolic}
              </text>
              <circle cx={width - 165} cy={12} r={4} fill="#6366f1" />
              <text x={width - 157} y={16} fontSize="11" fontWeight="600" fill="var(--text)">
                {t.diastolic}
              </text>
              {showPulse && (
                <>
                  <circle cx={width - 75} cy={12} r={4} fill="#f59e0b" />
                  <text x={width - 67} y={16} fontSize="11" fontWeight="600" fill="var(--text)">
                    {t.pulse}
                  </text>
                </>
              )}
            </g>

            {/* Puntos e interacción */}
            {readings.map((r, i) => {
              const cx = xFor(i);
              const ySys = yFor(r.systolic);
              const yDia = yFor(r.diastolic);
              const cat = classifyBloodPressure(r.systolic, r.diastolic);
              return (
                <g key={r.id}>
                  <line x1={cx} y1={ySys} x2={cx} y2={yDia} stroke="var(--border)" strokeWidth="1.2" />
                  {showPulse && r.pulse != null && (
                    <circle
                      cx={cx}
                      cy={yFor(r.pulse)}
                      r={3.5}
                      fill="#f59e0b"
                      stroke="var(--surface)"
                      strokeWidth="1.4"
                    />
                  )}
                  <circle
                    cx={cx}
                    cy={yDia}
                    r={4.5}
                    fill="#6366f1"
                    stroke="var(--surface)"
                    strokeWidth="1.6"
                  />
                  <circle
                    cx={cx}
                    cy={ySys}
                    r={5.2}
                    fill={cat.color}
                    stroke="var(--surface)"
                    strokeWidth="1.6"
                  />
                  <rect
                    x={cx - 14}
                    y={pad.top}
                    width={28}
                    height={plotH}
                    fill="transparent"
                    style={{ cursor: "pointer" }}
                    onMouseEnter={(e) => handleHover(e, r)}
                    onMouseMove={(e) => handleHover(e, r)}
                    onMouseLeave={() => setTooltip(null)}
                    onTouchStart={(e) => handleHover(e, r)}
                  />
                </g>
              );
            })}
          </svg>
        )}

        {tooltip && (
          <div className="chart-tooltip" style={{ left: tooltip.left, top: tooltip.top }}>
            <strong>{tooltip.dt}</strong>
            <br />
            {lang === "en" ? "BP" : "Presión"}: <b>{tooltip.r.systolic}/{tooltip.r.diastolic}</b> mmHg
            <br />
            {tooltip.r.pulse != null && (
              <>
                {t.pulse}: <b>{tooltip.r.pulse}</b> {pulseUnit}
                <br />
              </>
            )}
            {lang === "en" ? "Status" : "Estado"}: <b>{tooltip.catLabel}</b>
          </div>
        )}
      </div>
    </section>
  );
}
