import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { Capacitor } from "@capacitor/core";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import { classifyBloodPressure, classifyGlucose } from "./classification.js";
import { getBPLabel, getGlucoseLabel, getLocale, translateValue } from "./i18n.js";

function computeBpSummary(readings) {
  const count = readings.length;
  const avgSys = Math.round(readings.reduce((s, r) => s + r.systolic, 0) / count);
  const avgDia = Math.round(readings.reduce((s, r) => s + r.diastolic, 0) / count);
  const pulseList = readings.filter((r) => r.pulse != null);
  const avgPulse = pulseList.length
    ? Math.round(pulseList.reduce((s, r) => s + r.pulse, 0) / pulseList.length)
    : null;

  const morning = readings.filter((r) => {
    const h = new Date(r.dateTime).getHours();
    return h >= 5 && h < 12;
  });
  const evening = readings.filter((r) => {
    const h = new Date(r.dateTime).getHours();
    return h < 5 || h >= 12;
  });

  const avgPair = (list) =>
    list.length
      ? `${Math.round(list.reduce((s, r) => s + r.systolic, 0) / list.length)}/${Math.round(
          list.reduce((s, r) => s + r.diastolic, 0) / list.length
        )} mmHg (${list.length})`
      : "—";

  return {
    latest: readings[0],
    avgSys,
    avgDia,
    avgPulse,
    morningText: avgPair(morning),
    eveningText: avgPair(evening)
  };
}

function computeGlucoseSummary(readings) {
  const count = readings.length;
  const avgVal = Math.round(readings.reduce((s, r) => s + r.value, 0) / count);
  const fasting = readings.filter((r) => r.context === "En ayunas");
  const post = readings.filter((r) => r.context === "Postprandial");

  const avgOne = (list) =>
    list.length
      ? `${Math.round(list.reduce((s, r) => s + r.value, 0) / list.length)} mg/dL (${list.length})`
      : "—";

  return {
    latest: readings[0],
    avgVal,
    fastingText: avgOne(fasting),
    postText: avgOne(post)
  };
}

