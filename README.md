# PresiónVital — Control de Presión Arterial (React + Vite)

Aplicación web moderna construida con **React + Vite** para el registro, seguimiento y análisis de la presión arterial.

## Funcionalidades
- **Registro rápido**: Sistólica, diastólica, pulso, fecha/hora, brazo, postura y notas con vista previa de clasificación en tiempo real.
- **Clasificación automática (AHA / ACC & OMS)**: Hipotensión, Normal, Elevada, Hipertensión Grado 1, Hipertensión Grado 2 y Crisis Hipertensiva (con banner de alerta).
- **Resúmenes y promedios**: Última medición, promedio del período (`7`, `30`, `90` días o `Todo`), comparativa Mañana vs. Tarde/Noche y barra de distribución por categorías.
- **Gráfico de tendencia interactivo**: Evolución de sistólica, diastólica y pulso con banda de referencia normal (`<120/80 mmHg`).
- **Múltiples perfiles**: Crea y alterna perfiles para distintos familiares.
- **Exportación y respaldo**:
  - **Imprimir / PDF**: Reporte limpio formateado para llevar al médico.
  - **Exportar CSV**: Compatible con Excel.
  - **Respaldo JSON**: Exporta e importa todos tus perfiles y mediciones.

## Comandos
```powershell
npm install
npm run dev
```
Para compilar para producción:
```powershell
npm run build
```
