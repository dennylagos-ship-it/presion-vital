import React, { useState } from "react";
import { classifyBloodPressure } from "../utils/classification.js";
import { STRINGS, getBPLabel, getLocale, translateValue } from "../utils/i18n.js";

export default function ReadingsTable({ readings, onEdit, onDelete, lang = "es", className = "" }) {
  const t = STRINGS[lang] || STRINGS.es;
  const locale = getLocale(lang);
  const pulseUnit = lang === "en" ? "bpm" : "lpm";

  const [catFilter, setCatFilter] = useState("all");
  const [search, setSearch] = useState("");

  const query = search.trim().toLowerCase();
  const filtered = readings.filter((r) => {
    const cat = classifyBloodPressure(r.systolic, r.diastolic);
    if (catFilter !== "all" && cat.key !== catFilter) return false;
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
          <h2>{t.historyBPTitle}</h2>
          <p className="card-subtitle">{subtitle}</p>
        </div>
        <div className="history-filters no-print">
          <select
            className="select-sm"
            aria-label={t.allCategories}
            value={catFilter}
            onChange={(e) => setCatFilter(e.target.value)}
          >
            <option value="all">{t.allCategories}</option>
            <option value="hypotension">{getBPLabel("hypotension", lang)}</option>
            <option value="normal">{getBPLabel("normal", lang)}</option>
            <option value="elevated">{getBPLabel("elevated", lang)}</option>
            <option value="stage1">{getBPLabel("stage1", lang)}</option>
            <option value="stage2">{getBPLabel("stage2", lang)}</option>
            <option value="crisis">{getBPLabel("crisis", lang)}</option>
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

      {/* Vista Desktop: Tabla */}
      <div className="table-responsive">
        <table className="readings-table">
          <thead>
            <tr>
              <th>{t.dateTime}</th>
              <th>{t.colBp}</th>
              <th>{t.colPulse}</th>
              <th>{t.colClass}</th>
              <th>{t.colContext}</th>
              <th>{t.colNotes}</th>
              <th className="no-print">{t.colActions}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="table-empty">
                  {t.noMatchingReadings}
                </td>
              </tr>
            ) : (
              filtered.map((r) => {
                const cat = classifyBloodPressure(r.systolic, r.diastolic);
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
                      {r.systolic} / {r.diastolic} <span className="unit">mmHg</span>
                    </td>
                    <td className="tabular">{r.pulse != null ? `${r.pulse} ${pulseUnit}` : "—"}</td>
                    <td>
                      <span className={`badge ${cat.badgeClass}`}>{getBPLabel(cat.key, lang)}</span>
                    </td>
                    <td>
                      {translateValue(r.arm, lang)} · {translateValue(r.posture, lang)}
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

      {/* Vista Teléfono: Tarjetas */}
      <div className="mobile-readings-list">
        {filtered.length === 0 ? (
          <div className="empty-state">{t.noMatchingReadings}</div>
        ) : (
          filtered.map((r) => {
            const cat = classifyBloodPressure(r.systolic, r.diastolic);
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
                    {r.systolic} / {r.diastolic} <span className="unit">mmHg</span>
                  </div>
                  <span className={`badge ${cat.badgeClass}`}>{getBPLabel(cat.key, lang)}</span>
                </div>
                <div className="mobile-reading-meta">
                  <span>{dt}</span>
                  {r.pulse != null && (
                    <span>
                      • {r.pulse} {pulseUnit}
                    </span>
                  )}
                  <span>
                    • {translateValue(r.arm, lang)}, {translateValue(r.posture, lang)}
                  </span>
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
