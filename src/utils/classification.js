export const CATEGORIES = {
  crisis: {
    key: "crisis",
    label: "Crisis Hipertensiva",
    badgeClass: "badge-crisis",
    color: "#991b1b",
    order: 5
  },
  stage2: {
    key: "stage2",
    label: "Hipertensión Grado 2",
    badgeClass: "badge-stage2",
    color: "#dc2626",
    order: 4
  },
  stage1: {
    key: "stage1",
    label: "Hipertensión Grado 1",
    badgeClass: "badge-stage1",
    color: "#ea580c",
    order: 3
  },
  elevated: {
    key: "elevated",
    label: "Elevada",
    badgeClass: "badge-elevated",
    color: "#ca8a04",
    order: 2
  },
  normal: {
    key: "normal",
    label: "Normal",
    badgeClass: "badge-normal",
    color: "#16a34a",
    order: 1
  },
  hypotension: {
    key: "hypotension",
    label: "Hipotensión",
    badgeClass: "badge-hypotension",
    color: "#0284c7",
    order: 0
  }
};

export const ORDERED_CATEGORY_KEYS = [
  "normal",
  "elevated",
  "stage1",
  "stage2",
  "crisis",
  "hypotension"
];

export function classifyBloodPressure(systolic, diastolic) {
  if (systolic > 180 || diastolic > 120) {
    return CATEGORIES.crisis;
  }
  if (systolic >= 140 || diastolic >= 90) {
    return CATEGORIES.stage2;
  }
  if ((systolic >= 130 && systolic <= 139) || (diastolic >= 80 && diastolic <= 89)) {
    return CATEGORIES.stage1;
  }
  if (systolic >= 120 && systolic <= 129 && diastolic < 80) {
    return CATEGORIES.elevated;
  }
  if (systolic < 90 || diastolic < 60) {
    return CATEGORIES.hypotension;
  }
  return CATEGORIES.normal;
}

export function validateReading(systolic, diastolic, pulse, dateTime, lang = "es") {
  const isEn = lang === "en";
  if (!Number.isFinite(systolic) || systolic < 50 || systolic > 280) {
    return isEn
      ? "Systolic pressure must be between 50 and 280 mmHg."
      : "La presión sistólica debe estar entre 50 y 280 mmHg.";
  }
  if (!Number.isFinite(diastolic) || diastolic < 30 || diastolic > 180) {
    return isEn
      ? "Diastolic pressure must be between 30 and 180 mmHg."
      : "La presión diastólica debe estar entre 30 y 180 mmHg.";
  }
  if (systolic <= diastolic) {
    return isEn
      ? "Systolic pressure must be greater than diastolic."
      : "La presión sistólica debe ser mayor que la diastólica.";
  }
  if (pulse !== null && (!Number.isFinite(pulse) || pulse < 30 || pulse > 220)) {
    return isEn
      ? "Pulse must be between 30 and 220 bpm (or leave empty)."
      : "El pulso debe estar entre 30 y 220 lpm (o déjalo vacío).";
  }
  if (!dateTime || Number.isNaN(new Date(dateTime).getTime())) {
    return isEn ? "Enter a valid date and time." : "Ingresa una fecha y hora válidas.";
  }
  return null;
}

export const GLUCOSE_CATEGORIES = {
  severeLow: {
    key: "severeLow",
    label: "Hipoglucemia Severa",
    badgeClass: "badge-crisis",
    color: "#991b1b"
  },
  low: {
    key: "low",
    label: "Hipoglucemia",
    badgeClass: "badge-hypotension",
    color: "#0284c7"
  },
  normal: {
    key: "normal",
    label: "Normal",
    badgeClass: "badge-normal",
    color: "#16a34a"
  },
  elevated: {
    key: "elevated",
    label: "Prediabetes / Elevada",
    badgeClass: "badge-elevated",
    color: "#ca8a04"
  },
  high: {
    key: "high",
    label: "Hiperglucemia",
    badgeClass: "badge-stage2",
    color: "#dc2626"
  },
  severeHigh: {
    key: "severeHigh",
    label: "Hiperglucemia Severa",
    badgeClass: "badge-crisis",
    color: "#991b1b"
  }
};

export const ORDERED_GLUCOSE_KEYS = [
  "normal",
  "elevated",
  "high",
  "severeHigh",
  "low",
  "severeLow"
];

/**
 * Clasifica la glicemia (mg/dL) según contexto (ADA / OMS).
 * @param {number} value mg/dL
 * @param {string} context "En ayunas" | "Postprandial" | "Al azar"
 */
export function classifyGlucose(value, context = "En ayunas") {
  if (value < 54) return GLUCOSE_CATEGORIES.severeLow;
  if (value < 70) return GLUCOSE_CATEGORIES.low;
  if (value >= 250) return GLUCOSE_CATEGORIES.severeHigh;

  if (context === "En ayunas") {
    if (value <= 99) return GLUCOSE_CATEGORIES.normal;
    if (value <= 125) return GLUCOSE_CATEGORIES.elevated;
    return GLUCOSE_CATEGORIES.high;
  }

  // Postprandial (2h) o Al azar
  if (value <= 139) return GLUCOSE_CATEGORIES.normal;
  if (value <= 199) return GLUCOSE_CATEGORIES.elevated;
  return GLUCOSE_CATEGORIES.high;
}

export function validateGlucose(value, dateTime, lang = "es") {
  const isEn = lang === "en";
  if (!Number.isFinite(value) || value < 20 || value > 600) {
    return isEn
      ? "Blood glucose must be between 20 and 600 mg/dL."
      : "La glicemia debe estar entre 20 y 600 mg/dL.";
  }
  if (!dateTime || Number.isNaN(new Date(dateTime).getTime())) {
    return isEn ? "Enter a valid date and time." : "Ingresa una fecha y hora válidas.";
  }
  return null;
}
