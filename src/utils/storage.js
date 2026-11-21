import { classifyBloodPressure, classifyGlucose } from "./classification.js";
import { getBPLabel, getGlucoseLabel, getLocale, translateValue } from "./i18n.js";

const STORAGE_KEY = "bp_control_app_v1";

export function generateId(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export function toLocalDateTimeInputValue(date) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}

export function createDefaultState() {
  const defaultProfileId = generateId("prof");
  return {
    version: 1,
    activeProfileId: defaultProfileId,
    profiles: [
      {
        id: defaultProfileId,
        name: "Perfil Principal",
        age: null,
        notes: ""
      }
    ],
    readings: [],
    glucoseReadings: []
  };
}

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const fresh = createDefaultState();
      saveState(fresh);
      return fresh;
    }
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.profiles) || parsed.profiles.length === 0) {
      const fresh = createDefaultState();
      saveState(fresh);
      return fresh;
    }
    if (!Array.isArray(parsed.readings)) {
      parsed.readings = [];
    }
    if (!Array.isArray(parsed.glucoseReadings)) {
      parsed.glucoseReadings = [];
    }
    const hasActive = parsed.profiles.some((p) => p.id === parsed.activeProfileId);
    if (!hasActive) {
      parsed.activeProfileId = parsed.profiles[0].id;
    }
    return parsed;
  } catch (err) {
    console.error("Error leyendo localStorage:", err);
    return createDefaultState();
  }
}

export function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportReadingsToCsv(profile, readings, lang = "es") {
  const csvContent = buildCsvContent(profile, readings, lang);
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const safeName = profile.name.toLowerCase().replace(/[^a-z0-9]+/gi, "-");
  triggerDownload(blob, `${lang === "en" ? "blood-pressure" : "presion-arterial"}-${safeName}.csv`);
}

