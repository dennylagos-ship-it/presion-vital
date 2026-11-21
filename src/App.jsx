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
import {
  STRINGS,
  detectInitialLang,
  saveLang,
  getBPLabel,
  getGlucoseLabel,
  getLocale
} from "./utils/i18n.js";
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
  const [lang, setLang] = useState(() => detectInitialLang());
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

  const t = STRINGS[lang] || STRINGS.es;
  const locale = getLocale(lang);

  useEffect(() => {
    saveState(state);
  }, [state]);

  useEffect(() => {
    saveLang(lang);
    document.documentElement.lang = lang;
  }, [lang]);

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
    if (!confirm(t.confirmDeleteBP)) return;
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
    if (!confirm(t.confirmDeleteGl)) return;
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
    const msg =
      lang === "en"
        ? `Delete profile "${profile.name}" and all its readings?`
        : `¿Eliminar el perfil "${profile.name}" y todas sus mediciones?`;
    if (!confirm(msg)) return;
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
        alert(t.noExportData);
        return;
      }
      exportReadingsToCsv(activeProfile, rangedReadingsDesc, lang);
    } else {
      if (!rangedGlucoseDesc.length) {
        alert(t.noExportData);
        return;
      }
      exportGlucoseToCsv(activeProfile, rangedGlucoseDesc, lang);
    }
  }

  async function handleShareReport() {
    const list = activeModule === "bp" ? rangedReadingsDesc : rangedGlucoseDesc;
    if (!list.length) {
      alert(t.noShareData);
      return;
    }
    const res =
      activeModule === "bp"
        ? await shareReport(activeProfile, t.rangeLabels[selectedRange], list, lang)
        : await shareGlucoseReport(activeProfile, t.rangeLabels[selectedRange], list, lang);

    if (res.method === "clipboard") {
      alert(t.copiedAlert);
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
    alert(lang === "en" ? "Backup imported successfully." : "Respaldo importado correctamente.");
  }

  const profileInfoText = [
    `${t.patient}: ${activeProfile.name}`,
    activeProfile.age ? `${activeProfile.age} ${t.years}` : null,
    activeProfile.notes ? `${t.notes}: ${activeProfile.notes}` : null
  ]
    .filter(Boolean)
    .join(" · ");

  const reportTitle = activeModule === "bp" ? t.reportTitleBP : t.reportTitleGl;

  return (
    <>
      {pdfPreview && (
        <div className="pdf-preview-bar">
          <span>{t.pdfPreviewBar}</span>
          <div className="pdf-preview-bar-actions">
            <button type="button" className="btn btn-primary btn-sm" onClick={handleShareReport}>
              <Share2 size={15} />
              {t.share}
            </button>
            <button type="button" className="btn btn-primary btn-sm" onClick={() => window.print()}>
              <Printer size={15} />
              {t.printSavePdf}
            </button>
            <button
              type="button"
              className="btn btn-outline-light btn-sm"
              onClick={() => setPdfPreview(false)}
            >
              {t.exitPreview}
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
            <p>
              {t.period}: {t.rangeLabels[selectedRange]}
            </p>
            <p>
              {t.generated}: {new Date().toLocaleString(locale)}
            </p>
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
              <span className="brand-subtitle">{t.appSubtitle}</span>
            </div>
          </div>

          <div className="topbar-actions">
            <div className="profile-selector-wrap">
              <label htmlFor="profileSelect" className="sr-only">
                {t.profiles}
              </label>
              <select
                id="profileSelect"
                className="select-profile"
                value={activeProfile.id}
                onChange={(e) => handleSelectProfile(e.target.value)}
              >
                {state.profiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                    {p.age ? ` (${p.age} ${t.years})` : ""}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => setShowProfilesModal(true)}
                title={t.profiles}
              >
                <Users size={15} />
                <span className="hide-xs">{t.profiles}</span>
              </button>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => setLang((l) => (l === "es" ? "en" : "es"))}
                title={lang === "es" ? "Switch to English" : "Cambiar a Español"}
              >
                {lang.toUpperCase()}
              </button>
              <button
                type="button"
                className="btn btn-outline btn-sm btn-icon-only"
                onClick={() => setTheme((th) => (th === "light" ? "dark" : "light"))}
                aria-label="Theme"
              >
                {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
              </button>
            </div>

            <div className="export-actions">
              <button type="button" className="btn btn-outline btn-sm" onClick={handleShareReport}>
                <Share2 size={15} />
                {t.share}
              </button>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => setPdfPreview(true)}
              >
                <FileText size={15} />
                {t.pdfPreview}
              </button>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => window.print()}>
                <Printer size={15} />
                {t.printPdf}
              </button>
              <button type="button" className="btn btn-outline btn-sm" onClick={handleExportCsv}>
                <Download size={15} />
                {t.exportCsv}
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setShowBackupModal(true)}
              >
                <Database size={15} />
                {t.backup}
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="container main-content">
        {/* Selector de módulo: Presión Arterial vs Glicemia */}
        <div className="module-switcher-wrap no-print">
          <div className="module-switcher" role="tablist">
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
              <span>{t.tabBP}</span>
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
              <span>{t.tabGlucose}</span>
            </button>
          </div>
        </div>

        {/* Alerta crítica */}
        {isLatestCrisis && !crisisDismissed && (
          <div className="alert-banner alert-crisis" role="alert">
            <div className="alert-banner-content">
              <strong>{t.crisisTitle}</strong>
              <p>{t.crisisBody}</p>
            </div>
            <button
              type="button"
              className="btn btn-sm btn-outline-light"
              onClick={() => setCrisisDismissed(true)}
            >
              {t.understood}
            </button>
          </div>
        )}

        {isLatestGlucoseCritical && !crisisDismissed && (
          <div className="alert-banner alert-crisis" role="alert">
            <div className="alert-banner-content">
              <strong>
                {lang === "en"
                  ? `Warning: Critical blood glucose (${latestGlucose.value} mg/dL — ${getGlucoseLabel(
                      latestGlucoseCat.key,
                      lang
                    )})`
                  : `Atención: Glicemia en rango crítico (${latestGlucose.value} mg/dL — ${getGlucoseLabel(
                      latestGlucoseCat.key,
                      lang
                    )})`}
              </strong>
              <p>
                {latestGlucoseCat.key === "severeLow"
                  ? lang === "en"
                    ? "A level below 54 mg/dL requires immediate attention (take fast-acting carbs if conscious and contact a doctor)."
                    : "Un nivel menor a 54 mg/dL requiere atención inmediata (ingiere carbohidratos de acción rápida si estás consciente y consulta a un médico)."
                  : lang === "en"
                  ? "A level of 250 mg/dL or higher requires prompt medical evaluation, especially with nausea, extreme thirst, or fatigue."
                  : "Un nivel igual o mayor a 250 mg/dL requiere evaluación médica pronta, especialmente si hay náuseas, sed intensa o malestar."}
              </p>
            </div>
            <button
              type="button"
              className="btn btn-sm btn-outline-light"
              onClick={() => setCrisisDismissed(true)}
            >
              {t.understood}
            </button>
          </div>
        )}

        <section
          className={`hero-banner no-print ${mobileTab !== "summary" ? "mobile-hidden" : ""}`}
        >
          <div className="hero-banner-text">
            <h1>{activeModule === "bp" ? t.heroBPTitle : t.heroGlTitle}</h1>
            <p>{activeModule === "bp" ? t.heroBPDesc : t.heroGlDesc}</p>
            <div className="hero-tips">
              {(activeModule === "bp" ? t.heroBPTips : t.heroGlTips).map((tip) => (
                <span key={tip} className="hero-tip-chip">
                  {tip}
                </span>
              ))}
            </div>
          </div>
          <img
            src="/hero-bp.jpg"
            alt={activeModule === "bp" ? t.heroBPTitle : t.heroGlTitle}
            className="hero-banner-img"
          />
        </section>

        {activeModule === "bp" ? (
          <>
            <section className="top-grid">
              <ReadingForm
                lang={lang}
                onAddReading={handleAddReading}
                className={mobileTab !== "add" ? "mobile-hidden" : ""}
              />
              <StatsPanel
                lang={lang}
                allReadings={allProfileReadingsDesc}
                rangedReadings={rangedReadingsDesc}
                selectedRange={selectedRange}
                onRangeChange={setSelectedRange}
                className={mobileTab !== "summary" ? "mobile-hidden" : ""}
              />
            </section>

            <TrendChart
              lang={lang}
              readings={rangedReadingsAsc}
              className={mobileTab !== "summary" ? "mobile-hidden" : ""}
            />

            <ReadingsTable
              lang={lang}
              readings={rangedReadingsDesc}
              onEdit={(r) => setEditingReading(r)}
              onDelete={handleDeleteReading}
              className={mobileTab !== "history" ? "mobile-hidden" : ""}
            />

            <section className={`card guide-card ${mobileTab !== "more" ? "mobile-hidden" : ""}`}>
              <h2>{t.guideBPTitle}</h2>
              <div className="guide-grid">
                <div className="guide-item border-hypotension">
                  <strong>{getBPLabel("hypotension", lang)}</strong>
                  <span>{lang === "en" ? "< 90 or < 60 mmHg" : "< 90 o < 60 mmHg"}</span>
                </div>
                <div className="guide-item border-normal">
                  <strong>{getBPLabel("normal", lang)}</strong>
                  <span>{lang === "en" ? "< 120 and < 80 mmHg" : "< 120 y < 80 mmHg"}</span>
                </div>
                <div className="guide-item border-elevated">
                  <strong>{getBPLabel("elevated", lang)}</strong>
                  <span>{lang === "en" ? "120–129 and < 80 mmHg" : "120–129 y < 80 mmHg"}</span>
                </div>
                <div className="guide-item border-stage1">
                  <strong>{getBPLabel("stage1", lang)}</strong>
                  <span>{lang === "en" ? "130–139 or 80–89 mmHg" : "130–139 o 80–89 mmHg"}</span>
                </div>
                <div className="guide-item border-stage2">
                  <strong>{getBPLabel("stage2", lang)}</strong>
                  <span>{lang === "en" ? "≥ 140 or ≥ 90 mmHg" : "≥ 140 o ≥ 90 mmHg"}</span>
                </div>
                <div className="guide-item border-crisis">
                  <strong>{getBPLabel("crisis", lang)}</strong>
                  <span>{lang === "en" ? "> 180 and/or > 120 mmHg" : "> 180 y/o > 120 mmHg"}</span>
                </div>
              </div>
              <p className="disclaimer">
                {t.disclaimer}{" "}
                <a href="/privacy.html" target="_blank" rel="noopener noreferrer">
                  {t.privacyLink}
                </a>
              </p>
            </section>
          </>
        ) : (
          <>
            <section className="top-grid">
              <GlucoseForm
                lang={lang}
                onAddGlucose={handleAddGlucose}
                className={mobileTab !== "add" ? "mobile-hidden" : ""}
              />
              <GlucoseStatsPanel
                lang={lang}
                allReadings={allGlucoseDesc}
                rangedReadings={rangedGlucoseDesc}
                selectedRange={selectedRange}
                onRangeChange={setSelectedRange}
                className={mobileTab !== "summary" ? "mobile-hidden" : ""}
              />
            </section>

            <GlucoseTrendChart
              lang={lang}
              readings={rangedGlucoseAsc}
              className={mobileTab !== "summary" ? "mobile-hidden" : ""}
            />

            <GlucoseTable
              lang={lang}
              readings={rangedGlucoseDesc}
              onEdit={(r) => setEditingGlucose(r)}
              onDelete={handleDeleteGlucose}
              className={mobileTab !== "history" ? "mobile-hidden" : ""}
            />

            <GlucoseGuideCard
              lang={lang}
              className={mobileTab !== "more" ? "mobile-hidden" : ""}
            />
          </>
        )}

        {/* Acciones rápidas en teléfono (pestaña Más) */}
        <section
          className={`card mobile-more-card no-print ${
            mobileTab !== "more" ? "mobile-hidden" : ""
          }`}
        >
          <h2>{t.toolsTitle}</h2>
          <p className="card-subtitle">
            {t.toolsSub} {activeModule === "bp" ? t.tabBP : t.tabGlucose}
          </p>
          <div className="mobile-more-grid">
            <button type="button" className="btn btn-primary" onClick={handleShareReport}>
              <Share2 size={16} />
              {t.shareReport}
            </button>
            <button type="button" className="btn btn-outline" onClick={() => setPdfPreview(true)}>
              <FileText size={16} />
              {t.pdfPreview}
            </button>
            <button type="button" className="btn btn-outline" onClick={() => window.print()}>
              <Printer size={16} />
              {t.printPdf}
            </button>
            <button type="button" className="btn btn-outline" onClick={handleExportCsv}>
              <Download size={16} />
              {t.exportCsv}
            </button>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => setShowBackupModal(true)}
            >
              <Database size={16} />
              {t.backupJson}
            </button>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => setShowProfilesModal(true)}
            >
              <Users size={16} />
              {t.profiles}
            </button>
          </div>
          <p className="disclaimer" style={{ marginTop: "14px" }}>
            <a href="/privacy.html" target="_blank" rel="noopener noreferrer">
              {t.privacyAndMedical}
            </a>
          </p>
        </section>
      </main>

      <nav className="mobile-bottom-nav no-print">
        <button
          type="button"
          className={`nav-tab ${mobileTab === "summary" ? "active" : ""}`}
          onClick={() => setMobileTab("summary")}
        >
          <Activity size={20} />
          <span>{t.navSummary}</span>
        </button>
        <button
          type="button"
          className={`nav-tab ${mobileTab === "add" ? "active" : ""}`}
          onClick={() => setMobileTab("add")}
        >
          <PlusCircle size={20} />
          <span>{t.navAdd}</span>
        </button>
        <button
          type="button"
          className={`nav-tab ${mobileTab === "history" ? "active" : ""}`}
          onClick={() => setMobileTab("history")}
        >
          <List size={20} />
          <span>{t.navHistory}</span>
        </button>
        <button
          type="button"
          className={`nav-tab ${mobileTab === "more" ? "active" : ""}`}
          onClick={() => setMobileTab("more")}
        >
          <SlidersHorizontal size={20} />
          <span>{t.navMore}</span>
        </button>
      </nav>

      {showProfilesModal && (
        <ProfilesModal
          lang={lang}
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
          lang={lang}
          reading={editingReading}
          onSave={handleUpdateReading}
          onClose={() => setEditingReading(null)}
        />
      )}

      {editingGlucose && (
        <EditGlucoseModal
          lang={lang}
          reading={editingGlucose}
          onSave={handleUpdateGlucose}
          onClose={() => setEditingGlucose(null)}
        />
      )}

      {showBackupModal && (
        <BackupModal
          lang={lang}
          onExportJson={() => exportBackupJson(state)}
          onImportJson={handleImportJson}
          onLoadDemo={handleLoadDemo}
          onClose={() => setShowBackupModal(false)}
        />
      )}
    </>
  );
}
