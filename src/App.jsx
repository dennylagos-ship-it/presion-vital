import React, { useEffect, useMemo, useState } from "react";
import {
  HeartPulse,
  Droplet,
  Users,
  Printer,
  Download,
  Database,
  Sun,
  Moon,
  Activity,
  PlusCircle,
  List,
  SlidersHorizontal,
  FileText,
  Share2
} from "lucide-react";
import { classifyBloodPressure, classifyGlucose } from "./utils/classification.js";
import {
  loadState,
  saveState,
  generateId,
  exportReadingsToCsv,
  exportGlucoseToCsv,
  exportBackupJson,
  generateDemoReadings,
  generateDemoGlucoseReadings,
  shareReport,
  shareGlucoseReport
} from "./utils/storage.js";
import ReadingForm from "./components/ReadingForm.jsx";
import StatsPanel from "./components/StatsPanel.jsx";
import TrendChart from "./components/TrendChart.jsx";
import ReadingsTable from "./components/ReadingsTable.jsx";
import {
  GlucoseForm,
  GlucoseStatsPanel,
  GlucoseTrendChart,
  GlucoseTable,
  EditGlucoseModal,
  GlucoseGuideCard
} from "./components/GlucoseModule.jsx";
import { ProfilesModal, EditReadingModal, BackupModal } from "./components/Modals.jsx";

const RANGE_LABELS = {
  "7": "Últimos 7 días",
  "30": "Últimos 30 días",
  "90": "Últimos 90 días",
  all: "Historial completo"
};

function filterByRange(readingsDesc, selectedRange) {
  if (selectedRange === "all") return readingsDesc;
  const days = Number(selectedRange);
  const cutoff = new Date();
  cutoff.setHours(0, 0, 0, 0);
  cutoff.setDate(cutoff.getDate() - (days - 1));
  return readingsDesc.filter((r) => new Date(r.dateTime).getTime() >= cutoff.getTime());
}

