const LANG_KEY = "bp_lang";

export function detectInitialLang() {
  const saved = localStorage.getItem(LANG_KEY);
  if (saved === "es" || saved === "en") return saved;
  return navigator.language && navigator.language.toLowerCase().startsWith("en") ? "en" : "es";
}

export function saveLang(lang) {
  localStorage.setItem(LANG_KEY, lang);
}

export function getLocale(lang) {
  return lang === "en" ? "en-US" : "es-ES";
}

const BP_LABELS = {
  es: {
    crisis: "Crisis Hipertensiva",
    stage2: "Hipertensión Grado 2",
    stage1: "Hipertensión Grado 1",
    elevated: "Elevada",
    normal: "Normal",
    hypotension: "Hipotensión"
  },
  en: {
    crisis: "Hypertensive Crisis",
    stage2: "Hypertension Stage 2",
    stage1: "Hypertension Stage 1",
    elevated: "Elevated",
    normal: "Normal",
    hypotension: "Hypotension"
  }
};

const GLUCOSE_LABELS = {
  es: {
    severeLow: "Hipoglucemia Severa",
    low: "Hipoglucemia",
    normal: "Normal",
    elevated: "Prediabetes / Elevada",
    high: "Hiperglucemia",
    severeHigh: "Hiperglucemia Severa"
  },
  en: {
    severeLow: "Severe Hypoglycemia",
    low: "Hypoglycemia",
    normal: "Normal",
    elevated: "Prediabetes / Elevated",
    high: "Hyperglycemia",
    severeHigh: "Severe Hyperglycemia"
  }
};

const VALUE_MAP_EN = {
  Izquierdo: "Left",
  Derecho: "Right",
  Sentado: "Seated",
  Acostado: "Lying down",
  "De pie": "Standing",
  "En ayunas": "Fasting",
  Postprandial: "Postprandial",
  "Al azar": "Random"
};

export function getBPLabel(key, lang) {
  return (BP_LABELS[lang] || BP_LABELS.es)[key] || key;
}

export function getGlucoseLabel(key, lang) {
  return (GLUCOSE_LABELS[lang] || GLUCOSE_LABELS.es)[key] || key;
}

export function translateValue(val, lang) {
  if (lang === "en") return VALUE_MAP_EN[val] || val;
  return val;
}

