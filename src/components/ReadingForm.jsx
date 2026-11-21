import React, { useState } from "react";
import { classifyBloodPressure, validateReading } from "../utils/classification.js";
import { toLocalDateTimeInputValue } from "../utils/storage.js";

export default function ReadingForm({ onAddReading, className = "" }) {
  const [systolic, setSystolic] = useState("");
  const [diastolic, setDiastolic] = useState("");
  const [pulse, setPulse] = useState("");
  const [dateTime, setDateTime] = useState(() => toLocalDateTimeInputValue(new Date()));
  const [arm, setArm] = useState("Izquierdo");
  const [posture, setPosture] = useState("Sentado");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  const sysNum = Number(systolic);
  const diaNum = Number(diastolic);
  const liveCategory =
    systolic !== "" && diastolic !== "" && sysNum > diaNum
      ? classifyBloodPressure(sysNum, diaNum)
      : null;

  function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const pulseVal = pulse.trim() === "" ? null : Number(pulse);
    const err = validateReading(sysNum, diaNum, pulseVal, dateTime);
    if (err) {
      setError(err);
      return;
    }

    onAddReading({
      systolic: sysNum,
      diastolic: diaNum,
      pulse: pulseVal,
      dateTime,
      arm,
      posture,
      notes: notes.trim()
    });

    setSystolic("");
    setDiastolic("");
    setPulse("");
    setNotes("");
    setDateTime(toLocalDateTimeInputValue(new Date()));
  }

  return (
    <div className={`card form-card no-print ${className}`.trim()}>
      <div className="card-header">
        <h2>Nuevo Registro</h2>
        <span className={`badge ${liveCategory ? liveCategory.badgeClass : "badge-neutral"}`}>
          {liveCategory ? liveCategory.label : "Ingresa valores"}
        </span>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div className="form-row-3">
          <div className="form-group">
            <label htmlFor="inputSystolic">
              Sistólica <span className="unit">(mmHg)</span>
            </label>
            <input
              type="number"
              id="inputSystolic"
              min="50"
              max="280"
              placeholder="120"
              value={systolic}
              onChange={(e) => setSystolic(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="inputDiastolic">
              Diastólica <span className="unit">(mmHg)</span>
            </label>
            <input
              type="number"
              id="inputDiastolic"
              min="30"
              max="180"
              placeholder="80"
              value={diastolic}
              onChange={(e) => setDiastolic(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="inputPulse">
              Pulso <span className="unit">(lpm)</span>
            </label>
            <input
              type="number"
              id="inputPulse"
              min="30"
              max="220"
              placeholder="72"
              value={pulse}
              onChange={(e) => setPulse(e.target.value)}
            />
          </div>
        </div>

        <div className="form-row-2">
          <div className="form-group">
            <label htmlFor="inputDateTime">Fecha y hora</label>
            <input
              type="datetime-local"
              id="inputDateTime"
              value={dateTime}
              onChange={(e) => setDateTime(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="inputArm">Brazo</label>
            <select id="inputArm" value={arm} onChange={(e) => setArm(e.target.value)}>
              <option value="Izquierdo">Izquierdo</option>
              <option value="Derecho">Derecho</option>
            </select>
          </div>
        </div>

        <div className="form-row-2">
          <div className="form-group">
            <label htmlFor="inputPosture">Postura</label>
            <select id="inputPosture" value={posture} onChange={(e) => setPosture(e.target.value)}>
              <option value="Sentado">Sentado (en reposo)</option>
              <option value="Acostado">Acostado</option>
              <option value="De pie">De pie</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="inputNotes">Notas</label>
            <input
              type="text"
              id="inputNotes"
              maxLength={140}
              placeholder="Ej. En ayunas, con medicación..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}

        <div className="form-actions">
          <button type="submit" className="btn btn-primary btn-block">
            Guardar Medición
          </button>
        </div>
      </form>
    </div>
  );
}
