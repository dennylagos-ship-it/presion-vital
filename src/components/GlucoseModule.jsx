import React, { useRef, useState } from "react";
import {
  GLUCOSE_CATEGORIES,
  ORDERED_GLUCOSE_KEYS,
  classifyGlucose,
  validateGlucose
} from "../utils/classification.js";
import { toLocalDateTimeInputValue } from "../utils/storage.js";
import { STRINGS, getGlucoseLabel, getLocale, translateValue } from "../utils/i18n.js";

export function GlucoseForm({ onAddGlucose, lang = "es", className = "" }) {
  const t = STRINGS[lang] || STRINGS.es;
  const [value, setValue] = useState("");
  const [context, setContext] = useState("En ayunas");
  const [dateTime, setDateTime] = useState(() => toLocalDateTimeInputValue(new Date()));
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  const num = Number(value);
  const liveCat =
    value !== "" && Number.isFinite(num) && num >= 20 ? classifyGlucose(num, context) : null;

  function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const err = validateGlucose(num, dateTime, lang);
    if (err) {
      setError(err);
      return;
    }
    onAddGlucose({
      value: num,
      context,
      dateTime,
      notes: notes.trim()
    });
    setValue("");
    setNotes("");
    setDateTime(toLocalDateTimeInputValue(new Date()));
  }

  return (
    <div className={`card form-card no-print ${className}`.trim()}>
      <div className="card-header">
        <h2>{t.newGlucose}</h2>
        <span className={`badge ${liveCat ? liveCat.badgeClass : "badge-neutral"}`}>
          {liveCat ? getGlucoseLabel(liveCat.key, lang) : t.enterValue}
        </span>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div className="form-row-2">
          <div className="form-group">
            <label htmlFor="inputGlucoseVal">
              {t.glucose} <span className="unit">(mg/dL)</span>
            </label>
            <input
              type="number"
              id="inputGlucoseVal"
              min="20"
              max="600"
              placeholder="95"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="inputGlucoseContext">{t.context}</label>
            <select
              id="inputGlucoseContext"
              value={context}
              onChange={(e) => setContext(e.target.value)}
            >
              <option value="En ayunas">{t.fasting}</option>
              <option value="Postprandial">{t.postprandial}</option>
              <option value="Al azar">{t.random}</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="inputGlucoseDateTime">{t.dateTime}</label>
          <input
            type="datetime-local"
            id="inputGlucoseDateTime"
            value={dateTime}
            onChange={(e) => setDateTime(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="inputGlucoseNotes">{t.notes}</label>
          <input
            type="text"
            id="inputGlucoseNotes"
            maxLength={140}
            placeholder={t.notesPlaceholderGl}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}

        <button type="submit" className="btn btn-primary btn-block">
          {t.saveGlucose}
        </button>
      </form>
    </div>
  );
}