export function buildReportPdfDoc({ module, profile, rangeLabel, readings, lang = "es" }) {
  const isEn = lang === "en";
  const locale = getLocale(lang);
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  // Top Header Band
  doc.setFillColor(13, 148, 136); // #0d9488
  doc.rect(0, 0, 210, 28, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  const title =
    module === "bp"
      ? isEn
        ? "PresiónVital — Blood Pressure Report"
        : "PresiónVital — Reporte de Presión Arterial"
      : isEn
      ? "PresiónVital — Blood Glucose Report"
      : "PresiónVital — Reporte de Glicemia";
  doc.text(title, 14, 13);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  const patientLine = `${isEn ? "Patient" : "Paciente"}: ${profile.name}${
    profile.age ? ` (${profile.age} ${isEn ? "yrs" : "años"})` : ""
  }${profile.notes ? ` · ${profile.notes}` : ""}`;
  doc.text(patientLine, 14, 21);

  const metaLine = `${isEn ? "Period" : "Período"}: ${rangeLabel}   |   ${
    isEn ? "Generated" : "Generado"
  }: ${new Date().toLocaleString(locale)}`;
  doc.setTextColor(71, 85, 105);
  doc.setFontSize(9);
  doc.text(metaLine, 14, 35);

  // Summary Box
  doc.setDrawColor(203, 213, 225);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 39, 182, 26, 2, 2, "FD");

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(9.5);

  if (module === "bp") {
    const s = computeBpSummary(readings);
    const latestCat = getBPLabel(classifyBloodPressure(s.latest.systolic, s.latest.diastolic).key, lang);
    const avgCat = getBPLabel(classifyBloodPressure(s.avgSys, s.avgDia).key, lang);
    const pulseUnit = isEn ? "bpm" : "lpm";

    doc.setFont("helvetica", "bold");
    doc.text(`${isEn ? "Latest" : "Última"}:`, 18, 47);
    doc.setFont("helvetica", "normal");
    doc.text(
      `${s.latest.systolic}/${s.latest.diastolic} mmHg${
        s.latest.pulse != null ? ` (${s.latest.pulse} ${pulseUnit})` : ""
      } · ${latestCat}`,
      42,
      47
    );

    doc.setFont("helvetica", "bold");
    doc.text(`${isEn ? "Average" : "Promedio"}:`, 18, 54);
    doc.setFont("helvetica", "normal");
    doc.text(
      `${s.avgSys}/${s.avgDia} mmHg${
        s.avgPulse != null ? ` (${s.avgPulse} ${pulseUnit})` : ""
      } · ${avgCat} (${readings.length} ${isEn ? "readings" : "med."})`,
      42,
      54
    );

    doc.setFont("helvetica", "bold");
    doc.text(`${isEn ? "Morning" : "Mañana"}:`, 18, 61);
    doc.setFont("helvetica", "normal");
    doc.text(s.morningText, 42, 61);

    doc.setFont("helvetica", "bold");
    doc.text(`${isEn ? "Evening" : "Tarde/Noche"}:`, 108, 61);
    doc.setFont("helvetica", "normal");
    doc.text(s.eveningText, 136, 61);

    // Table
    const head = isEn
      ? [["Date & Time", "Systolic / Diastolic", "Pulse", "Category", "Context", "Notes"]]
      : [["Fecha y Hora", "Sistólica / Diastólica", "Pulso", "Clasificación", "Contexto", "Notas"]];

    const body = readings.map((r) => {
      const dt = new Date(r.dateTime).toLocaleString(locale, {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
      });
      const cat = getBPLabel(classifyBloodPressure(r.systolic, r.diastolic).key, lang);
      return [
        dt,
        `${r.systolic} / ${r.diastolic} mmHg`,
        r.pulse != null ? `${r.pulse} ${pulseUnit}` : "—",
        cat,
        `${translateValue(r.arm, lang)} · ${translateValue(r.posture, lang)}`,
        r.notes || "—"
      ];
    });

    autoTable(doc, {
      startY: 71,
      head,
      body,
      styles: { fontSize: 8.5, cellPadding: 2.5 },
      headStyles: { fillColor: [13, 148, 136], textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [248, 250, 252] }
    });
  } else {
    const s = computeGlucoseSummary(readings);
    const latestCat = getGlucoseLabel(classifyGlucose(s.latest.value, s.latest.context).key, lang);

    doc.setFont("helvetica", "bold");
    doc.text(`${isEn ? "Latest" : "Última"}:`, 18, 47);
    doc.setFont("helvetica", "normal");
    doc.text(
      `${s.latest.value} mg/dL (${translateValue(s.latest.context, lang)}) · ${latestCat}`,
      42,
      47
    );

    doc.setFont("helvetica", "bold");
    doc.text(`${isEn ? "Average" : "Promedio"}:`, 18, 54);
    doc.setFont("helvetica", "normal");
    doc.text(`${s.avgVal} mg/dL (${readings.length} ${isEn ? "readings" : "med."})`, 42, 54);

    doc.setFont("helvetica", "bold");
    doc.text(`${isEn ? "Fasting" : "En ayunas"}:`, 18, 61);
    doc.setFont("helvetica", "normal");
    doc.text(s.fastingText, 42, 61);

    doc.setFont("helvetica", "bold");
    doc.text(`${isEn ? "Post-meal" : "Postprandial"}:`, 108, 61);
    doc.setFont("helvetica", "normal");
    doc.text(s.postText, 136, 61);

    const head = isEn
      ? [["Date & Time", "Glucose", "Timing", "Category", "Notes"]]
      : [["Fecha y Hora", "Glicemia", "Momento", "Clasificación", "Notas"]];

    const body = readings.map((r) => {
      const dt = new Date(r.dateTime).toLocaleString(locale, {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
      });
      const cat = getGlucoseLabel(classifyGlucose(r.value, r.context).key, lang);
      return [
        dt,
        `${r.value} mg/dL`,
        translateValue(r.context, lang),
        cat,
        r.notes || "—"
      ];
    });

    autoTable(doc, {
      startY: 71,
      head,
      body,
      styles: { fontSize: 8.5, cellPadding: 2.5 },
      headStyles: { fillColor: [99, 102, 241], textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [248, 250, 252] }
    });
  }

  // Footer Disclaimer on all pages
  const pageCount = doc.internal.getNumberOfPages();
  const disclaimer = isEn
    ? "Note: PresiónVital is a personal tracking tool and does not replace professional medical diagnosis or treatment."
    : "Nota: PresiónVital es una herramienta de registro personal y no sustituye el diagnóstico ni el tratamiento de un profesional de la salud.";

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(disclaimer, 14, 288);
    doc.text(`${i} / ${pageCount}`, 196, 288, { align: "right" });
  }

  const safeName = profile.name.toLowerCase().replace(/[^a-z0-9]+/gi, "-") || "perfil";
  const prefix =
    module === "bp"
      ? isEn
        ? "blood-pressure-report"
        : "reporte-presion-arterial"
      : isEn
      ? "blood-glucose-report"
      : "reporte-glicemia";
  const filename = `${prefix}-${safeName}.pdf`;

  return { doc, filename };
}

function arrayBufferToBase64(buffer) {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export async function downloadOrSharePdf({ module, profile, rangeLabel, readings, lang = "es", mode = "download" }) {
  const { doc, filename } = buildReportPdfDoc({ module, profile, rangeLabel, readings, lang });

  if (Capacitor.isNativePlatform()) {
    const arrayBuffer = doc.output("arraybuffer");
    const base64Data = arrayBufferToBase64(arrayBuffer);
    const saved = await Filesystem.writeFile({
      path: filename,
      data: base64Data,
      directory: Directory.Cache
    });
    await Share.share({
      title: filename,
      text:
        lang === "en"
          ? `Health report generated with PresiónVital (${profile.name})`
          : `Reporte generado con PresiónVital (${profile.name})`,
      url: saved.uri,
      dialogTitle: lang === "en" ? "Save or Share PDF Report" : "Guardar o Compartir Reporte PDF"
    });
    return { method: "native-share", filename };
  }

  if (mode === "share" && navigator.share) {
    try {
      const pdfBlob = doc.output("blob");
      const pdfFile = new File([pdfBlob], filename, { type: "application/pdf" });
      if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
        await navigator.share({
          title: filename,
          files: [pdfFile]
        });
        return { method: "web-share", filename };
      }
    } catch (err) {
      if (err && err.name === "AbortError") {
        return { method: "cancelled", filename };
      }
    }
  }

  doc.save(filename);
  return { method: "download", filename };
}