function buildCsvContent(profile, readings, lang = "es") {
  const isEn = lang === "en";
  const headers = isEn
    ? ["Profile", "Date & Time", "Systolic (mmHg)", "Diastolic (mmHg)", "Pulse (bpm)", "Category", "Arm", "Posture", "Notes"]
    : ["Perfil", "Fecha y Hora", "Sistolica (mmHg)", "Diastolica (mmHg)", "Pulso (lpm)", "Clasificacion", "Brazo", "Postura", "Notas"];

  const escapeCsv = (val) => {
    const str = String(val ?? "").replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = readings.map((r) => {
    const cat = classifyBloodPressure(r.systolic, r.diastolic);
    const dt = new Date(r.dateTime).toLocaleString(getLocale(lang));
    return [
      escapeCsv(profile.name),
      escapeCsv(dt),
      r.systolic,
      r.diastolic,
      r.pulse != null ? r.pulse : "",
      escapeCsv(getBPLabel(cat.key, lang)),
      escapeCsv(translateValue(r.arm, lang)),
      escapeCsv(translateValue(r.posture, lang)),
      escapeCsv(r.notes || "")
    ].join(",");
  });

  return "\uFEFF" + [headers.join(","), ...rows].join("\r\n");
}

export function buildShareableReportText(profile, rangeLabel, readings, lang = "es") {
  const isEn = lang === "en";
  const count = readings.length;
  const avgSys = Math.round(readings.reduce((s, r) => s + r.systolic, 0) / count);
  const avgDia = Math.round(readings.reduce((s, r) => s + r.diastolic, 0) / count);
  const avgCat = classifyBloodPressure(avgSys, avgDia);
  const latest = readings[0];
  const latestCat = classifyBloodPressure(latest.systolic, latest.diastolic);
  const pulseUnit = isEn ? "bpm" : "lpm";

  const lines = [
    isEn ? `Blood Pressure Report — PresiónVital` : `Reporte de Presión Arterial — PresiónVital`,
    `${isEn ? "Patient" : "Paciente"}: ${profile.name}${profile.age ? ` (${profile.age} ${isEn ? "yrs" : "años"})` : ""}`,
    profile.notes ? `${isEn ? "Medical notes" : "Notas médicas"}: ${profile.notes}` : null,
    `${isEn ? "Period" : "Período"}: ${rangeLabel} (${count} ${isEn ? "readings" : "mediciones"})`,
    ``,
    `${isEn ? "Latest reading" : "Última medición"}: ${latest.systolic}/${latest.diastolic} mmHg${
      latest.pulse != null ? ` · ${latest.pulse} ${pulseUnit}` : ""
    } (${getBPLabel(latestCat.key, lang)})`,
    `${isEn ? "Period average" : "Promedio del período"}: ${avgSys}/${avgDia} mmHg (${getBPLabel(avgCat.key, lang)})`,
    ``,
    isEn ? `Recent readings:` : `Últimos registros:`
  ].filter((l) => l !== null);

  readings.slice(0, 7).forEach((r) => {
    const dt = new Date(r.dateTime).toLocaleString(getLocale(lang), {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    });
    const cat = classifyBloodPressure(r.systolic, r.diastolic);
    lines.push(
      `• ${dt}: ${r.systolic}/${r.diastolic} mmHg${r.pulse != null ? ` (${r.pulse} ${pulseUnit})` : ""} — ${getBPLabel(cat.key, lang)}`
    );
  });

  return lines.join("\n");
}

export async function shareReport(profile, rangeLabel, readings, lang = "es") {
  const text = buildShareableReportText(profile, rangeLabel, readings, lang);
  const safeName = profile.name.toLowerCase().replace(/[^a-z0-9]+/gi, "-");
  const csvFile = new File(
    [buildCsvContent(profile, readings, lang)],
    `${lang === "en" ? "blood-pressure" : "presion-arterial"}-${safeName}.csv`,
    { type: "text/csv" }
  );

  if (navigator.share) {
    try {
      const title =
        lang === "en"
          ? `Blood Pressure Report — ${profile.name}`
          : `Reporte de Presión Arterial — ${profile.name}`;
      if (navigator.canShare && navigator.canShare({ files: [csvFile] })) {
        await navigator.share({ title, text, files: [csvFile] });
      } else {
        await navigator.share({ title, text });
      }
      return { method: "share" };
    } catch (err) {
      if (err && err.name === "AbortError") {
        return { method: "cancelled" };
      }
    }
  }

  if (navigator.clipboard && navigator.clipboard.writeText) {
    await navigator.clipboard.writeText(text);
    return { method: "clipboard" };
  }

  return { method: "unsupported", text };
}

export function exportBackupJson(state) {
  const json = JSON.stringify(state, null, 2);
  const blob = new Blob([json], { type: "application/json;charset=utf-8;" });
  const dateStr = new Date().toISOString().slice(0, 10);
  triggerDownload(blob, `respaldo-presion-vital-${dateStr}.json`);
}

export function generateDemoReadings(profileId) {
  const now = new Date();
  const samples = [
    { daysAgo: 6, hour: 8, min: 15, sys: 126, dia: 82, pulse: 74, arm: "Izquierdo", posture: "Sentado", notes: "En ayunas" },
    { daysAgo: 6, hour: 20, min: 30, sys: 132, dia: 85, pulse: 78, arm: "Izquierdo", posture: "Sentado", notes: "Después de cenar" },
    { daysAgo: 5, hour: 8, min: 5, sys: 122, dia: 79, pulse: 71, arm: "Izquierdo", posture: "Sentado", notes: "Con medicación" },
    { daysAgo: 5, hour: 19, min: 45, sys: 128, dia: 83, pulse: 76, arm: "Izquierdo", posture: "Sentado", notes: "" },
    { daysAgo: 4, hour: 7, min: 50, sys: 118, dia: 77, pulse: 69, arm: "Izquierdo", posture: "Sentado", notes: "Descansado" },
    { daysAgo: 4, hour: 21, min: 10, sys: 135, dia: 87, pulse: 81, arm: "Derecho", posture: "Sentado", notes: "Día estresante" },
    { daysAgo: 3, hour: 8, min: 20, sys: 121, dia: 78, pulse: 70, arm: "Izquierdo", posture: "Sentado", notes: "" },
    { daysAgo: 3, hour: 20, min: 0, sys: 125, dia: 81, pulse: 73, arm: "Izquierdo", posture: "Sentado", notes: "Después de caminar" },
    { daysAgo: 2, hour: 8, min: 10, sys: 117, dia: 75, pulse: 68, arm: "Izquierdo", posture: "Sentado", notes: "En ayunas" },
    { daysAgo: 2, hour: 19, min: 30, sys: 124, dia: 79, pulse: 72, arm: "Izquierdo", posture: "Sentado", notes: "" },
    { daysAgo: 1, hour: 8, min: 25, sys: 119, dia: 76, pulse: 67, arm: "Izquierdo", posture: "Sentado", notes: "Con medicación" },
    { daysAgo: 1, hour: 20, min: 15, sys: 129, dia: 82, pulse: 75, arm: "Izquierdo", posture: "Sentado", notes: "" },
    { daysAgo: 0, hour: 7, min: 40, sys: 116, dia: 74, pulse: 66, arm: "Izquierdo", posture: "Sentado", notes: "Mañana tranquila" },
    { daysAgo: 0, hour: 13, min: 20, sys: 123, dia: 79, pulse: 72, arm: "Izquierdo", posture: "Sentado", notes: "Control mediodía" }
  ];

  return samples.map((s) => {
    const d = new Date(now);
    d.setDate(d.getDate() - s.daysAgo);
    d.setHours(s.hour, s.min, 0, 0);
    return {
      id: generateId("rd"),
      profileId,
      systolic: s.sys,
      diastolic: s.dia,
      pulse: s.pulse,
      dateTime: toLocalDateTimeInputValue(d),
      arm: s.arm,
      posture: s.posture,
      notes: s.notes
    };
  });
}

function buildGlucoseCsvContent(profile, readings, lang = "es") {
  const isEn = lang === "en";
  const headers = isEn
    ? ["Profile", "Date & Time", "Glucose (mg/dL)", "Timing", "Category", "Notes"]
    : ["Perfil", "Fecha y Hora", "Glicemia (mg/dL)", "Momento", "Clasificacion", "Notas"];
  const escapeCsv = (val) => `"${String(val ?? "").replace(/"/g, '""')}"`;

  const rows = readings.map((r) => {
    const cat = classifyGlucose(r.value, r.context);
    const dt = new Date(r.dateTime).toLocaleString(getLocale(lang));
    return [
      escapeCsv(profile.name),
      escapeCsv(dt),
      r.value,
      escapeCsv(translateValue(r.context, lang)),
      escapeCsv(getGlucoseLabel(cat.key, lang)),
      escapeCsv(r.notes || "")
    ].join(",");
  });

  return "\uFEFF" + [headers.join(","), ...rows].join("\r\n");
}

export function exportGlucoseToCsv(profile, readings, lang = "es") {
  const csvContent = buildGlucoseCsvContent(profile, readings, lang);
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const safeName = profile.name.toLowerCase().replace(/[^a-z0-9]+/gi, "-");
  triggerDownload(blob, `${lang === "en" ? "blood-glucose" : "glicemia"}-${safeName}.csv`);
}

export async function shareGlucoseReport(profile, rangeLabel, readings, lang = "es") {
  const isEn = lang === "en";
  const count = readings.length;
  const avg = Math.round(readings.reduce((s, r) => s + r.value, 0) / count);
  const latest = readings[0];
  const latestCat = classifyGlucose(latest.value, latest.context);

  const lines = [
    isEn ? `Blood Glucose Report — PresiónVital` : `Reporte de Glicemia — PresiónVital`,
    `${isEn ? "Patient" : "Paciente"}: ${profile.name}${profile.age ? ` (${profile.age} ${isEn ? "yrs" : "años"})` : ""}`,
    profile.notes ? `${isEn ? "Medical notes" : "Notas médicas"}: ${profile.notes}` : null,
    `${isEn ? "Period" : "Período"}: ${rangeLabel} (${count} ${isEn ? "readings" : "mediciones"})`,
    ``,
    `${isEn ? "Latest reading" : "Última medición"}: ${latest.value} mg/dL (${translateValue(latest.context, lang)} · ${getGlucoseLabel(latestCat.key, lang)})`,
    `${isEn ? "Period average" : "Promedio del período"}: ${avg} mg/dL`,
    ``,
    isEn ? `Recent readings:` : `Últimos registros:`
  ].filter((l) => l !== null);

  readings.slice(0, 7).forEach((r) => {
    const dt = new Date(r.dateTime).toLocaleString(getLocale(lang), {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    });
    const cat = classifyGlucose(r.value, r.context);
    lines.push(
      `• ${dt}: ${r.value} mg/dL (${translateValue(r.context, lang)}) — ${getGlucoseLabel(cat.key, lang)}`
    );
  });

  const text = lines.join("\n");
  const safeName = profile.name.toLowerCase().replace(/[^a-z0-9]+/gi, "-");
  const csvFile = new File(
    [buildGlucoseCsvContent(profile, readings, lang)],
    `${lang === "en" ? "blood-glucose" : "glicemia"}-${safeName}.csv`,
    { type: "text/csv" }
  );

  if (navigator.share) {
    try {
      const title =
        lang === "en" ? `Blood Glucose Report — ${profile.name}` : `Reporte de Glicemia — ${profile.name}`;
      if (navigator.canShare && navigator.canShare({ files: [csvFile] })) {
        await navigator.share({ title, text, files: [csvFile] });
      } else {
        await navigator.share({ title, text });
      }
      return { method: "share" };
    } catch (err) {
      if (err && err.name === "AbortError") {
        return { method: "cancelled" };
      }
    }
  }

  if (navigator.clipboard && navigator.clipboard.writeText) {
    await navigator.clipboard.writeText(text);
    return { method: "clipboard" };
  }

  return { method: "unsupported", text };
}

export function generateDemoGlucoseReadings(profileId) {
  const now = new Date();
  const samples = [
    { daysAgo: 6, hour: 7, min: 30, value: 94, context: "En ayunas", notes: "Antes del desayuno" },
    { daysAgo: 6, hour: 14, min: 15, value: 132, context: "Postprandial", notes: "2h después de almorzar" },
    { daysAgo: 5, hour: 7, min: 45, value: 98, context: "En ayunas", notes: "" },
    { daysAgo: 5, hour: 21, min: 0, value: 146, context: "Postprandial", notes: "Cena rica en carbohidratos" },
    { daysAgo: 4, hour: 7, min: 20, value: 91, context: "En ayunas", notes: "Buen descanso" },
    { daysAgo: 3, hour: 7, min: 40, value: 105, context: "En ayunas", notes: "" },
    { daysAgo: 3, hour: 14, min: 30, value: 128, context: "Postprandial", notes: "Después de caminar" },
    { daysAgo: 2, hour: 7, min: 15, value: 89, context: "En ayunas", notes: "" },
    { daysAgo: 1, hour: 7, min: 50, value: 96, context: "En ayunas", notes: "En ayunas" },
    { daysAgo: 1, hour: 15, min: 10, value: 136, context: "Postprandial", notes: "" },
    { daysAgo: 0, hour: 7, min: 30, value: 92, context: "En ayunas", notes: "Control matutino" }
  ];

  return samples.map((s) => {
    const d = new Date(now);
    d.setDate(d.getDate() - s.daysAgo);
    d.setHours(s.hour, s.min, 0, 0);
    return {
      id: generateId("gl"),
      profileId,
      value: s.value,
      context: s.context,
      dateTime: toLocalDateTimeInputValue(d),
      notes: s.notes
    };
  });
}