export function GlucoseStatsPanel({
  allReadings,
  rangedReadings,
  selectedRange,
  onRangeChange,
  lang = "es",
  className = ""
}) {
  const t = STRINGS[lang] || STRINGS.es;
  const locale = getLocale(lang);
  const latest = allReadings[0] || null;
  const latestCat = latest ? classifyGlucose(latest.value, latest.context) : null;

  const avg = (list) =>
    list.length ? Math.round(list.reduce((s, r) => s + r.value, 0) / list.length) : null;

  const avgAll = avg(rangedReadings);
  const fastingList = rangedReadings.filter((r) => r.context === "En ayunas");
  const postList = rangedReadings.filter((r) => r.context === "Postprandial");
  const avgFast = avg(fastingList);
  const avgPost = avg(postList);

  const counts = {};
  for (const k of ORDERED_GLUCOSE_KEYS) counts[k] = 0;
  for (const r of rangedReadings) {
    const cat = classifyGlucose(r.value, r.context);
    counts[cat.key] += 1;
  }

  return (
    <div className={`stats-panel ${className}`.trim()}>
      <div className="stats-toolbar no-print">
        <h2>{t.summaryGlucose}</h2>
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
          <div className="kpi-value">{latest ? `${latest.value} mg/dL` : "— mg/dL"}</div>
          <div className="kpi-sub">
            {latest && latestCat ? (
              <>
                <span className={`badge ${latestCat.badgeClass}`}>
                  {getGlucoseLabel(latestCat.key, lang)}
                </span>
                <span>• {translateValue(latest.context, lang)}</span>
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
          <div className="kpi-value">{avgAll != null ? `${avgAll} mg/dL` : "— mg/dL"}</div>
          <div className="kpi-sub">
            {rangedReadings.length > 0
              ? `${rangedReadings.length} ${t.measurements}`
              : t.noPeriodReadings}
          </div>
        </div>

        <div className="card kpi-card">
          <span className="kpi-label">{t.fasting}</span>
          <div className="kpi-value">{avgFast != null ? `${avgFast} mg/dL` : "— mg/dL"}</div>
          <div className="kpi-sub">
            {fastingList.length} {t.measurements}
          </div>
        </div>

        <div className="card kpi-card">
          <span className="kpi-label">{t.postprandial}</span>
          <div className="kpi-value">{avgPost != null ? `${avgPost} mg/dL` : "— mg/dL"}</div>
          <div className="kpi-sub">
            {postList.length} {t.measurements}
          </div>
        </div>
      </div>

      <div className="card distribution-card">
        <div className="distribution-header">
          <span className="kpi-label">{t.distADA}</span>
          <span className="kpi-sub">
            {rangedReadings.length} {rangedReadings.length === 1 ? t.record : t.records}
          </span>
        </div>

        <div className="distribution-bar">
          {ORDERED_GLUCOSE_KEYS.map((key) => {
            const count = counts[key];
            if (!count) return null;
            const pct = Math.round((count / rangedReadings.length) * 100);
            const cat = GLUCOSE_CATEGORIES[key];
            const lbl = getGlucoseLabel(key, lang);
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
            ORDERED_GLUCOSE_KEYS.map((key) => {
              const count = counts[key];
              if (!count) return null;
              const pct = Math.round((count / rangedReadings.length) * 100);
              const cat = GLUCOSE_CATEGORIES[key];
              return (
                <span key={key} className="legend-item">
                  <span className="legend-dot" style={{ background: cat.color }} />
                  <span>
                    {getGlucoseLabel(key, lang)}: <strong>{count}</strong> ({pct}%)
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

export function GlucoseTrendChart({ readings, lang = "es", className = "" }) {
  const t = STRINGS[lang] || STRINGS.es;
  const locale = getLocale(lang);
  const [tooltip, setTooltip] = useState(null);
  const wrapperRef = useRef(null);

  const width = 800;
  const height = 280;
  const pad = { top: 26, right: 24, bottom: 40, left: 48 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;

  let minVal = 60;
  let maxVal = 160;
  for (const r of readings) {
    if (r.value < minVal) minVal = Math.floor(r.value / 10) * 10;
    if (r.value > maxVal) maxVal = Math.ceil(r.value / 10) * 10;
  }
  minVal = Math.max(20, minVal - 10);
  maxVal = Math.min(600, maxVal + 15);

  const xFor = (i) =>
    readings.length <= 1 ? pad.left + plotW / 2 : pad.left + (i / (readings.length - 1)) * plotW;
  const yFor = (val) => pad.top + ((maxVal - val) / (maxVal - minVal)) * plotH;

  const step = maxVal - minVal > 140 ? 40 : 20;
  const yTicks = [];
  for (let v = Math.ceil(minVal / step) * step; v <= maxVal; v += step) yTicks.push(v);

  const labelEvery = Math.max(1, Math.ceil(readings.length / 6));
  const coords = readings.map((r, i) => ({ x: xFor(i), y: yFor(r.value) }));
  const points = coords.map((p) => `${p.x},${p.y}`).join(" ");
  const areaBottom = pad.top + plotH;
  const areaPath =
    coords.length >= 2
      ? `M ${coords[0].x},${areaBottom} ` +
        coords.map((p) => `L ${p.x},${p.y}`).join(" ") +
        ` L ${coords[coords.length - 1].x},${areaBottom} Z`
      : "";

  const y100 = yFor(100);
  const y70 = yFor(70);

  function handleHover(evt, r) {
    if (!wrapperRef.current) return;
    const rect = wrapperRef.current.getBoundingClientRect();
    const clientX = evt.touches ? evt.touches[0].clientX : evt.clientX;
    const clientY = evt.touches ? evt.touches[0].clientY : evt.clientY;
    let left = clientX - rect.left + 12;
    let top = clientY - rect.top - 16;
    if (left + 175 > rect.width) left = Math.max(8, left - 190);
    if (top < 0) top = 8;

    const cat = classifyGlucose(r.value, r.context);
    const dt = new Date(r.dateTime).toLocaleString(locale, {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit"
    });
    setTooltip({ left, top, dt, r, catLabel: getGlucoseLabel(cat.key, lang) });
  }

  return (
    <section className={`card chart-card ${className}`.trim()}>
      <div className="card-header">
        <div>
          <h2>{t.trendGlTitle}</h2>
          <p className="card-subtitle">{t.trendGlSub}</p>
        </div>
      </div>

      <div className="chart-wrapper" ref={wrapperRef}>
        {readings.length < 2 ? (
          <div className="empty-state">{t.emptyChartGl}</div>
        ) : (
          <svg
            className="bp-chart"
            viewBox={`0 0 ${width} ${height}`}
            preserveAspectRatio="xMidYMid meet"
            role="img"
            aria-label={t.trendGlTitle}
          >
            <defs>
              <linearGradient id="glucoseAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366f1" stopOpacity="0.22" />
                <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            <rect
              x={pad.left}
              y={Math.min(y100, y70)}
              width={plotW}
              height={Math.abs(y70 - y100)}
              fill="#22c55e"
              opacity="0.11"
            />

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

            {[70, 100, 140].map((val) =>
              val >= minVal && val <= maxVal ? (
                <line
                  key={val}
                  x1={pad.left}
                  y1={yFor(val)}
                  x2={pad.left + plotW}
                  y2={yFor(val)}
                  stroke={val === 140 ? "#ca8a04" : "#16a34a"}
                  strokeWidth="1"
                  strokeDasharray="4 4"
                  opacity="0.65"
                />
              ) : null
            )}

            {readings.map((r, i) => {
              if (i % labelEvery !== 0 && i !== readings.length - 1) return null;
              const label = new Date(r.dateTime).toLocaleDateString(locale, {
                day: "2-digit",
                month: "2-digit"
              });
              return (
                <text
                  key={r.id}
                  x={xFor(i)}
                  y={height - 12}
                  textAnchor="middle"
                  fontSize="11"
                  fill="var(--text-muted)"
                >
                  {label}
                </text>
              );
            })}

            {areaPath && <path d={areaPath} fill="url(#glucoseAreaGrad)" />}
            <polyline
              fill="none"
              stroke="#6366f1"
              strokeWidth="2.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={points}
            />

            {readings.map((r, i) => {
              const cx = xFor(i);
              const cy = yFor(r.value);
              const cat = classifyGlucose(r.value, r.context);
              return (
                <g key={r.id}>
                  <circle
                    cx={cx}
                    cy={cy}
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
            {t.glucose}: <b>{tooltip.r.value}</b> mg/dL
            <br />
            {t.context}: <b>{translateValue(tooltip.r.context, lang)}</b>
            <br />
            {lang === "en" ? "Status" : "Estado"}: <b>{tooltip.catLabel}</b>
          </div>
        )}
      </div>
    </section>
  );
}

export function GlucoseTable({ readings, onEdit, onDelete, lang = "es", className = "" }) {
  const t = STRINGS[lang] || STRINGS.es;
  const locale = getLocale(lang);
  const [contextFilter, setContextFilter] = useState("all");
  const [search, setSearch] = useState("");

  const query = search.trim().toLowerCase();
  const filtered = readings.filter((r) => {
    if (contextFilter !== "all" && r.context !== contextFilter) return false;
    if (query && !(r.notes || "").toLowerCase().includes(query)) return false;
    return true;
  });

  const subtitle = t.showingOf
    .replace("{n}", String(filtered.length))
    .replace("{total}", String(readings.length));

  return (
    <section className={`card history-card ${className}`.trim()}>
      <div className="card-header history-header">
        <div>
          <h2>{t.historyGlTitle}</h2>
          <p className="card-subtitle">{subtitle}</p>
        </div>
        <div className="history-filters no-print">
          <select
            className="select-sm"
            aria-label={t.allContexts}
            value={contextFilter}
            onChange={(e) => setContextFilter(e.target.value)}
          >
            <option value="all">{t.allContexts}</option>
            <option value="En ayunas">{t.fasting}</option>
            <option value="Postprandial">{t.postprandial}</option>
            <option value="Al azar">{t.random}</option>
          </select>
          <input
            type="search"
            className="input-sm"
            placeholder={t.searchNotes}
            aria-label={t.searchNotes}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="table-responsive">
        <table className="readings-table">
          <thead>
            <tr>
              <th>{t.dateTime}</th>
              <th>{t.glucose}</th>
              <th>{t.context}</th>
              <th>{t.colClass}</th>
              <th>{t.colNotes}</th>
              <th className="no-print">{t.colActions}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="table-empty">
                  {t.noMatchingGl}
                </td>
              </tr>
            ) : (
              filtered.map((r) => {
                const cat = classifyGlucose(r.value, r.context);
                const dt = new Date(r.dateTime).toLocaleString(locale, {
                  year: "numeric",
                  month: "short",
                  day: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit"
                });
                return (
                  <tr key={r.id}>
                    <td>{dt}</td>
                    <td className="bp-reading-cell">
                      {r.value} <span className="unit">mg/dL</span>
                    </td>
                    <td>{translateValue(r.context, lang)}</td>
                    <td>
                      <span className={`badge ${cat.badgeClass}`}>
                        {getGlucoseLabel(cat.key, lang)}
                      </span>
                    </td>
                    <td>{r.notes ? r.notes : <span className="unit">—</span>}</td>
                    <td className="no-print">
                      <div className="row-actions">
                        <button
                          type="button"
                          className="btn btn-icon-text"
                          onClick={() => onEdit(r)}
                        >
                          {t.edit}
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger-text"
                          onClick={() => onDelete(r.id)}
                        >
                          {t.del}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="mobile-readings-list">
        {filtered.length === 0 ? (
          <div className="empty-state">{t.noMatchingGl}</div>
        ) : (
          filtered.map((r) => {
            const cat = classifyGlucose(r.value, r.context);
            const dt = new Date(r.dateTime).toLocaleString(locale, {
              day: "2-digit",
              month: "short",
              hour: "2-digit",
              minute: "2-digit"
            });
            return (
              <article key={r.id} className="mobile-reading-card">
                <div className="mobile-reading-top">
                  <div className="mobile-reading-bp">
                    {r.value} <span className="unit">mg/dL</span>
                  </div>
                  <span className={`badge ${cat.badgeClass}`}>
                    {getGlucoseLabel(cat.key, lang)}
                  </span>
                </div>
                <div className="mobile-reading-meta">
                  <span>{dt}</span>
                  <span>• {translateValue(r.context, lang)}</span>
                </div>
                {r.notes && (
                  <div className="mobile-reading-meta">
                    {t.notes}: {r.notes}
                  </div>
                )}
                <div className="mobile-reading-actions no-print">
                  <button type="button" className="btn btn-icon-text" onClick={() => onEdit(r)}>
                    {t.edit}
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger-text"
                    onClick={() => onDelete(r.id)}
                  >
                    {t.del}
                  </button>
                </div>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}

export function EditGlucoseModal({ reading, onSave, onClose, lang = "es" }) {
  const t = STRINGS[lang] || STRINGS.es;
  const [value, setValue] = useState(String(reading.value));
  const [context, setContext] = useState(reading.context);
  const [dateTime, setDateTime] = useState(reading.dateTime);
  const [notes, setNotes] = useState(reading.notes || "");
  const [error, setError] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const num = Number(value);
    const err = validateGlucose(num, dateTime, lang);
    if (err) {
      setError(err);
      return;
    }
    onSave({ ...reading, value: num, context, dateTime, notes: notes.trim() });
  }

  return (
    <div
      className="modal-backdrop no-print"
      role="dialog"
      aria-modal="true"
      aria-labelledby="editGlucoseTitle"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal">
        <div className="modal-header">
          <h3 id="editGlucoseTitle">{t.editGlucoseTitle}</h3>
          <button type="button" className="btn-close" onClick={onClose} aria-label="Close">
            &times;
          </button>
        </div>
        <div className="modal-body">
          <form onSubmit={handleSubmit}>
            <div className="form-row-2">
              <div className="form-group">
                <label htmlFor="editGlVal">{t.glucose} (mg/dL)</label>
                <input
                  type="number"
                  id="editGlVal"
                  min="20"
                  max="600"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="editGlCtx">{t.context}</label>
                <select
                  id="editGlCtx"
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                >
                  <option value="En ayunas">{t.fasting}</option>
                  <option value="Postprandial">{t.postprandial}</option>
                  <option value="Al azar">{t.random}</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="editGlDt">{t.dateTime}</label>
              <input
                type="datetime-local"
                id="editGlDt"
                value={dateTime}
                onChange={(e) => setDateTime(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="editGlNotes">{t.notes}</label>
              <input
                type="text"
                id="editGlNotes"
                maxLength={140}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
            {error && <p className="form-error">{error}</p>}
            <div className="modal-footer-actions">
              <button type="button" className="btn btn-outline" onClick={onClose}>
                {t.cancel}
              </button>
              <button type="submit" className="btn btn-primary">
                {t.saveChanges}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export function GlucoseGuideCard({ lang = "es", className = "" }) {
  const t = STRINGS[lang] || STRINGS.es;
  const isEn = lang === "en";
  return (
    <section className={`card guide-card ${className}`.trim()}>
      <h2>{t.guideGlTitle}</h2>
      <div className="guide-grid">
        <div className="guide-item border-hypotension">
          <strong>{getGlucoseLabel("low", lang)}</strong>
          <span>{isEn ? "< 70 mg/dL (severe < 54)" : "< 70 mg/dL (severa < 54)"}</span>
        </div>
        <div className="guide-item border-normal">
          <strong>{isEn ? "Normal (Fasting)" : "Normal (Ayunas)"}</strong>
          <span>70 – 99 mg/dL</span>
        </div>
        <div className="guide-item border-normal">
          <strong>{isEn ? "Normal (Post-meal 2h)" : "Normal (Postprandial 2h)"}</strong>
          <span>70 – 139 mg/dL</span>
        </div>
        <div className="guide-item border-elevated">
          <strong>{getGlucoseLabel("elevated", lang)}</strong>
          <span>{isEn ? "Fasting 100–125 · Post 140–199" : "Ayunas 100–125 · Post 140–199"}</span>
        </div>
        <div className="guide-item border-stage2">
          <strong>{getGlucoseLabel("high", lang)}</strong>
          <span>{isEn ? "Fasting ≥ 126 · Post ≥ 200" : "Ayunas ≥ 126 · Post ≥ 200"}</span>
        </div>
        <div className="guide-item border-crisis">
          <strong>{getGlucoseLabel("severeHigh", lang)}</strong>
          <span>&ge; 250 mg/dL</span>
        </div>
      </div>
      <p className="disclaimer">
        {t.disclaimer}{" "}
        <a href="/privacy.html" target="_blank" rel="noopener noreferrer">
          {t.privacyLink}
        </a>
      </p>
    </section>
  );
}