export const STRINGS = {
  es: {
    appSubtitle: "Control Arterial y Glicemia",
    profiles: "Perfiles",
    share: "Compartir",
    shareReport: "Compartir reporte",
    pdfPreview: "Vista previa PDF",
    printPdf: "Imprimir / PDF",
    exportCsv: "Exportar CSV",
    backup: "Respaldo",
    tabBP: "Presión Arterial",
    tabGlucose: "Glicemia",
    heroBPTitle: "Control de Presión Arterial",
    heroBPDesc:
      "Registra tus mediciones diarias, visualiza tu tendencia y lleva un reporte claro a tu consulta médica.",
    heroBPTips: ["Reposa 5 min antes", "Brazo a la altura del corazón", "Pies apoyados en el suelo"],
    heroGlTitle: "Control de Glicemia",
    heroGlDesc:
      "Registra tu glucosa en ayunas o postprandial, observa tu tendencia y comparte tu reporte médico.",
    heroGlTips: ["Ayunas: 8h sin calorías", "Postprandial: 2h tras comer", "Lava y seca tus manos antes"],
    newReading: "Nuevo Registro",
    enterValues: "Ingresa valores",
    systolic: "Sistólica",
    diastolic: "Diastólica",
    pulse: "Pulso",
    dateTime: "Fecha y hora",
    arm: "Brazo",
    armLeft: "Izquierdo",
    armRight: "Derecho",
    posture: "Postura",
    postureSeated: "Sentado (en reposo)",
    postureLying: "Acostado",
    postureStanding: "De pie",
    notes: "Notas",
    notesPlaceholderBP: "Ej. En ayunas, con medicación...",
    saveReading: "Guardar Medición",
    summaryTitle: "Resumen y Promedios",
    ranges: { "7": "7 días", "30": "30 días", "90": "90 días", all: "Todo" },
    rangeLabels: {
      "7": "Últimos 7 días",
      "30": "Últimos 30 días",
      "90": "Últimos 90 días",
      all: "Historial completo"
    },
    latestReading: "Última Medición",
    noReadingsYet: "Sin registros aún",
    periodAvg: "Promedio del Período",
    noPeriodReadings: "0 mediciones en el período",
    morning: "Mañana (05:00–11:59)",
    evening: "Tarde/Noche (12:00–04:59)",
    measurements: "mediciones",
    avgPulse: "Pulso prom",
    distAHA: "Distribución según guías AHA / OMS",
    distADA: "Distribución según guías ADA / OMS",
    record: "registro",
    records: "registros",
    emptyDist: "Registra mediciones para ver la distribución por categoría.",
    trendBPTitle: "Tendencia de Presión Arterial",
    trendBPSub: "Evolución de sistólica, diastólica y banda de referencia normal (<120/80 mmHg)",
    showPulse: "Mostrar pulso",
    emptyChartBP: "Registra al menos 2 mediciones para visualizar la gráfica de tendencia.",
    historyBPTitle: "Historial de Mediciones",
    showingOf: "Mostrando {n} de {total} registros del período",
    allCategories: "Todas las categorías",
    searchNotes: "Buscar en notas...",
    noMatchingReadings: "No hay mediciones que coincidan con el filtro actual.",
    colBp: "Sistólica / Diastólica",
    colPulse: "Pulso",
    colClass: "Clasificación",
    colContext: "Contexto",
    colNotes: "Notas",
    colActions: "Acciones",
    edit: "Editar",
    del: "Eliminar",
    confirmDeleteBP: "¿Eliminar esta medición?",
    confirmDeleteGl: "¿Eliminar este registro de glicemia?",
    crisisTitle: "Atención: Lectura en rango de Crisis Hipertensiva (>180 / >120 mmHg)",
    crisisBody:
      "Si presentas síntomas como dolor de pecho, dificultad para respirar, entumecimiento o alteración visual, busca atención médica de emergencia de inmediato.",
    understood: "Entendido",
    guideBPTitle: "Guía de Referencia (AHA / ACC & OMS)",
    disclaimer:
      "Nota: Esta aplicación es una herramienta de registro personal y no sustituye el diagnóstico ni el tratamiento de un profesional de la salud.",
    privacyLink: "Política de Privacidad",
    privacyAndMedical: "Política de Privacidad y Aviso Médico",
    // Glucose
    newGlucose: "Nueva Glicemia",
    enterValue: "Ingresa valor",
    glucose: "Glucosa",
    context: "Momento",
    fasting: "En ayunas",
    postprandial: "Postprandial (2h)",
    random: "Al azar / Otro",
    notesPlaceholderGl: "Ej. Antes de desayunar, después de cena...",
    saveGlucose: "Guardar Glicemia",
    summaryGlucose: "Resumen de Glicemia",
    trendGlTitle: "Tendencia de Glicemia",
    trendGlSub: "Evolución en mg/dL con banda de referencia en ayunas (70–100 mg/dL)",
    emptyChartGl: "Registra al menos 2 mediciones de glicemia para visualizar la gráfica.",
    historyGlTitle: "Historial de Glicemia",
    allContexts: "Todos los momentos",
    noMatchingGl: "No hay mediciones de glicemia que coincidan con el filtro actual.",
    guideGlTitle: "Guía de Referencia de Glicemia (ADA / OMS)",
    // Mobile & Modals
    navSummary: "Resumen",
    navAdd: "Registrar",
    navHistory: "Historial",
    navMore: "Más",
    toolsTitle: "Herramientas y Reportes",
    toolsSub: "Comparte o exporta tus datos de",
    backupJson: "Respaldo JSON",
    pdfPreviewBar: "Vista previa del Reporte Médico (PDF)",
    printSavePdf: "Imprimir / Guardar PDF",
    exitPreview: "Salir de vista previa",
    reportTitleBP: "Reporte de Control de Presión Arterial",
    reportTitleGl: "Reporte de Control de Glicemia",
    patient: "Paciente",
    years: "años",
    period: "Período",
    generated: "Generado",
    profilesModalTitle: "Perfiles de Usuario",
    use: "Usar",
    addProfile: "Agregar nuevo perfil",
    name: "Nombre",
    ageOpt: "Edad (opcional)",
    medNotesOpt: "Notas médicas / medicación (opcional)",
    createProfile: "Crear Perfil",
    editReadingTitle: "Editar Medición",
    editGlucoseTitle: "Editar Glicemia",
    cancel: "Cancelar",
    saveChanges: "Guardar Cambios",
    backupModalTitle: "Respaldo y Datos",
    backupModalDesc:
      "Tus datos se guardan localmente en este navegador. Exporta un respaldo JSON para guardar una copia segura o transferir tus registros a otro dispositivo.",
    downloadJson: "Descargar Respaldo JSON",
    importJson: "Importar Respaldo JSON",
    demoTitle: "Datos de demostración",
    demoDesc:
      "¿Quieres probar los gráficos y reportes? Puedes cargar registros de ejemplo en el perfil activo.",
    loadDemo: "Cargar datos de ejemplo",
    copiedAlert: "Resumen del reporte copiado al portapapeles. Ya puedes pegarlo en WhatsApp o correo.",
    noExportData: "No hay mediciones en el período seleccionado para exportar.",
    noShareData: "No hay mediciones en el período seleccionado para compartir."
  },
  en: {
    appSubtitle: "Blood Pressure & Glucose Tracker",
    profiles: "Profiles",
    share: "Share",
    shareReport: "Share Report",
    pdfPreview: "PDF Preview",
    printPdf: "Print / PDF",
    exportCsv: "Export CSV",
    backup: "Backup",
    tabBP: "Blood Pressure",
    tabGlucose: "Blood Glucose",
    heroBPTitle: "Blood Pressure Tracker",
    heroBPDesc:
      "Log your daily readings, monitor trends, and share a clear medical report with your doctor.",
    heroBPTips: ["Rest 5 min before", "Arm at heart level", "Feet flat on the floor"],
    heroGlTitle: "Blood Glucose Tracker",
    heroGlDesc:
      "Log fasting or post-meal glucose, track your trends, and share your report with your doctor.",
    heroGlTips: ["Fasting: 8h without calories", "Post-meal: 2h after eating", "Wash & dry hands first"],
    newReading: "New Reading",
    enterValues: "Enter values",
    systolic: "Systolic",
    diastolic: "Diastolic",
    pulse: "Pulse",
    dateTime: "Date & time",
    arm: "Arm",
    armLeft: "Left",
    armRight: "Right",
    posture: "Posture",
    postureSeated: "Seated (at rest)",
    postureLying: "Lying down",
    postureStanding: "Standing",
    notes: "Notes",
    notesPlaceholderBP: "e.g., Fasting, after medication...",
    saveReading: "Save Reading",
    summaryTitle: "Summary & Averages",
    ranges: { "7": "7 days", "30": "30 days", "90": "90 days", all: "All" },
    rangeLabels: {
      "7": "Last 7 days",
      "30": "Last 30 days",
      "90": "Last 90 days",
      all: "Full history"
    },
    latestReading: "Latest Reading",
    noReadingsYet: "No readings yet",
    periodAvg: "Period Average",
    noPeriodReadings: "0 readings in period",
    morning: "Morning (05:00–11:59)",
    evening: "Evening/Night (12:00–04:59)",
    measurements: "readings",
    avgPulse: "Avg pulse",
    distAHA: "Distribution (AHA / WHO guidelines)",
    distADA: "Distribution (ADA / WHO guidelines)",
    record: "reading",
    records: "readings",
    emptyDist: "Log readings to see category distribution.",
    trendBPTitle: "Blood Pressure Trend",
    trendBPSub: "Systolic, diastolic and normal reference band (<120/80 mmHg)",
    showPulse: "Show pulse",
    emptyChartBP: "Log at least 2 readings to display the trend chart.",
    historyBPTitle: "Reading History",
    showingOf: "Showing {n} of {total} readings in period",
    allCategories: "All categories",
    searchNotes: "Search notes...",
    noMatchingReadings: "No readings match the current filter.",
    colBp: "Systolic / Diastolic",
    colPulse: "Pulse",
    colClass: "Category",
    colContext: "Context",
    colNotes: "Notes",
    colActions: "Actions",
    edit: "Edit",
    del: "Delete",
    confirmDeleteBP: "Delete this reading?",
    confirmDeleteGl: "Delete this glucose reading?",
    crisisTitle: "Warning: Hypertensive Crisis range (>180 / >120 mmHg)",
    crisisBody:
      "If you experience chest pain, shortness of breath, numbness, or vision changes, seek emergency medical attention immediately.",
    understood: "Got it",
    guideBPTitle: "Reference Guide (AHA / ACC & WHO)",
    disclaimer:
      "Note: This app is a personal tracking tool and does not replace diagnosis or treatment from a qualified healthcare professional.",
    privacyLink: "Privacy Policy",
    privacyAndMedical: "Privacy Policy & Medical Notice",
    // Glucose
    newGlucose: "New Glucose Reading",
    enterValue: "Enter value",
    glucose: "Glucose",
    context: "Timing",
    fasting: "Fasting",
    postprandial: "Post-meal (2h)",
    random: "Random / Other",
    notesPlaceholderGl: "e.g., Before breakfast, after dinner...",
    saveGlucose: "Save Glucose",
    summaryGlucose: "Glucose Summary",
    trendGlTitle: "Glucose Trend",
    trendGlSub: "Trend in mg/dL with fasting reference band (70–100 mg/dL)",
    emptyChartGl: "Log at least 2 glucose readings to display the trend chart.",
    historyGlTitle: "Glucose History",
    allContexts: "All timings",
    noMatchingGl: "No glucose readings match the current filter.",
    guideGlTitle: "Blood Glucose Reference Guide (ADA / WHO)",
    // Mobile & Modals
    navSummary: "Summary",
    navAdd: "Log",
    navHistory: "History",
    navMore: "More",
    toolsTitle: "Tools & Reports",
    toolsSub: "Share or export your data for",
    backupJson: "JSON Backup",
    pdfPreviewBar: "Medical Report Preview (PDF)",
    printSavePdf: "Print / Save PDF",
    exitPreview: "Exit preview",
    reportTitleBP: "Blood Pressure Control Report",
    reportTitleGl: "Blood Glucose Control Report",
    patient: "Patient",
    years: "yrs",
    period: "Period",
    generated: "Generated",
    profilesModalTitle: "User Profiles",
    use: "Use",
    addProfile: "Add new profile",
    name: "Name",
    ageOpt: "Age (optional)",
    medNotesOpt: "Medical notes / medication (optional)",
    createProfile: "Create Profile",
    editReadingTitle: "Edit Reading",
    editGlucoseTitle: "Edit Glucose Reading",
    cancel: "Cancel",
    saveChanges: "Save Changes",
    backupModalTitle: "Backup & Data",
    backupModalDesc:
      "Your data is stored locally on this device. Export a JSON backup to keep a safe copy or move your records to another device.",
    downloadJson: "Download JSON Backup",
    importJson: "Import JSON Backup",
    demoTitle: "Sample Data",
    demoDesc:
      "Want to preview charts and reports? Load sample readings into the active profile.",
    loadDemo: "Load sample data",
    copiedAlert: "Report summary copied to clipboard. You can now paste it into WhatsApp or email.",
    noExportData: "No readings in the selected period to export.",
    noShareData: "No readings in the selected period to share."
  }
};
