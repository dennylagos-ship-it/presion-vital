import React, { useState } from "react";
import { classifyBloodPressure } from "../utils/classification.js";

export default function ReadingsTable({ readings, onEdit, onDelete, className = "" }) {
  const [catFilter, setCatFilter] = useState("all");
  const [search, setSearch] = useState("");

  const query = search.trim().toLowerCase();
  const filtered = readings.filter((r) => {
    const cat = classifyBloodPressure(r.systolic, r.diastolic);
    if (catFilter !== "all" && cat.key !== catFilter) return false;
    if (query && !(r.notes || "").toLowerCase().includes(query)) return false;
    return true;
  });

  return (
    <section className={`card history-card ${className}`.trim()}>
      <div className="card-header history-header">
        <div>
          <h2>Historial de Mediciones</h2>
          <p className="card-subtitle">
            Mostrando {filtered.length} de {readings.length} registros del período
          </p>
        </div>
        <div className="history-filters no-print">
          <select
            className="select-sm"
            aria-label="Filtrar por categoría"
            value={catFilter}
            onChange={(e) => setCatFilter(e.target.value)}
          >
            <option value="all">Todas las categorías</option>
            <option value="hypotension">Hipotensión</option>
            <option value="normal">Normal</option>
            <option value="elevated">Elevada</option>
            <option value="stage1">Hipertensión Grado 1</option>
            <option value="stage2">Hipertensión Grado 2</option>
            <option value="crisis">Crisis Hipertensiva</option>
          </select>
          <input
            type="search"
            className="input-sm"
            placeholder="Buscar en notas..."
            aria-label="Buscar en notas"
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
              <th>Fecha y hora</th>
              <th>Sistólica / Diastólica</th>
              <th>Pulso</th>
              <th>Clasificación</th>
              <th>Contexto</th>
              <th>Notas</th>
              <th className="no-print">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="table-empty">
                  No hay mediciones que coincidan con el filtro actual.
                </td>
              </tr>
            ) : (
              filtered.map((r) => {
                const cat = classifyBloodPressure(r.systolic, r.diastolic);
                const dt = new Date(r.dateTime).toLocaleString("es-ES", {
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
                    <td className="tabular">{r.pulse != null ? `${r.pulse} lpm` : "—"}</td>
                    <td>
                      <span className={`badge ${cat.badgeClass}`}>{cat.label}</span>
                    </td>
                    <td>
                      {r.arm} · {r.posture}
                    </td>
                    <td>{r.notes ? r.notes : <span className="unit">—</span>}</td>
                    <td className="no-print">
                      <div className="row-actions">
                        <button
                          type="button"
                          className="btn btn-icon-text"
                          onClick={() => onEdit(r)}
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger-text"
                          onClick={() => onDelete(r.id)}
                        >
                          Eliminar
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
          <div className="empty-state">No hay mediciones que coincidan con el filtro actual.</div>
        ) : (
          filtered.map((r) => {
            const cat = classifyBloodPressure(r.systolic, r.diastolic);
            const dt = new Date(r.dateTime).toLocaleString("es-ES", {
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
                  <span className={`badge ${cat.badgeClass}`}>{cat.label}</span>
                </div>
                <div className="mobile-reading-meta">
                  <span>{dt}</span>
                  {r.pulse != null && <span>• {r.pulse} lpm</span>}
                  <span>
                    • {r.arm}, {r.posture}
                  </span>
                </div>
                {r.notes && <div className="mobile-reading-meta">Nota: {r.notes}</div>}
                <div className="mobile-reading-actions no-print">
                  <button type="button" className="btn btn-icon-text" onClick={() => onEdit(r)}>
                    Editar
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger-text"
                    onClick={() => onDelete(r.id)}
                  >
                    Eliminar
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