export default function App() {
  const [state, setState] = useState(() => loadState());
  const [activeModule, setActiveModule] = useState("bp");
  const [selectedRange, setSelectedRange] = useState("7");
  const [crisisDismissed, setCrisisDismissed] = useState(false);
  const [showProfilesModal, setShowProfilesModal] = useState(false);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [editingReading, setEditingReading] = useState(null);
  const [editingGlucose, setEditingGlucose] = useState(null);
  const [mobileTab, setMobileTab] = useState("summary");
  const [theme, setTheme] = useState(() => localStorage.getItem("bp_theme") || "light");
  const [pdfPreview, setPdfPreview] = useState(false);

  useEffect(() => {
    saveState(state);
  }, [state]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("bp_theme", theme);
  }, [theme]);

  useEffect(() => {
    document.body.classList.toggle("pdf-preview", pdfPreview);
    return () => document.body.classList.remove("pdf-preview");
  }, [pdfPreview]);

  const activeProfile = useMemo(
    () => state.profiles.find((p) => p.id === state.activeProfileId) || state.profiles[0],
    [state.profiles, state.activeProfileId]
  );

  // Lecturas de Presión Arterial
  const allProfileReadingsDesc = useMemo(() => {
    return state.readings
      .filter((r) => r.profileId === activeProfile.id)
      .sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());
  }, [state.readings, activeProfile.id]);

  const rangedReadingsDesc = useMemo(
    () => filterByRange(allProfileReadingsDesc, selectedRange),
    [allProfileReadingsDesc, selectedRange]
  );

  const rangedReadingsAsc = useMemo(
    () => rangedReadingsDesc.slice().reverse(),
    [rangedReadingsDesc]
  );

  // Lecturas de Glicemia
  const allGlucoseDesc = useMemo(() => {
    return (state.glucoseReadings || [])
      .filter((r) => r.profileId === activeProfile.id)
      .sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());
  }, [state.glucoseReadings, activeProfile.id]);

  const rangedGlucoseDesc = useMemo(
    () => filterByRange(allGlucoseDesc, selectedRange),
    [allGlucoseDesc, selectedRange]
  );

  const rangedGlucoseAsc = useMemo(
    () => rangedGlucoseDesc.slice().reverse(),
    [rangedGlucoseDesc]
  );

  // Alertas críticas según módulo activo
  const latestBP = allProfileReadingsDesc[0] || null;
  const isLatestCrisis =
    activeModule === "bp" &&
    latestBP &&
    classifyBloodPressure(latestBP.systolic, latestBP.diastolic).key === "crisis";

  const latestGlucose = allGlucoseDesc[0] || null;
  const latestGlucoseCat = latestGlucose
    ? classifyGlucose(latestGlucose.value, latestGlucose.context)
    : null;
  const isLatestGlucoseCritical =
    activeModule === "glucose" &&
    latestGlucoseCat &&
    (latestGlucoseCat.key === "severeLow" || latestGlucoseCat.key === "severeHigh");

  // Handlers Presión Arterial
  function handleAddReading(readingData) {
    setState((prev) => ({
      ...prev,
      readings: [
        ...prev.readings,
        { id: generateId("rd"), profileId: activeProfile.id, ...readingData }
      ]
    }));
    setCrisisDismissed(false);
    setMobileTab("summary");
  }

  function handleUpdateReading(updated) {
    setState((prev) => ({
      ...prev,
      readings: prev.readings.map((r) => (r.id === updated.id ? updated : r))
    }));
    setEditingReading(null);
  }

  function handleDeleteReading(id) {
    if (!confirm("¿Eliminar esta medición?")) return;
    setState((prev) => ({
      ...prev,
      readings: prev.readings.filter((r) => r.id !== id)
    }));
  }

  // Handlers Glicemia
  function handleAddGlucose(data) {
    setState((prev) => ({
      ...prev,
      glucoseReadings: [
        ...(prev.glucoseReadings || []),
        { id: generateId("gl"), profileId: activeProfile.id, ...data }
      ]
    }));
    setCrisisDismissed(false);
    setMobileTab("summary");
  }

  function handleUpdateGlucose(updated) {
    setState((prev) => ({
      ...prev,
      glucoseReadings: (prev.glucoseReadings || []).map((r) =>
        r.id === updated.id ? updated : r
      )
    }));
    setEditingGlucose(null);
  }

  function handleDeleteGlucose(id) {
    if (!confirm("¿Eliminar este registro de glicemia?")) return;
    setState((prev) => ({
      ...prev,
      glucoseReadings: (prev.glucoseReadings || []).filter((r) => r.id !== id)
    }));
  }

  // Perfiles
  function handleSelectProfile(profileId) {
    setState((prev) => ({ ...prev, activeProfileId: profileId }));
    setCrisisDismissed(false);
  }

  function handleCreateProfile({ name, age, notes }) {
    const newProf = { id: generateId("prof"), name, age, notes };
    setState((prev) => ({
      ...prev,
      activeProfileId: newProf.id,
      profiles: [...prev.profiles, newProf]
    }));
    setCrisisDismissed(false);
  }

  function handleDeleteProfile(profile) {
    if (!confirm(`¿Eliminar el perfil "${profile.name}" y todas sus mediciones?`)) return;
    setState((prev) => {
      const remainingProfiles = prev.profiles.filter((p) => p.id !== profile.id);
      const nextActive =
        prev.activeProfileId === profile.id ? remainingProfiles[0].id : prev.activeProfileId;
      return {
        ...prev,
        activeProfileId: nextActive,
        profiles: remainingProfiles,
        readings: prev.readings.filter((r) => r.profileId !== profile.id),
        glucoseReadings: (prev.glucoseReadings || []).filter((r) => r.profileId !== profile.id)
      };
    });
  }

  // Exportar / Compartir según módulo activo
  function handleExportCsv() {
    if (activeModule === "bp") {
      if (!rangedReadingsDesc.length) {
        alert("No hay mediciones de presión arterial en el período para exportar.");
        return;
      }
      exportReadingsToCsv(activeProfile, rangedReadingsDesc);
    } else {
      if (!rangedGlucoseDesc.length) {
        alert("No hay mediciones de glicemia en el período para exportar.");
        return;
      }
      exportGlucoseToCsv(activeProfile, rangedGlucoseDesc);
    }
  }

  async function handleShareReport() {
    const list = activeModule === "bp" ? rangedReadingsDesc : rangedGlucoseDesc;
    if (!list.length) {
      alert("No hay mediciones en el período seleccionado para compartir.");
      return;
    }
    const res =
      activeModule === "bp"
        ? await shareReport(activeProfile, RANGE_LABELS[selectedRange], list)
        : await shareGlucoseReport(activeProfile, RANGE_LABELS[selectedRange], list);

    if (res.method === "clipboard") {
      alert("Resumen del reporte copiado al portapapeles. Ya puedes pegarlo en WhatsApp o correo.");
    }
  }

  function handleLoadDemo() {
    const demoBP = generateDemoReadings(activeProfile.id);
    const demoGl = generateDemoGlucoseReadings(activeProfile.id);
    setState((prev) => ({
      ...prev,
      readings: [...prev.readings, ...demoBP],
      glucoseReadings: [...(prev.glucoseReadings || []), ...demoGl]
    }));
    setShowBackupModal(false);
    setMobileTab("summary");
  }

  function handleImportJson(imported) {
    setState({
      ...imported,
      glucoseReadings: Array.isArray(imported.glucoseReadings) ? imported.glucoseReadings : []
    });
    setShowBackupModal(false);
    alert("Respaldo importado correctamente.");
  }

  const profileInfoText = [
    `Paciente: ${activeProfile.name}`,
    activeProfile.age ? `${activeProfile.age} años` : null,
    activeProfile.notes ? `Notas: ${activeProfile.notes}` : null
  ]
    .filter(Boolean)
    .join(" · ");

  const reportTitle =
    activeModule === "bp"
      ? "Reporte de Control de Presión Arterial"
      : "Reporte de Control de Glicemia";

  return (
    <>
      {pdfPreview && (
        <div className="pdf-preview-bar">
          <span>Vista previa del Reporte Médico (PDF)</span>
          <div className="pdf-preview-bar-actions">
            <button type="button" className="btn btn-primary btn-sm" onClick={handleShareReport}>
              <Share2 size={15} />
              Compartir
            </button>
            <button type="button" className="btn btn-primary btn-sm" onClick={() => window.print()}>
              <Printer size={15} />
              Imprimir / Guardar PDF
            </button>
            <button
              type="button"
              className="btn btn-outline-light btn-sm"
              onClick={() => setPdfPreview(false)}
            >
              Salir de vista previa
            </button>
          </div>
        </div>
      )}

      <header className="print-only-header">
        <div className="print-header-top">
          <div>
            <h1>{reportTitle}</h1>
            <p>{profileInfoText}</p>
          </div>
          <div>
            <p>Período: {RANGE_LABELS[selectedRange]}</p>
            <p>Generado: {new Date().toLocaleString("es-ES")}</p>
          </div>
        </div>
      </header>

      <nav className="topbar no-print">
        <div className="container topbar-inner">
          <div className="brand">
            <span className="brand-icon" aria-hidden="true">
              <HeartPulse size={20} />
            </span>
            <div>
              <span className="brand-title">PresiónVital</span>
              <span className="brand-subtitle">Control Arterial y Glicemia</span>
            </div>
          </div>

          <div className="topbar-actions">
            <div className="profile-selector-wrap">
              <label htmlFor="profileSelect" className="sr-only">
                Perfil activo
              </label>
              <select
                id="profileSelect"
                className="select-profile"
                value={activeProfile.id}
                onChange={(e) => handleSelectProfile(e.target.value)}
                title="Cambiar perfil"
              >
                {state.profiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                    {p.age ? ` (${p.age} años)` : ""}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => setShowProfilesModal(true)}
                title="Gestionar perfiles"
              >
                <Users size={15} />
                <span className="hide-xs">Perfiles</span>
              </button>
              <button
                type="button"
                className="btn btn-outline btn-sm btn-icon-only"
                onClick={() => setTheme((t) => (t === "light" ? "dark" : "light"))}
                title={theme === "light" ? "Cambiar a modo oscuro" : "Cambiar a modo claro"}
                aria-label="Cambiar tema"
              >
                {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
              </button>
            </div>

            <div className="export-actions">
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={handleShareReport}
                title="Compartir reporte por WhatsApp, correo, etc."
              >
                <Share2 size={15} />
                Compartir
              </button>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => setPdfPreview(true)}
                title="Ver vista previa del reporte PDF"
              >
                <FileText size={15} />
                Vista previa PDF
              </button>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => window.print()}
                title="Imprimir o guardar como PDF para el médico"
              >
                <Printer size={15} />
                Imprimir / PDF
              </button>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={handleExportCsv}
                title="Exportar registros a CSV (Excel)"
              >
                <Download size={15} />
                Exportar CSV
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setShowBackupModal(true)}
                title="Respaldo JSON e importación"
              >
                <Database size={15} />
                Respaldo
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="container main-content">
        {/* Selector de módulo: Presión Arterial vs Glicemia */}
        <div className="module-switcher-wrap no-print">
          <div className="module-switcher" role="tablist" aria-label="Módulo de salud">
            <button
              type="button"
              role="tab"
              aria-selected={activeModule === "bp"}
              className={`module-tab ${activeModule === "bp" ? "active" : ""}`}
              onClick={() => {
                setActiveModule("bp");
                setCrisisDismissed(false);
              }}
            >
              <HeartPulse size={16} />
              <span>Presión Arterial</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeModule === "glucose"}
              className={`module-tab ${activeModule === "glucose" ? "active" : ""}`}
              onClick={() => {
                setActiveModule("glucose");
                setCrisisDismissed(false);
              }}
            >
              <Droplet size={16} />
              <span>Glicemia</span>
            </button>
          </div>
        </div>

        {/* Alerta crítica */}
        {isLatestCrisis && !crisisDismissed && (
          <div className="alert-banner alert-crisis" role="alert">
            <div className="alert-banner-content">
              <strong>
                Atención: Lectura en rango de Crisis Hipertensiva (&gt;180 / &gt;120 mmHg)
              </strong>
              <p>
                Si presentas síntomas como dolor de pecho, dificultad para respirar, entumecimiento o
                alteración visual, busca atención médica de emergencia de inmediato.
              </p>
            </div>
            <button
              type="button"
              className="btn btn-sm btn-outline-light"
              onClick={() => setCrisisDismissed(true)}
            >
              Entendido
            </button>
          </div>
        )}

        {isLatestGlucoseCritical && !crisisDismissed && (
          <div className="alert-banner alert-crisis" role="alert">
            <div className="alert-banner-content">
              <strong>
                Atención: Glicemia en rango crítico ({latestGlucose.value} mg/dL —{" "}
                {latestGlucoseCat.label})
              </strong>
              <p>
                {latestGlucoseCat.key === "severeLow"
                  ? "Un nivel menor a 54 mg/dL requiere atención inmediata (ingiere carbohidratos de acción rápida si estás consciente y consulta a un médico)."
                  : "Un nivel igual o mayor a 250 mg/dL requiere evaluación médica pronta, especialmente si hay náuseas, sed intensa o malestar."}
              </p>
            </div>
            <button
              type="button"
              className="btn btn-sm btn-outline-light"
              onClick={() => setCrisisDismissed(true)}
            >
              Entendido
            </button>
          </div>
        )}

        <section
          className={`hero-banner no-print ${mobileTab !== "summary" ? "mobile-hidden" : ""}`}
        >
          <div className="hero-banner-text">
            <h1>
              {activeModule === "bp" ? "Control de Presión Arterial" : "Control de Glicemia"}
            </h1>
            <p>
              {activeModule === "bp"
                ? "Registra tus mediciones diarias, visualiza tu tendencia y lleva un reporte claro a tu consulta médica."
                : "Registra tu glucosa en ayunas o postprandial, observa tu tendencia y comparte tu reporte médico."}
            </p>
            <div className="hero-tips">
              {activeModule === "bp" ? (
                <>
                  <span className="hero-tip-chip">Reposa 5 min antes</span>
                  <span className="hero-tip-chip">Brazo a la altura del corazón</span>
                  <span className="hero-tip-chip">Pies apoyados en el suelo</span>
                </>
              ) : (
                <>
                  <span className="hero-tip-chip">Ayunas: 8h sin calorías</span>
                  <span className="hero-tip-chip">Postprandial: 2h tras comer</span>
                  <span className="hero-tip-chip">Lava y seca tus manos antes</span>
                </>
              )}
            </div>
          </div>
          <img
            src="/hero-bp.jpg"
            alt="Ilustración de control de salud"
            className="hero-banner-img"
          />
        </section>

        {activeModule === "bp" ? (
          <>
            <section className="top-grid">
              <ReadingForm
                onAddReading={handleAddReading}
                className={mobileTab !== "add" ? "mobile-hidden" : ""}
              />
              <StatsPanel
                allReadings={allProfileReadingsDesc}
                rangedReadings={rangedReadingsDesc}
                selectedRange={selectedRange}
                onRangeChange={setSelectedRange}
                className={mobileTab !== "summary" ? "mobile-hidden" : ""}
              />
            </section>

            <TrendChart
              readings={rangedReadingsAsc}
              className={mobileTab !== "summary" ? "mobile-hidden" : ""}
            />

            <ReadingsTable
              readings={rangedReadingsDesc}
              onEdit={(r) => setEditingReading(r)}
              onDelete={handleDeleteReading}
              className={mobileTab !== "history" ? "mobile-hidden" : ""}
            />

            <section className={`card guide-card ${mobileTab !== "more" ? "mobile-hidden" : ""}`}>
              <h2>Guía de Referencia (AHA / ACC &amp; OMS)</h2>
              <div className="guide-grid">
                <div className="guide-item border-hypotension">
                  <strong>Hipotensión</strong>
                  <span>&lt; 90 o &lt; 60 mmHg</span>
                </div>
                <div className="guide-item border-normal">
                  <strong>Normal</strong>
                  <span>&lt; 120 y &lt; 80 mmHg</span>
                </div>
                <div className="guide-item border-elevated">
                  <strong>Elevada</strong>
                  <span>120–129 y &lt; 80 mmHg</span>
                </div>
                <div className="guide-item border-stage1">
                  <strong>Hipertensión Grado 1</strong>
                  <span>130–139 o 80–89 mmHg</span>
                </div>
                <div className="guide-item border-stage2">
                  <strong>Hipertensión Grado 2</strong>
                  <span>&ge; 140 o &ge; 90 mmHg</span>
                </div>
                <div className="guide-item border-crisis">
                  <strong>Crisis Hipertensiva</strong>
                  <span>&gt; 180 y/o &gt; 120 mmHg</span>
                </div>
              </div>
              <p className="disclaimer">
                Nota: Esta aplicación es una herramienta de registro personal y no sustituye el
                diagnóstico ni el tratamiento de un profesional de la salud.{" "}
                <a href="/privacy.html" target="_blank" rel="noopener noreferrer">
                  Política de Privacidad
                </a>
              </p>
            </section>
          </>
        ) : (
          <>
            <section className="top-grid">
              <GlucoseForm
                onAddGlucose={handleAddGlucose}
                className={mobileTab !== "add" ? "mobile-hidden" : ""}
              />
              <GlucoseStatsPanel
                allReadings={allGlucoseDesc}
                rangedReadings={rangedGlucoseDesc}
                selectedRange={selectedRange}
                onRangeChange={setSelectedRange}
                className={mobileTab !== "summary" ? "mobile-hidden" : ""}
              />
            </section>

            <GlucoseTrendChart
              readings={rangedGlucoseAsc}
              className={mobileTab !== "summary" ? "mobile-hidden" : ""}
            />

            <GlucoseTable
              readings={rangedGlucoseDesc}
              onEdit={(r) => setEditingGlucose(r)}
              onDelete={handleDeleteGlucose}
              className={mobileTab !== "history" ? "mobile-hidden" : ""}
            />

            <GlucoseGuideCard className={mobileTab !== "more" ? "mobile-hidden" : ""} />
          </>
        )}

        {/* Acciones rápidas en teléfono (pestaña Más) */}
        <section
          className={`card mobile-more-card no-print ${
            mobileTab !== "more" ? "mobile-hidden" : ""
          }`}
        >
          <h2>Herramientas y Reportes</h2>
          <p className="card-subtitle">
            Comparte o exporta tus datos de{" "}
            {activeModule === "bp" ? "Presión Arterial" : "Glicemia"}
          </p>
          <div className="mobile-more-grid">
            <button type="button" className="btn btn-primary" onClick={handleShareReport}>
              <Share2 size={16} />
              Compartir reporte
            </button>
            <button type="button" className="btn btn-outline" onClick={() => setPdfPreview(true)}>
              <FileText size={16} />
              Vista previa PDF
            </button>
            <button type="button" className="btn btn-outline" onClick={() => window.print()}>
              <Printer size={16} />
              Imprimir / PDF
            </button>
            <button type="button" className="btn btn-outline" onClick={handleExportCsv}>
              <Download size={16} />
              Exportar CSV
            </button>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => setShowBackupModal(true)}
            >
              <Database size={16} />
              Respaldo JSON
            </button>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => setShowProfilesModal(true)}
            >
              <Users size={16} />
              Perfiles
            </button>
          </div>
          <p className="disclaimer" style={{ marginTop: "14px" }}>
            <a href="/privacy.html" target="_blank" rel="noopener noreferrer">
              Política de Privacidad y Aviso Médico
            </a>
          </p>
        </section>
      </main>

      <nav className="mobile-bottom-nav no-print" aria-label="Navegación móvil">
        <button
          type="button"
          className={`nav-tab ${mobileTab === "summary" ? "active" : ""}`}
          onClick={() => setMobileTab("summary")}
        >
          <Activity size={20} />
          <span>Resumen</span>
        </button>
        <button
          type="button"
          className={`nav-tab ${mobileTab === "add" ? "active" : ""}`}
          onClick={() => setMobileTab("add")}
        >
          <PlusCircle size={20} />
          <span>Registrar</span>
        </button>
        <button
          type="button"
          className={`nav-tab ${mobileTab === "history" ? "active" : ""}`}
          onClick={() => setMobileTab("history")}
        >
          <List size={20} />
          <span>Historial</span>
        </button>
        <button
          type="button"
          className={`nav-tab ${mobileTab === "more" ? "active" : ""}`}
          onClick={() => setMobileTab("more")}
        >
          <SlidersHorizontal size={20} />
          <span>Más</span>
        </button>
      </nav>

      {showProfilesModal && (
        <ProfilesModal
          profiles={state.profiles}
          activeProfileId={activeProfile.id}
          readings={state.readings}
          onSelectProfile={handleSelectProfile}
          onCreateProfile={handleCreateProfile}
          onDeleteProfile={handleDeleteProfile}
          onClose={() => setShowProfilesModal(false)}
        />
      )}

      {editingReading && (
        <EditReadingModal
          reading={editingReading}
          onSave={handleUpdateReading}
          onClose={() => setEditingReading(null)}
        />
      )}

      {editingGlucose && (
        <EditGlucoseModal
          reading={editingGlucose}
          onSave={handleUpdateGlucose}
          onClose={() => setEditingGlucose(null)}
        />
      )}

      {showBackupModal && (
        <BackupModal
          onExportJson={() => exportBackupJson(state)}
          onImportJson={handleImportJson}
          onLoadDemo={handleLoadDemo}
          onClose={() => setShowBackupModal(false)}
        />
      )}
    </>
  );
}
