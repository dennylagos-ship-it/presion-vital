import React, { useState } from "react";
import { validateReading } from "../utils/classification.js";

export function ProfilesModal({
  profiles,
  activeProfileId,
  readings,
  onSelectProfile,
  onCreateProfile,
  onDeleteProfile,
  onClose
}) {
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [notes, setNotes] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    onCreateProfile({
      name: name.trim(),
      age: age ? Number(age) : null,
      notes: notes.trim()
    });
    setName("");
    setAge("");
    setNotes("");
  }

  return (
    <div
      className="modal-backdrop no-print"
      role="dialog"
      aria-modal="true"
      aria-labelledby="profilesModalTitle"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal">
        <div className="modal-header">
          <h3 id="profilesModalTitle">Perfiles de Usuario</h3>
          <button type="button" className="btn-close" onClick={onClose} aria-label="Cerrar">
            &times;
          </button>
        </div>
        <div className="modal-body">
          <div className="profiles-list">
            {profiles.map((p) => {
              const count = readings.filter((r) => r.profileId === p.id).length;
              const isActive = p.id === activeProfileId;
              return (
                <div key={p.id} className={`profile-item ${isActive ? "active-profile" : ""}`}>
                  <div>
                    <strong>{p.name}</strong>
                    {p.age ? <span className="unit"> ({p.age} años)</span> : null}
                    <div className="profile-meta">
                      {count} {count === 1 ? "medición" : "mediciones"}
                      {p.notes ? ` · ${p.notes}` : ""}
                    </div>
                  </div>
                  <div className="row-actions">
                    {!isActive && (
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        onClick={() => onSelectProfile(p.id)}
                      >
                        Usar
                      </button>
                    )}
                    {profiles.length > 1 && (
                      <button
                        type="button"
                        className="btn btn-danger-text"
                        onClick={() => onDeleteProfile(p)}
                      >
                        Eliminar
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <hr className="divider" />
          <h4>Agregar nuevo perfil</h4>
          <form onSubmit={handleSubmit}>
            <div className="form-row-2">
              <div className="form-group">
                <label htmlFor="profileNameInput">Nombre</label>
                <input
                  type="text"
                  id="profileNameInput"
                  maxLength={40}
                  placeholder="Ej. Mamá, Juan..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="profileAgeInput">Edad (opcional)</label>
                <input
                  type="number"
                  id="profileAgeInput"
                  min="1"
                  max="120"
                  placeholder="Ej. 58"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="profileNotesInput">Notas médicas / medicación (opcional)</label>
              <input
                type="text"
                id="profileNotesInput"
                maxLength={120}
                placeholder="Ej. Losartán 50mg cada mañana"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-primary">
              Crear Perfil
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export function EditReadingModal({ reading, onSave, onClose }) {
  const [systolic, setSystolic] = useState(String(reading.systolic));
  const [diastolic, setDiastolic] = useState(String(reading.diastolic));
  const [pulse, setPulse] = useState(reading.pulse != null ? String(reading.pulse) : "");
  const [dateTime, setDateTime] = useState(reading.dateTime);
  const [arm, setArm] = useState(reading.arm);
  const [posture, setPosture] = useState(reading.posture);
  const [notes, setNotes] = useState(reading.notes || "");
  const [error, setError] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const sysNum = Number(systolic);
    const diaNum = Number(diastolic);
    const pulseVal = pulse.trim() === "" ? null : Number(pulse);
    const err = validateReading(sysNum, diaNum, pulseVal, dateTime);
    if (err) {
      setError(err);
      return;
    }
    onSave({
      ...reading,
      systolic: sysNum,
      diastolic: diaNum,
      pulse: pulseVal,
      dateTime,
      arm,
      posture,
      notes: notes.trim()
    });
  }

  return (
    <div
      className="modal-backdrop no-print"
      role="dialog"
      aria-modal="true"
      aria-labelledby="editModalTitle"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal">
        <div className="modal-header">
          <h3 id="editModalTitle">Editar Medición</h3>
          <button type="button" className="btn-close" onClick={onClose} aria-label="Cerrar">
            &times;
          </button>
        </div>
        <div className="modal-body">
          <form onSubmit={handleSubmit}>
            <div className="form-row-3">
              <div className="form-group">
                <label htmlFor="editSystolic">Sistólica</label>
                <input
                  type="number"
                  id="editSystolic"
                  min="50"
                  max="280"
                  value={systolic}
                  onChange={(e) => setSystolic(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="editDiastolic">Diastólica</label>
                <input
                  type="number"
                  id="editDiastolic"
                  min="30"
                  max="180"
                  value={diastolic}
                  onChange={(e) => setDiastolic(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="editPulse">Pulso</label>
                <input
                  type="number"
                  id="editPulse"
                  min="30"
                  max="220"
                  value={pulse}
                  onChange={(e) => setPulse(e.target.value)}
                />
              </div>
            </div>
            <div className="form-row-2">
              <div className="form-group">
                <label htmlFor="editDateTime">Fecha y hora</label>
                <input
                  type="datetime-local"
                  id="editDateTime"
                  value={dateTime}
                  onChange={(e) => setDateTime(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="editArm">Brazo</label>
                <select id="editArm" value={arm} onChange={(e) => setArm(e.target.value)}>
                  <option value="Izquierdo">Izquierdo</option>
                  <option value="Derecho">Derecho</option>
                </select>
              </div>
            </div>
            <div className="form-row-2">
              <div className="form-group">
                <label htmlFor="editPosture">Postura</label>
                <select
                  id="editPosture"
                  value={posture}
                  onChange={(e) => setPosture(e.target.value)}
                >
                  <option value="Sentado">Sentado (en reposo)</option>
                  <option value="Acostado">Acostado</option>
                  <option value="De pie">De pie</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="editNotes">Notas</label>
                <input
                  type="text"
                  id="editNotes"
                  maxLength={140}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>
            {error && <p className="form-error">{error}</p>}
            <div className="modal-footer-actions">
              <button type="button" className="btn btn-outline" onClick={onClose}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary">
                Guardar Cambios
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export function BackupModal({ onExportJson, onImportJson, onLoadDemo, onClose }) {
  function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const imported = JSON.parse(reader.result);
        if (!imported || !Array.isArray(imported.profiles) || !Array.isArray(imported.readings)) {
          alert("El archivo JSON no tiene un formato válido de PresiónVital.");
          return;
        }
        if (!confirm("Esto reemplazará los datos actuales con el respaldo importado. ¿Continuar?")) {
          return;
        }
        onImportJson(imported);
      } catch {
        alert("No se pudo leer el archivo JSON.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  return (
    <div
      className="modal-backdrop no-print"
      role="dialog"
      aria-modal="true"
      aria-labelledby="backupModalTitle"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal">
        <div className="modal-header">
          <h3 id="backupModalTitle">Respaldo y Datos</h3>
          <button type="button" className="btn-close" onClick={onClose} aria-label="Cerrar">
            &times;
          </button>
        </div>
        <div className="modal-body">
          <p className="modal-desc">
            Tus datos se guardan localmente en este navegador. Exporta un respaldo JSON para guardar
            una copia segura o transferir tus registros a otro dispositivo.
          </p>
          <div className="backup-actions-grid">
            <button type="button" className="btn btn-primary" onClick={onExportJson}>
              Descargar Respaldo JSON
            </button>
            <label className="btn btn-outline file-upload-btn">
              Importar Respaldo JSON
              <input type="file" accept=".json,application/json" hidden onChange={handleFileChange} />
            </label>
          </div>
          <hr className="divider" />
          <div>
            <h4>Datos de demostración</h4>
            <p className="modal-desc">
              ¿Quieres probar los gráficos y reportes? Puedes cargar 14 registros de ejemplo en el
              perfil activo.
            </p>
            <button type="button" className="btn btn-outline btn-sm" onClick={onLoadDemo}>
              Cargar datos de ejemplo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
