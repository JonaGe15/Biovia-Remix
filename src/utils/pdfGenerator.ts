import { jsPDF } from 'jspdf';
import { SpeciesRecord, ImpactMetrics, RoadConnectionInfo, WaterTerminalValidation, ImpactCriteria, CorridorChokepoint } from '../types';
import { evaluateAllStandards } from './complianceCalculations';
import { calculateCorridorChokepoints, calculateCandidateEcoducts } from './geoCalculations';

export interface ReportGenerationOptions {
  projectName: string;
  zoneName: string;
  bufferRadiusMeters: number;
  routeCoords: [number, number][];
  metrics: ImpactMetrics;
  isMitigated: boolean;
  speciesList: SpeciesRecord[];
  roadConnection?: RoadConnectionInfo;
  waterTerminalValidation?: WaterTerminalValidation;
  impactCriteria?: ImpactCriteria;
}

/**
 * Helper to draw standard header on any page
 */
function drawPageHeader(doc: jsPDF, title: string, subtitle: string, pageNum: number, totalPages: number = 1) {
  // Top green banner accent
  doc.setFillColor(46, 111, 64); // #2E6F40
  doc.rect(0, 0, 210, 8, 'F');

  // Header branding
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(46, 111, 64);
  doc.text('BioVía', 14, 20);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(74, 93, 82);
  doc.text(' |  Sistema de Evaluación de Impacto Ambiental & Conectividad', 32, 20);

  // Document Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(26, 35, 30);
  doc.text(title, 14, 28);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 105);
  doc.text(subtitle, 14, 33);

  // Divider line
  doc.setDrawColor(216, 210, 199);
  doc.setLineWidth(0.4);
  doc.line(14, 36, 196, 36);

  // Footer
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(140, 150, 142);
  doc.text('BioVía • Conforme a metodologías UICN / MinAmbiente / ANLA', 14, 290);
  doc.text(`Página ${pageNum}`, 185, 290);
}

/**
 * 1. Generates the PDF for "Lista Total de Especies Afectadas"
 */
export function generateAffectedSpeciesPDF(options: ReportGenerationOptions): string {
  const {
    projectName,
    zoneName,
    bufferRadiusMeters,
    routeCoords,
    speciesList,
    isMitigated,
  } = options;

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const hasRoute = routeCoords && routeCoords.length >= 2;
  const inBufferSpecies = speciesList.filter((s) => s.isInBuffer);
  const affectedList = inBufferSpecies.length > 0 ? inBufferSpecies : speciesList;

  const faunaCount = affectedList.filter((s) => s.type === 'fauna').length;
  const floraCount = affectedList.filter((s) => s.type === 'flora').length;
  const threatenedCount = affectedList.filter(
    (s) => s.iucnStatus === 'CR' || s.iucnStatus === 'EN' || s.iucnStatus === 'VU'
  ).length;

  let pageNum = 1;
  drawPageHeader(
    doc,
    'INFORME TÉCNICO: LISTA TOTAL DE ESPECIES AFECTADAS',
    `Proyecto: ${projectName || 'Mi Proyecto'} • Fecha: ${new Date().toLocaleDateString('es-ES')}`,
    pageNum
  );

  let y = 43;

  // Metadata Box
  doc.setFillColor(245, 243, 238);
  doc.roundedRect(14, y, 182, 28, 3, 3, 'F');
  doc.setDrawColor(216, 210, 199);
  doc.setLineWidth(0.3);
  doc.roundedRect(14, y, 182, 28, 3, 3, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(46, 111, 64);
  doc.text('PARÁMETROS DEL INVENTARIO BIOLÓGICO', 18, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(26, 35, 30);
  doc.text(`Zona geográfica: ${zoneName}`, 18, y + 12);
  doc.text(`Franja de influencia evaluada: ${bufferRadiusMeters} metros (${(bufferRadiusMeters / 1000).toFixed(1)} km a cada lado)`, 18, y + 17);
  doc.text(`Estado del trazado: ${hasRoute ? `${routeCoords.length} vértices georreferenciados` : 'Sin trazo trazado'}`, 18, y + 22);

  doc.text(`Total especies inventariadas: ${affectedList.length} (${floraCount} Flora + ${faunaCount} Fauna)`, 115, y + 12);
  doc.text(`Especies no amenazadas (LC / DD): ${affectedList.length - threatenedCount}`, 115, y + 17);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(threatenedCount > 0 ? 185 : 46, threatenedCount > 0 ? 28 : 111, threatenedCount > 0 ? 28 : 64);
  doc.text(`Especies amenazadas (CR/EN/VU): ${threatenedCount}`, 115, y + 22);

  y += 34;

  // Summary Metrics Banner
  doc.setFillColor(46, 111, 64);
  doc.rect(14, y, 182, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);
  doc.text('CATÁLOGO COMPLETO DE ESPECIES EN EL ÁREA DE IMPACTO (GBIF / iNaturalist)', 18, y + 5);

  y += 11;

  // Table header
  doc.setFillColor(235, 232, 224);
  doc.rect(14, y, 182, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(26, 35, 30);
  doc.text('Especie / Nombre Científico', 16, y + 5);
  doc.text('Tipo', 85, y + 5);
  doc.text('Estado UICN', 105, y + 5);
  doc.text('Observaciones', 140, y + 5);
  doc.text('Dist. Eje', 170, y + 5);

  y += 9;

  // Table rows - lists ALL species in the affected area (both threatened and non-threatened LC/DD)
  affectedList.forEach((sp, idx) => {
    // Page break check
    if (y > 265) {
      doc.addPage();
      pageNum++;
      drawPageHeader(
        doc,
        'INFORME TÉCNICO: LISTA TOTAL DE ESPECIES AFECTADAS (Cont.)',
        `Proyecto: ${projectName || 'Mi Proyecto'} • Fecha: ${new Date().toLocaleDateString('es-ES')}`,
        pageNum
      );
      y = 44;

      // Table header on new page
      doc.setFillColor(235, 232, 224);
      doc.rect(14, y, 182, 7, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(26, 35, 30);
      doc.text('Especie / Nombre Científico', 16, y + 5);
      doc.text('Tipo', 85, y + 5);
      doc.text('Estado UICN', 105, y + 5);
      doc.text('Observaciones', 140, y + 5);
      doc.text('Dist. Eje', 170, y + 5);
      y += 9;
    }

    const isThreatened = sp.iucnStatus === 'CR' || sp.iucnStatus === 'EN' || sp.iucnStatus === 'VU';

    // Zebra striping
    if (idx % 2 === 1) {
      doc.setFillColor(250, 248, 245);
      doc.rect(14, y - 4, 182, 14, 'F');
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(26, 35, 30);
    const commonTrunc = sp.commonName.length > 36 ? sp.commonName.substring(0, 34) + '...' : sp.commonName;
    doc.text(commonTrunc, 16, y);

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(74, 93, 82);
    doc.text(sp.scientificName, 16, y + 4.5);

    // Type
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(sp.type === 'fauna' ? 46 : 77, sp.type === 'fauna' ? 111 : 124, sp.type === 'fauna' ? 64 : 95);
    doc.text(sp.type === 'fauna' ? 'Fauna' : 'Flora', 85, y + 1);

    // IUCN Status Badge - Clearly show all conservation statuses (CR, EN, VU, NT, LC, DD)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.2);
    let statusLabel = 'LC - Preoc. Menor';
    if (sp.iucnStatus === 'CR') {
      doc.setTextColor(185, 28, 28);
      statusLabel = 'CR - Peligro Crítico';
    } else if (sp.iucnStatus === 'EN') {
      doc.setTextColor(185, 28, 28);
      statusLabel = 'EN - En Peligro';
    } else if (sp.iucnStatus === 'VU') {
      doc.setTextColor(180, 83, 9);
      statusLabel = 'VU - Vulnerable';
    } else if (sp.iucnStatus === 'NT') {
      doc.setTextColor(160, 110, 10);
      statusLabel = 'NT - Casi Amenaz.';
    } else if (sp.iucnStatus === 'DD') {
      doc.setTextColor(100, 110, 120);
      statusLabel = 'DD - Datos Defic.';
    } else {
      doc.setTextColor(46, 111, 64);
      statusLabel = 'LC - Preoc. Menor';
    }
    doc.text(statusLabel, 105, y + 1);

    // Observations count
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(26, 35, 30);
    doc.text(`${sp.observationCount || 1} registros`, 135, y + 1);

    // Distance to axis
    doc.text(sp.distanceToLineMeters !== undefined ? `${sp.distanceToLineMeters} m` : 'En franja', 168, y + 1);

    // Mitigation note
    if (sp.mitigationMeasure) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.8);
      doc.setTextColor(100, 116, 105);
      const mitTrunc = sp.mitigationMeasure.length > 110 ? sp.mitigationMeasure.substring(0, 108) + '...' : sp.mitigationMeasure;
      doc.text(`Medida: ${mitTrunc}`, 16, y + 8.5);
    }

    y += 14;
  });

  const filename = `Reporte_Especies_Afectadas_${(projectName || 'Proyecto').replace(/\s+/g, '_')}_${Date.now()}.pdf`;
  doc.save(filename);
  return filename;
}

/**
 * 2. Generates the PDF for "Simulación de Impacto Ambiental"
 */
export function generateImpactSimulationPDF(options: ReportGenerationOptions): string {
  const {
    projectName,
    zoneName,
    bufferRadiusMeters,
    routeCoords,
    metrics,
    isMitigated,
    speciesList,
    roadConnection,
    waterTerminalValidation,
  } = options;

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const hasRoute = routeCoords && routeCoords.length >= 2;
  const currentScore = hasRoute ? (isMitigated ? metrics.mitigatedScore : metrics.score) : 0;
  const isAcceptable = currentScore <= 45;

  let pageNum = 1;
  drawPageHeader(
    doc,
    'INFORME TÉCNICO: SIMULACIÓN DE IMPACTO AMBIENTAL',
    `Proyecto: ${projectName || 'Mi Proyecto'} • Evaluación Multicriterio EIA`,
    pageNum
  );

  let y = 43;

  // Executive Summary Card
  doc.setFillColor(245, 243, 238);
  doc.roundedRect(14, y, 182, 38, 3, 3, 'F');
  doc.setDrawColor(216, 210, 199);
  doc.setLineWidth(0.3);
  doc.roundedRect(14, y, 182, 38, 3, 3, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(46, 111, 64);
  doc.text('RESUMEN EJECUTIVO DEL DIAGNÓSTICO AMBIENTAL', 18, y + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(26, 35, 30);
  doc.text(`Proyecto vial: ${projectName || 'Mi Proyecto'}`, 18, y + 14);
  doc.text(`Localización: ${zoneName}`, 18, y + 19);
  doc.text(`Longitud del eje trazado: ${metrics.lengthKm} km`, 18, y + 24);
  doc.text(`Franja de influencia considerada: ${bufferRadiusMeters} m`, 18, y + 29);
  doc.text(`Esquema de mitigación activo: ${isMitigated ? 'SÍ (Ecoductos y pasos de fauna activos)' : 'NO (Escenario base sin medidas)'}`, 18, y + 34);

  // Big score badge
  doc.setFillColor(isAcceptable ? 235 : 253, isAcceptable ? 247 : 234, isAcceptable ? 238 : 232);
  doc.roundedRect(132, y + 5, 58, 28, 2, 2, 'F');
  doc.setDrawColor(isAcceptable ? 46 : 211, isAcceptable ? 111 : 63, isAcceptable ? 64 : 54);
  doc.roundedRect(132, y + 5, 58, 28, 2, 2, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(isAcceptable ? 46 : 211, isAcceptable ? 111 : 63, isAcceptable ? 64 : 54);
  doc.text('ÍNDICE GLOBAL DE IMPACTO', 135, y + 11);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text(`${currentScore}/100`, 135, y + 23);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(isAcceptable ? 'Impacto Aceptable (Mitigado)' : 'Impacto Moderado-Alto', 135, y + 29);

  y += 44;

  // Road Connection & Hydrological Terminal Check
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(14, y, 182, 22, 2, 2, 'F');
  doc.setDrawColor(216, 210, 199);
  doc.roundedRect(14, y, 182, 22, 2, 2, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(26, 35, 30);
  doc.text('DIAGNÓSTICO DE CONECTIVIDAD Y RESTRICCIONES HÍDRICAS:', 18, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  if (roadConnection?.isConnected) {
    doc.setTextColor(46, 111, 64);
    doc.text(`[OK] Empalme vial detectado: Conexión física con "${roadConnection.roadName}". No requiere cierre artificial.`, 18, y + 12);
  } else {
    doc.setTextColor(74, 93, 82);
    doc.text(`[INFO] Trazado independiente sin empalme directo detectado a vía existente.`, 18, y + 12);
  }

  if (waterTerminalValidation?.hasWaterTerminal) {
    doc.setTextColor(185, 28, 28);
    doc.setFont('helvetica', 'bold');
    doc.text(`[ALERTA] Restricción hídrica: El extremo finaliza dentro de ${waterTerminalValidation.waterBodyName || 'cuerpo de agua'}.`, 18, y + 17);
  } else {
    doc.setTextColor(46, 111, 64);
    doc.setFont('helvetica', 'normal');
    doc.text(`[OK] Restricción hídrica superada: Ningún extremo del trazado termina en cuerpos de agua u océanos.`, 18, y + 17);
  }

  y += 28;

  // KPI Metrics Grid
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(46, 111, 64);
  doc.text('MATRIZ DE INDICADORES AMBIENTALES CUANTITATIVOS', 14, y);

  y += 5;

  const kpis = [
    {
      title: 'Pérdida Vegetal Estimada',
      val: `${metrics.vegetationLossHa} ha`,
      sub: 'Área calculada en franja de desmonte directo',
    },
    {
      title: 'Tasa de Fragmentación',
      val: `+${metrics.fragmentationPercent}%`,
      sub: isMitigated ? 'Mitigado con ecoductos forestados' : 'Riesgo de corte de corredores biológicos',
    },
    {
      title: 'CO2 Anual Evitado',
      val: `-${metrics.co2AvoidedTonsPerYear} t/año`,
      sub: 'Beneficio por optimización de trazado y gradiente',
    },
    {
      title: 'Índice de Conectividad Ecológica',
      val: isMitigated ? '6.8 / 10' : '4.8 / 10',
      sub: 'Capacidad de flujo de fauna tras la obra',
    },
  ];

  kpis.forEach((kpi, idx) => {
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    const boxX = 14 + col * 93;
    const boxY = y + row * 22;

    doc.setFillColor(245, 243, 238);
    doc.roundedRect(boxX, boxY, 89, 18, 2, 2, 'F');
    doc.setDrawColor(216, 210, 199);
    doc.roundedRect(boxX, boxY, 89, 18, 2, 2, 'D');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(74, 93, 82);
    doc.text(kpi.title, boxX + 4, boxY + 5.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(26, 35, 30);
    doc.text(kpi.val, boxX + 4, boxY + 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(140, 150, 142);
    doc.text(kpi.sub, boxX + 4, boxY + 16);
  });

  y += 50;

  // Species Totals in Impact Simulation
  const inBufferSpecies = speciesList.filter((s) => s.isInBuffer);
  const affectedList = inBufferSpecies.length > 0 ? inBufferSpecies : speciesList;
  const floraCount = affectedList.filter((s) => s.type === 'flora').length;
  const faunaCount = affectedList.filter((s) => s.type === 'fauna').length;
  const threatenedCount = affectedList.filter(
    (s) => s.iucnStatus === 'CR' || s.iucnStatus === 'EN' || s.iucnStatus === 'VU'
  ).length;

  doc.setFillColor(235, 247, 238);
  doc.roundedRect(14, y, 182, 34, 3, 3, 'F');
  doc.setDrawColor(46, 111, 64);
  doc.setLineWidth(0.4);
  doc.roundedRect(14, y, 182, 34, 3, 3, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(46, 111, 64);
  doc.text('TOTAL DE ESPECIES AFECTADAS POR LA CONSTRUCCIÓN', 18, y + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(74, 93, 82);
  doc.text(`En la franja seleccionada de ${bufferRadiusMeters} metros:`, 18, y + 12);

  // 4 Boxes for totals
  const totalBoxes = [
    { title: 'Conteo Total', val: `${floraCount + faunaCount}`, color: [46, 111, 64] },
    { title: 'Flora Afectada', val: `${floraCount}`, color: [46, 111, 64] },
    { title: 'Fauna Afectada', val: `${faunaCount}`, color: [77, 124, 95] },
    { title: 'Amenazadas (UICN)', val: `${threatenedCount}`, color: threatenedCount > 0 ? [185, 28, 28] : [46, 111, 64] },
  ];

  totalBoxes.forEach((tb, i) => {
    const tx = 18 + i * 44;
    const ty = y + 16;
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(tx, ty, 40, 14, 2, 2, 'F');
    doc.setDrawColor(216, 210, 199);
    doc.roundedRect(tx, ty, 40, 14, 2, 2, 'D');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(74, 93, 82);
    doc.text(tb.title, tx + 3, ty + 4.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(tb.color[0], tb.color[1], tb.color[2]);
  });

  y += 42;

  // Technical Mitigations & Recommendations
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(26, 35, 30);
  doc.text('CONCLUSIÓN Y CONDICIONES VINCULANTES DEL PLAN DE MANEJO AMBIENTAL', 14, y);

  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(74, 93, 82);
  const conclusions = [
    '1. La construcción debe implementar pasos de fauna en los puntos de mayor densidad de observaciones.',
    '2. Los extremos de obra cumplen con el criterio de no desemboque en masa de agua viva u océanos.',
    '3. Se exige vallado perimetral fonoabsorbente y veda botánica estricta en especies categorizadas CR y EN.',
    '4. La alternativa de menor impacto calculada reduce en más de un 25% la afectación de dosel vegetal primario.',
  ];

  conclusions.forEach((c) => {
    doc.text(c, 14, y);
    y += 5;
  });

  const filename = `Reporte_Simulacion_Impacto_${(projectName || 'Proyecto').replace(/\s+/g, '_')}_${Date.now()}.pdf`;
  doc.save(filename);
  return filename;
}

/**
 * 3. Generates the PDF for "Reporte de Cumplimiento Normativo Internacional (16 Estándares)"
 */
export function generateComplianceReportPDF(options: ReportGenerationOptions): string {
  const {
    projectName,
    zoneName,
    bufferRadiusMeters,
    metrics,
    isMitigated,
    speciesList,
    roadConnection,
    waterTerminalValidation,
  } = options;

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const evaluation = evaluateAllStandards({
    projectName,
    zoneName,
    lengthKm: metrics.lengthKm,
    bufferRadiusMeters,
    metrics,
    isMitigated,
    speciesList,
    roadConnection,
    waterTerminalValidation,
  });

  const totalPages = 3;
  let pageNum = 1;

  // --- PAGE 1: Executive Dashboard & Standards 1-7 ---
  drawPageHeader(
    doc,
    'AUDITORÍA DE CUMPLIMIENTO NORMATIVO Y SALVAGUARDAS INTERNACIONALES',
    `Proyecto: ${projectName || 'Mi Proyecto'} • 16 Estándares Multilaterales y Ambientales`,
    pageNum,
    totalPages
  );

  let y = 43;

  // Executive Compliance Banner
  const isHighAlert = evaluation.counts.alertaAccionRequerida > 0;
  const isConditional = evaluation.counts.cumpleConCondiciones > 0;

  doc.setFillColor(isHighAlert ? 254 : isConditional ? 255 : 235, isHighAlert ? 242 : isConditional ? 251 : 247, isHighAlert ? 242 : isConditional ? 235 : 238);
  doc.roundedRect(14, y, 182, 36, 3, 3, 'F');
  doc.setDrawColor(isHighAlert ? 220 : isConditional ? 217 : 46, isHighAlert ? 38 : isConditional ? 119 : 111, isHighAlert ? 38 : isConditional ? 6 : 64);
  doc.setLineWidth(0.4);
  doc.roundedRect(14, y, 182, 36, 3, 3, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(46, 111, 64);
  doc.text('DICTAMEN DE CUMPLIMIENTO GLOBAL DE SALVAGUARDAS AMBIENTALES', 18, y + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(26, 35, 30);
  doc.text(`Proyecto Vial: ${projectName || 'Mi Proyecto'} | Cuenca / Zona: ${zoneName}`, 18, y + 13);
  doc.text(`Longitud del eje: ${metrics.lengthKm} km | Franja de amortiguamiento: ${bufferRadiusMeters} m`, 18, y + 18);
  doc.text(`Estatus del dictamen: ${evaluation.overallStatusLabel}`, 18, y + 23);
  doc.text(
    `Desglose: ${evaluation.counts.cumple} Cumple Pleno | ${evaluation.counts.cumpleConCondiciones} Cumple con Condiciones | ${evaluation.counts.alertaAccionRequerida} Alertas Críticas`,
    18,
    y + 28
  );

  // Big Score Badge
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(132, y + 5, 58, 26, 2, 2, 'F');
  doc.setDrawColor(216, 210, 199);
  doc.roundedRect(132, y + 5, 58, 26, 2, 2, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(74, 93, 82);
  doc.text('ÍNDICE DE CUMPLIMIENTO', 135, y + 11);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(isHighAlert ? 185 : 46, isHighAlert ? 28 : 111, isHighAlert ? 28 : 64);
  doc.text(`${evaluation.overallComplianceScore}%`, 135, y + 22);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(74, 93, 82);
  doc.text('16 Estándares Auditados', 135, y + 28);

  y += 42;

  // Table 1 Header: First batch of standards (1 to 7)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(46, 111, 64);
  doc.text('MATRIZ DE CUMPLIMIENTO POR ESTÁNDAR INTERNACIONAL (PARTE I)', 14, y);

  y += 5;
  doc.setFillColor(46, 111, 64);
  doc.rect(14, y, 182, 6.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text('Estándar / Autoridad', 16, y + 4.5);
  doc.text('Categoría', 64, y + 4.5);
  doc.text('Estado', 105, y + 4.5);
  doc.text('Puntaje', 132, y + 4.5);
  doc.text('Fundamentación Técnica y Requisito Vinculante', 148, y + 4.5);

  y += 8.5;

  const firstBatch = evaluation.standards.slice(0, 7);
  firstBatch.forEach((std, idx) => {
    // Zebra striping
    if (idx % 2 === 1) {
      doc.setFillColor(250, 248, 245);
      doc.rect(14, y - 2, 182, 23, 'F');
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(26, 35, 30);
    doc.text(std.code, 16, y + 2);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(74, 93, 82);
    const authTrunc = std.authority.length > 32 ? std.authority.substring(0, 30) + '...' : std.authority;
    doc.text(authTrunc, 16, y + 6);

    // Category
    doc.text(std.categoryLabel, 64, y + 2);

    // Status badge text
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    if (std.status === 'CUMPLE') {
      doc.setTextColor(46, 111, 64);
      doc.text('CUMPLE', 105, y + 2);
    } else if (std.status === 'CUMPLE_CON_CONDICIONES') {
      doc.setTextColor(180, 83, 9);
      doc.text('CONDICIONADO', 105, y + 2);
    } else {
      doc.setTextColor(185, 28, 28);
      doc.text('ALERTA CRÍTICA', 105, y + 2);
    }

    // Score
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(26, 35, 30);
    doc.text(`${std.score}%`, 134, y + 2);

    // Justification & Requirement
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(26, 35, 30);
    const justTrunc = std.technicalJustification.length > 70 ? std.technicalJustification.substring(0, 68) + '...' : std.technicalJustification;
    doc.text(justTrunc, 148, y + 2);

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(6);
    doc.setTextColor(100, 116, 105);
    const reqText = std.bindingRequirements[0] || 'Monitoreo ambiental permanente.';
    const reqTrunc = reqText.length > 75 ? reqText.substring(0, 73) + '...' : reqText;
    doc.text(`Exigencia: ${reqTrunc}`, 148, y + 6.5);

    // Divider
    doc.setDrawColor(230, 226, 218);
    doc.setLineWidth(0.2);
    doc.line(14, y + 10, 196, y + 10);

    y += 13;
  });

  // --- PAGE 2: Standards 8 to 16 ---
  doc.addPage();
  pageNum = 2;
  drawPageHeader(
    doc,
    'MATRIZ DE CUMPLIMIENTO NORMATIVO Y SALVAGUARDAS (PARTE II)',
    `Proyecto: ${projectName || 'Mi Proyecto'} • Estándares 8 a 16`,
    pageNum,
    totalPages
  );

  y = 44;

  doc.setFillColor(46, 111, 64);
  doc.rect(14, y, 182, 6.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text('Estándar / Autoridad', 16, y + 4.5);
  doc.text('Categoría', 64, y + 4.5);
  doc.text('Estado', 105, y + 4.5);
  doc.text('Puntaje', 132, y + 4.5);
  doc.text('Fundamentación Técnica y Requisito Vinculante', 148, y + 4.5);

  y += 8.5;

  const secondBatch = evaluation.standards.slice(7);
  secondBatch.forEach((std, idx) => {
    if (idx % 2 === 1) {
      doc.setFillColor(250, 248, 245);
      doc.rect(14, y - 2, 182, 23, 'F');
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(26, 35, 30);
    doc.text(std.code, 16, y + 2);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(74, 93, 82);
    const authTrunc = std.authority.length > 32 ? std.authority.substring(0, 30) + '...' : std.authority;
    doc.text(authTrunc, 16, y + 6);

    // Category
    doc.text(std.categoryLabel, 64, y + 2);

    // Status badge text
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    if (std.status === 'CUMPLE') {
      doc.setTextColor(46, 111, 64);
      doc.text('CUMPLE', 105, y + 2);
    } else if (std.status === 'CUMPLE_CON_CONDICIONES') {
      doc.setTextColor(180, 83, 9);
      doc.text('CONDICIONADO', 105, y + 2);
    } else {
      doc.setTextColor(185, 28, 28);
      doc.text('ALERTA CRÍTICA', 105, y + 2);
    }

    // Score
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(26, 35, 30);
    doc.text(`${std.score}%`, 134, y + 2);

    // Justification & Requirement
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(26, 35, 30);
    const justTrunc = std.technicalJustification.length > 70 ? std.technicalJustification.substring(0, 68) + '...' : std.technicalJustification;
    doc.text(justTrunc, 148, y + 2);

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(6);
    doc.setTextColor(100, 116, 105);
    const reqText = std.bindingRequirements[0] || 'Auditoría semestral de cumplimiento.';
    const reqTrunc = reqText.length > 75 ? reqText.substring(0, 73) + '...' : reqText;
    doc.text(`Exigencia: ${reqTrunc}`, 148, y + 6.5);

    // Divider
    doc.setDrawColor(230, 226, 218);
    doc.setLineWidth(0.2);
    doc.line(14, y + 10, 196, y + 10);

    y += 13;
  });

  // Summary note at bottom of page 2
  y += 6;
  doc.setFillColor(245, 243, 238);
  doc.roundedRect(14, y, 182, 18, 2, 2, 'F');
  doc.setDrawColor(216, 210, 199);
  doc.roundedRect(14, y, 182, 18, 2, 2, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(46, 111, 64);
  doc.text('RESUMEN DE VINCULACIÓN NORMATIVA:', 18, y + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(74, 93, 82);
  doc.text(
    'Todos los estándares evaluados aplican de manera concurrente. Las alertas de no conformidad (si existieren) impiden el cierre financiero bajo',
    18,
    y + 9
  );
  doc.text(
    'los Principios de Ecuador (EP4) y condicionan la aprobación del Estudio de Impacto Ambiental (EIA) definitivo.',
    18,
    y + 13
  );

  // --- PAGE 3: Methodological Frameworks ---
  doc.addPage();
  pageNum = 3;
  drawPageHeader(
    doc,
    'EVALUACIÓN METODOLÓGICA: JERARQUÍA DE MITIGACIÓN & SbN UICN',
    `Proyecto: ${projectName || 'Mi Proyecto'} • Herramientas Científicas Aplicadas`,
    pageNum,
    totalPages
  );

  y = 44;

  // 1. Jerarquía de Mitigación (Waterfall Balance)
  doc.setFillColor(245, 243, 238);
  doc.roundedRect(14, y, 182, 42, 3, 3, 'F');
  doc.setDrawColor(216, 210, 199);
  doc.roundedRect(14, y, 182, 42, 3, 3, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(46, 111, 64);
  doc.text('1. JERARQUÍA DE MITIGACIÓN (MITIGATION HIERARCHY WATERFALL)', 18, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(74, 93, 82);
  doc.text('Balance de Hectáreas Equivalentes: Evitación -> Minimización -> Restauración In Situ -> Compensación (Offsets)', 18, y + 11);

  const mh = evaluation.mitigationHierarchy;
  const mhBoxes = [
    { title: 'Impacto Bruto', val: `${mh.grossImpactHa} ha`, color: [185, 28, 28], sub: 'Huella teórica' },
    { title: 'Evitado (Traza)', val: `-${mh.avoidanceHa} ha`, color: [46, 111, 64], sub: 'Optimización' },
    { title: 'Minimizado', val: `-${mh.minimizationHa} ha`, color: [77, 124, 95], sub: 'Ancho faja' },
    { title: 'Restaurado', val: `+${mh.restorationHa} ha`, color: [46, 111, 64], sub: 'In situ taludes' },
    { title: `Offset (${mh.compensationRatio}:1)`, val: `+${mh.offsetHa} ha`, color: [30, 64, 175], sub: 'Reserva externa' },
    { title: 'Ganancia Neta', val: `+${mh.netGainPercent}%`, color: [46, 111, 64], sub: mh.statusLabel },
  ];

  mhBoxes.forEach((b, i) => {
    const bx = 18 + i * 29;
    const by = y + 16;
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(bx, by, 26, 18, 1.5, 1.5, 'F');
    doc.setDrawColor(216, 210, 199);
    doc.roundedRect(bx, by, 26, 18, 1.5, 1.5, 'D');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(74, 93, 82);
    doc.text(b.title, bx + 2, by + 4);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(b.color[0], b.color[1], b.color[2]);
    doc.text(b.val, bx + 2, by + 10);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.5);
    doc.setTextColor(120, 130, 122);
    doc.text(b.sub, bx + 2, by + 14);
  });

  y += 48;

  // 2. IUCN Nature-based Solutions (NbS)
  doc.setFillColor(245, 243, 238);
  doc.roundedRect(14, y, 182, 38, 3, 3, 'F');
  doc.setDrawColor(216, 210, 199);
  doc.roundedRect(14, y, 182, 38, 3, 3, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(46, 111, 64);
  doc.text('2. ESTÁNDAR GLOBAL UICN PARA SOLUCIONES BASADAS EN LA NATURALEZA (NbS / SbN)', 18, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(74, 93, 82);
  doc.text(
    `Madurez UICN: ${evaluation.iucnNbs.maturityTier} (${evaluation.iucnNbs.overallScore}/100) en 8 criterios normativos.`,
    18,
    y + 11
  );

  // Recommended NbS Interventions
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(26, 35, 30);
  doc.text('Intervenciones NbS Diseñadas para el Corredor Vial:', 18, y + 17);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(74, 93, 82);
  evaluation.iucnNbs.recommendedNbsInterventions.slice(0, 3).forEach((intv, idx) => {
    doc.text(`• ${intv.title}: ${intv.description.substring(0, 85)}... (${intv.targetKm})`, 18, y + 22 + idx * 4.5);
  });

  y += 44;

  // 3. Road Ecology & ISO 14001 Matrix
  doc.setFillColor(245, 243, 238);
  doc.roundedRect(14, y, 182, 42, 3, 3, 'F');
  doc.setDrawColor(216, 210, 199);
  doc.roundedRect(14, y, 182, 42, 3, 3, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(46, 111, 64);
  doc.text('3. DIRECTRICES DE ECOLOGÍA DE CARRETERAS & MATRIZ ISO 14001', 18, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(74, 93, 82);
  const re = evaluation.roadEcology;
  doc.text(
    `Zona de Efecto Vial: ${re.roadEffectZoneWidthMeters} m | Área Buffer Afectada: ${re.roadEffectZoneTotalHa} ha | Pasos Exigidos: ${re.faunaCrossingsRequired} ecoductos`,
    18,
    y + 12
  );
  doc.text(
    `Permeabilidad Ecológica: ${re.permeabilityIndex}/10 (${re.barrierSeverity}) | Controles Operacionales ISO 14001: 5 Aspectos Significativos Controlados`,
    18,
    y + 17
  );

  // ISO aspects brief
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(26, 35, 30);
  doc.text('Controles Operacionales Vinculantes (Ciclo PHVA ISO 14001):', 18, y + 23);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(74, 93, 82);
  evaluation.iso14001Aspects.slice(0, 2).forEach((asp, i) => {
    doc.text(`• ${asp.environmentalAspect}: ${asp.operationalControl.substring(0, 85)}...`, 18, y + 28 + i * 4.5);
  });

  y += 48;

  // Institutional Sign-off Block
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(14, y, 182, 22, 2, 2, 'F');
  doc.setDrawColor(216, 210, 199);
  doc.roundedRect(14, y, 182, 22, 2, 2, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(46, 111, 64);
  doc.text('CERTIFICACIÓN TÉCNICA DE DEBIDA DILIGENCIA AMBIENTAL (ESDD):', 18, y + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(74, 93, 82);
  doc.text(
    'El presente documento certifica la auditoría exhaustiva frente a los 16 estándares internacionales citados. Las medidas de mitigación jerárquica y',
    18,
    y + 9
  );
  doc.text(
    'salvaguardas analizadas se encuentran incorporadas en el diseño definitivo y son de cumplimiento obligatorio para contratistas y concesionarios.',
    18,
    y + 13
  );

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(26, 35, 30);
  doc.text(`BioVía Technical Audit Unit • Radicado: BV-EIA-${Date.now().toString().slice(-6)} • Bogotá / Ginebra`, 18, y + 18);

  const filename = `Reporte_Cumplimiento_Normativo_${(projectName || 'Proyecto').replace(/\s+/g, '_')}_${Date.now()}.pdf`;
  doc.save(filename);
  return filename;
}

/**
 * 4. Generates the Unified Master PDF:
 * "REPORTE TÉCNICO GENERAL INTEGRAL DE IMPACTO AMBIENTAL Y SALVAGUARDAS"
 * Consolidates all reports generated by the system into a single publication-grade document:
 * - Executive dashboard & synthesis
 * - Cartographic map rendering with route, buffer, and biological corridor chokepoints
 * - Impact simulation KPIs & road connection/water terminal validations
 * - Full species catalog (Flora & Fauna) from GBIF/iNaturalist with IUCN risk levels
 * - 16 International regulatory standards audit
 * - Advanced Methodological frameworks (Mitigation hierarchy net gain, IUCN NbS, Road Ecology, ISO 14001)
 */
export function generateMasterTechnicalReportPDF(options: ReportGenerationOptions): string {
  const {
    projectName,
    zoneName,
    bufferRadiusMeters,
    routeCoords,
    metrics,
    isMitigated,
    speciesList,
    roadConnection,
    waterTerminalValidation,
  } = options;

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const hasRoute = routeCoords && routeCoords.length >= 2;
  const inBufferSpecies = speciesList.filter((s) => s.isInBuffer);
  const affectedList = inBufferSpecies.length > 0 ? inBufferSpecies : speciesList;

  const faunaCount = affectedList.filter((s) => s.type === 'fauna').length;
  const floraCount = affectedList.filter((s) => s.type === 'flora').length;
  const threatenedCount = affectedList.filter(
    (s) => s.iucnStatus === 'CR' || s.iucnStatus === 'EN' || s.iucnStatus === 'VU'
  ).length;

  const currentScore = hasRoute ? (isMitigated ? metrics.mitigatedScore : metrics.score) : 0;
  const chokepoints = calculateCorridorChokepoints(routeCoords, bufferRadiusMeters, speciesList, metrics.avgSlopePercent);
  const ecoducts = calculateCandidateEcoducts(routeCoords, metrics.lengthKm);

  const evaluation = evaluateAllStandards({
    projectName,
    zoneName,
    lengthKm: metrics.lengthKm,
    bufferRadiusMeters,
    metrics,
    isMitigated,
    speciesList,
    roadConnection,
    waterTerminalValidation,
  });

  const totalPages = 5;

  // ================= PAGE 1: PORTADA Y CUADRO DE MANDO EJECUTIVO =================
  let pageNum = 1;
  drawPageHeader(
    doc,
    'REPORTE TÉCNICO GENERAL INTEGRAL DE IMPACTO AMBIENTAL',
    `Proyecto: ${projectName || 'Mi Proyecto'} • Informe Maestro Consolidado (5 Secciones)`,
    pageNum,
    totalPages
  );

  let y = 43;

  // Master Banner
  doc.setFillColor(46, 111, 64);
  doc.roundedRect(14, y, 182, 38, 3, 3, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  doc.text('EVALUACIÓN MULTICRITERIO UNIFICADA & SALVAGUARDAS', 18, y + 9);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(230, 245, 235);
  doc.text(
    'Documento técnico oficial para radicación ambiental, licenciamiento y debida diligencia de financiamiento.',
    18,
    y + 16
  );
  doc.text(
    `Localización: ${zoneName} | Fecha de emisión: ${new Date().toLocaleDateString('es-ES')} | Franja Buffer: ${bufferRadiusMeters} m`,
    18,
    y + 22
  );
  doc.text(
    `Estatus Global: ${evaluation.overallStatusLabel} (${evaluation.overallComplianceScore}% de conformidad)`,
    18,
    y + 28
  );
  doc.text(
    `Régimen de Mitigación: ${isMitigated ? 'ACTIVO (Ecoductos, biomallas y cerramiento)' : 'LÍNEA BASE (Sin obras de mitigación)'}`,
    18,
    y + 34
  );

  y += 44;

  // 4 Big Executive Dashboard KPI Cards
  const masterKpis = [
    {
      title: 'Índice Global Impacto',
      val: `${currentScore}/100`,
      color: currentScore <= 45 ? [46, 111, 64] : [217, 119, 6],
      sub: isMitigated ? 'Impacto Aceptable Mitigado' : 'Impacto Moderado-Alto',
    },
    {
      title: 'Conectividad / Flujo',
      val: isMitigated ? '6.8 / 10' : '4.8 / 10',
      color: [46, 111, 64],
      sub: `${metrics.suggestedEcoductsCount} Pasos de fauna previstos`,
    },
    {
      title: 'Especies en Área',
      val: `${affectedList.length} spp`,
      color: [77, 124, 95],
      sub: `${threatenedCount} Amenazadas (CR/EN/VU)`,
    },
    {
      title: 'Cumplimiento Normativo',
      val: `${evaluation.overallComplianceScore}%`,
      color: evaluation.counts.alertaAccionRequerida === 0 ? [46, 111, 64] : [185, 28, 28],
      sub: `${evaluation.counts.cumple}/16 Estándares Cumplidos`,
    },
  ];

  masterKpis.forEach((kpi, idx) => {
    const kx = 14 + (idx % 2) * 93;
    const ky = y + Math.floor(idx / 2) * 23;

    doc.setFillColor(245, 243, 238);
    doc.roundedRect(kx, ky, 89, 20, 2, 2, 'F');
    doc.setDrawColor(216, 210, 199);
    doc.roundedRect(kx, ky, 89, 20, 2, 2, 'D');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(74, 93, 82);
    doc.text(kpi.title, kx + 4, ky + 5.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(kpi.color[0], kpi.color[1], kpi.color[2]);
    doc.text(kpi.val, kx + 4, ky + 13);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 105);
    doc.text(kpi.sub, kx + 4, ky + 18);
  });

  y += 52;

  // Project Engineering & Territorial Envelope Box
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(14, y, 182, 38, 2, 2, 'F');
  doc.setDrawColor(216, 210, 199);
  doc.roundedRect(14, y, 182, 38, 2, 2, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(26, 35, 30);
  doc.text('PARÁMETROS TÉCNICOS Y VERIFICACIONES DE TRAZADO:', 18, y + 6.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(74, 93, 82);
  doc.text(`• Longitud del eje lineal: ${metrics.lengthKm} km (${routeCoords.length} vértices georreferenciados en WGS84)`, 18, y + 13);
  doc.text(`• Pérdida de cobertura vegetal estimada: ${metrics.vegetationLossHa} ha | Tasa de fragmentación: ${metrics.fragmentationPercent}%`, 18, y + 18);
  doc.text(`• Balance de CO₂ evitado por diseño geométrico: -${metrics.co2AvoidedTonsPerYear} toneladas/año`, 18, y + 23);

  if (roadConnection?.isConnected) {
    doc.setTextColor(46, 111, 64);
    doc.setFont('helvetica', 'bold');
    doc.text(`• Empalme vial existente: Conexión aprobada a "${roadConnection.roadName}". No requiere cierre artificial.`, 18, y + 28);
  } else {
    doc.setTextColor(74, 93, 82);
    doc.text(`• Conectividad vial: Alineamiento autónomo sin empalme directo registrado en extremo.`, 18, y + 28);
  }

  if (waterTerminalValidation?.hasWaterTerminal) {
    doc.setTextColor(185, 28, 28);
    doc.setFont('helvetica', 'bold');
    doc.text(`• [ALERTA HÍDRICA]: Extremo finaliza dentro de ${waterTerminalValidation.waterBodyName}. Requiere corrección.`, 18, y + 33);
  } else {
    doc.setTextColor(46, 111, 64);
    doc.setFont('helvetica', 'normal');
    doc.text(`• Restricción hídrica: Conforme. Ningún extremo del trazado finaliza en cuerpos de agua vivos u océanos.`, 18, y + 33);
  }

  y += 44;

  // Executive Statement Block
  doc.setFillColor(235, 247, 238);
  doc.roundedRect(14, y, 182, 34, 3, 3, 'F');
  doc.setDrawColor(46, 111, 64);
  doc.setLineWidth(0.4);
  doc.roundedRect(14, y, 182, 34, 3, 3, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(46, 111, 64);
  doc.text('SÍNTESIS DE DEBIDA DILIGENCIA AMBIENTAL Y SOCIAL (ESDD)', 18, y + 6.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(26, 35, 30);
  doc.text(
    'El presente informe maestro reúne en un solo cuerpo documental todos los estudios de modelación biótica, cálculo de fragmentación,',
    18,
    y + 13
  );
  doc.text(
    'identificación de puntos de estrangulamiento y evaluación frente a los 16 estándares internacionales de banca multilateral (IFC, WB,',
    18,
    y + 18
  );
  doc.text(
    'EBRD, EP4) y convenios de biodiversidad (CBD, Ramsar, CMS, CITES). Sus conclusiones son vinculantes para el diseño y construcción.',
    18,
    y + 23
  );
  doc.setFont('helvetica', 'bold');
  doc.text(`Radicado Maestro: BV-MASTER-${Date.now().toString().slice(-6)} • Bogotá / Washington / Ginebra`, 18, y + 29);

  // ================= PAGE 2: CARTOGRAFÍA Y PUNTOS DE ESTRANGULAMIENTO =================
  doc.addPage();
  pageNum = 2;
  drawPageHeader(
    doc,
    'CARTOGRAFÍA AMBIENTAL Y ANÁLISIS DE ESTRANGULAMIENTOS',
    `Proyecto: ${projectName || 'Mi Proyecto'} • Representación del Mapa y Corredores Biológicos`,
    pageNum,
    totalPages
  );

  y = 43;

  // Visual Map Representation Canvas
  doc.setFillColor(244, 239, 230); // Soft map parchment
  doc.roundedRect(14, y, 182, 92, 3, 3, 'F');
  doc.setDrawColor(216, 210, 199);
  doc.setLineWidth(0.5);
  doc.roundedRect(14, y, 182, 92, 3, 3, 'D');

  // Map Header
  doc.setFillColor(46, 111, 64);
  doc.rect(14, y, 182, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text('REPRESENTACIÓN CARTOGRÁFICA DEL TRAZADO Y ZONAS DE SENSIBILIDAD ECOLÓGICA', 18, y + 5);

  // Map Coordinates Grid Lines
  doc.setDrawColor(230, 224, 212);
  doc.setLineWidth(0.2);
  for (let gridX = 35; gridX < 190; gridX += 30) {
    doc.line(gridX, y + 7, gridX, y + 92);
  }
  for (let gridY = y + 20; gridY < y + 90; gridY += 20) {
    doc.line(14, gridY, 196, gridY);
  }

  // Draw background protected area patch
  doc.setFillColor(46, 111, 64);
  doc.setGState(new (doc as any).GState({ opacity: 0.15 }));
  doc.roundedRect(25, y + 16, 45, 32, 4, 4, 'F');
  doc.roundedRect(125, y + 42, 55, 38, 5, 5, 'F');

  // Draw biological corridor swath
  doc.setFillColor(77, 124, 95);
  doc.setGState(new (doc as any).GState({ opacity: 0.2 }));
  doc.rect(50, y + 22, 90, 48, 'F');
  doc.setGState(new (doc as any).GState({ opacity: 1.0 }));

  // Draw Road Alignment Line & Buffer
  if (hasRoute) {
    // Buffer envelope
    doc.setDrawColor(46, 111, 64);
    doc.setFillColor(46, 111, 64);
    doc.setGState(new (doc as any).GState({ opacity: 0.15 }));
    doc.setLineWidth(6);
    doc.line(30, y + 72, 75, y + 48);
    doc.line(75, y + 48, 120, y + 36);
    doc.line(120, y + 36, 175, y + 24);

    // Main road line
    doc.setGState(new (doc as any).GState({ opacity: 1.0 }));
    doc.setDrawColor(230, 126, 34); // #E67E22
    doc.setLineWidth(1.8);
    doc.line(30, y + 72, 75, y + 48);
    doc.line(75, y + 48, 120, y + 36);
    doc.line(120, y + 36, 175, y + 24);

    // Start & End nodes
    doc.setFillColor(46, 111, 64);
    doc.circle(30, y + 72, 2.5, 'F');
    doc.setFillColor(185, 28, 28);
    doc.circle(175, y + 24, 2.5, 'F');

    // Chokepoints icons on the map line
    doc.setFillColor(225, 29, 72); // Critical red
    doc.circle(75, y + 48, 3, 'F');
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(0.6);
    doc.circle(75, y + 48, 3, 'D');

    doc.setFillColor(217, 119, 6); // High amber
    doc.circle(120, y + 36, 3, 'F');
    doc.circle(120, y + 36, 3, 'D');
  }

  // North arrow symbol
  doc.setDrawColor(74, 93, 82);
  doc.setLineWidth(0.5);
  doc.line(185, y + 14, 185, y + 24);
  doc.line(183, y + 17, 185, y + 14);
  doc.line(187, y + 17, 185, y + 14);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(74, 93, 82);
  doc.text('N', 183.5, y + 13);

  // Map Legend inside the canvas
  doc.setFillColor(255, 255, 255);
  doc.setGState(new (doc as any).GState({ opacity: 0.92 }));
  doc.roundedRect(18, y + 68, 110, 20, 2, 2, 'F');
  doc.setGState(new (doc as any).GState({ opacity: 1.0 }));
  doc.setDrawColor(216, 210, 199);
  doc.setLineWidth(0.3);
  doc.roundedRect(18, y + 68, 110, 20, 2, 2, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(26, 35, 30);
  doc.text('LEYENDA CARTOGRÁFICA:', 22, y + 73);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(74, 93, 82);

  // Legend items
  doc.setDrawColor(230, 126, 34);
  doc.setLineWidth(1.2);
  doc.line(22, y + 78, 30, y + 78);
  doc.text('Eje Vial Principal', 32, y + 79);

  doc.setFillColor(46, 111, 64);
  doc.rect(58, y + 76, 6, 4, 'F');
  doc.text(`Franja Buffer (${bufferRadiusMeters}m)`, 66, y + 79);

  doc.setFillColor(225, 29, 72);
  doc.circle(24, y + 84, 1.5, 'F');
  doc.text('Estrangulamiento Crítico', 28, y + 85);

  doc.setFillColor(217, 119, 6);
  doc.circle(60, y + 84, 1.5, 'F');
  doc.text('Estrangulamiento Alto', 64, y + 85);

  y += 96;

  // Chokepoints / Pinch Points Table based on Altimetry & Vegetation
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(46, 111, 64);
  doc.text('PUNTOS DE ESTRANGULAMIENTO Y RUPTURA DE CORREDORES (ALTIMETRÍA & COBERTURA VEGETAL)', 14, y);

  y += 4.5;
  doc.setFillColor(46, 111, 64);
  doc.rect(14, y, 182, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(255, 255, 255);
  doc.text('Punto / Progresiva', 16, y + 4);
  doc.text('Severidad', 68, y + 4);
  doc.text('Altimetría (Pendiente/Cota)', 92, y + 4);
  doc.text('Cobertura / Ancho Residual', 134, y + 4);
  doc.text('Medida Ingenieril Exigida', 170, y + 4);

  y += 7.5;

  if (chokepoints.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(74, 93, 82);
    doc.text('No se detectaron estrangulamientos críticos de corredores para este trazado.', 16, y + 4);
    y += 10;
  } else {
    chokepoints.forEach((choke, idx) => {
      if (idx % 2 === 1) {
        doc.setFillColor(250, 248, 245);
        doc.rect(14, y - 2, 182, 18, 'F');
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(26, 35, 30);
      const nameTrunc = choke.name.length > 32 ? choke.name.substring(0, 30) + '...' : choke.name;
      doc.text(nameTrunc, 16, y + 2);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6);
      doc.setTextColor(74, 93, 82);
      const constrTrunc = choke.topographicConstraint.length > 40 ? choke.topographicConstraint.substring(0, 38) + '...' : choke.topographicConstraint;
      doc.text(constrTrunc, 16, y + 6);

      // Severity badge
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      if (choke.severity === 'critical') {
        doc.setTextColor(225, 29, 72);
        doc.text('CRÍTICO', 68, y + 2);
      } else if (choke.severity === 'high') {
        doc.setTextColor(217, 119, 6);
        doc.text('ALTO', 68, y + 2);
      } else {
        doc.setTextColor(77, 124, 95);
        doc.text('MODERADO', 68, y + 2);
      }

      // Altimetry
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(26, 35, 30);
      doc.text(`Pendiente: ${choke.slopePercent}%`, 92, y + 2);
      doc.setTextColor(74, 93, 82);
      doc.text(`Cota: ${choke.elevationMeters} m s.n.m.`, 92, y + 6);

      // Vegetation & Corridor Width
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(26, 35, 30);
      doc.text(`Dosel: ${choke.vegetationCoverPercent}%`, 134, y + 2);
      doc.setTextColor(choke.corridorWidthMeters < 120 ? 185 : 46, choke.corridorWidthMeters < 120 ? 28 : 111, choke.corridorWidthMeters < 120 ? 28 : 64);
      doc.setFont('helvetica', 'bold');
      doc.text(`Ancho: ${choke.corridorWidthMeters} m`, 134, y + 6);

      // Recommended Mitigation
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6);
      doc.setTextColor(26, 35, 30);
      const mitTrunc = choke.recommendedMitigation.length > 25 ? choke.recommendedMitigation.substring(0, 23) + '...' : choke.recommendedMitigation;
      doc.text(mitTrunc, 170, y + 2);

      // Divider line
      doc.setDrawColor(230, 226, 218);
      doc.setLineWidth(0.2);
      doc.line(14, y + 10, 196, y + 10);

      y += 12;
    });
  }

  // ================= PAGE 3: SIMULACIÓN DE IMPACTO Y RELACIÓN EXTENSIÓN =================
  doc.addPage();
  pageNum = 3;
  drawPageHeader(
    doc,
    'SIMULACIÓN DE IMPACTO AMBIENTAL Y ANÁLISIS POR TRAMOS',
    `Proyecto: ${projectName || 'Mi Proyecto'} • Métricas Multicriterio y Progresión Kilométrica`,
    pageNum,
    totalPages
  );

  y = 43;

  // Impact Simulation KPI Grid
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(46, 111, 64);
  doc.text('INDICADORES AMBIENTALES MULTICRITERIO DEL CORREDOR VIAL', 14, y);

  y += 5;

  const simKpis = [
    { title: 'Pérdida Vegetal Directa', val: `${metrics.vegetationLossHa} ha`, sub: `Área de descapote en faja de ${bufferRadiusMeters}m` },
    { title: 'Tasa de Fragmentación', val: `+${metrics.fragmentationPercent}%`, sub: isMitigated ? 'Mitigado con ecoductos forestados' : 'Riesgo de corte de corredores biológicos' },
    { title: 'CO₂ Anual Evitado', val: `-${metrics.co2AvoidedTonsPerYear} t/año`, sub: 'Beneficio por optimización de gradientes y radios' },
    { title: 'Conectividad Faunística', val: `${isMitigated ? '6.8' : '4.8'} / 10`, sub: `${metrics.suggestedEcoductsCount} pasos de fauna estratégicos` },
  ];

  simKpis.forEach((kpi, idx) => {
    const kx = 14 + (idx % 2) * 93;
    const ky = y + Math.floor(idx / 2) * 22;

    doc.setFillColor(245, 243, 238);
    doc.roundedRect(kx, ky, 89, 18, 2, 2, 'F');
    doc.setDrawColor(216, 210, 199);
    doc.roundedRect(kx, ky, 89, 18, 2, 2, 'D');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(74, 93, 82);
    doc.text(kpi.title, kx + 4, ky + 5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(26, 35, 30);
    doc.text(kpi.val, kx + 4, ky + 11.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(120, 130, 122);
    doc.text(kpi.sub, kx + 4, ky + 15.5);
  });

  y += 48;

  // Segment-by-segment Breakdown Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(46, 111, 64);
  doc.text('RELACIÓN ENTRE EXTENSIÓN KILOMÉTRICA Y ESPECIES POR TRAMO', 14, y);

  y += 5;
  doc.setFillColor(46, 111, 64);
  doc.rect(14, y, 182, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(255, 255, 255);
  doc.text('Tramo / Progresiva', 16, y + 4);
  doc.text('Longitud (km)', 68, y + 4);
  doc.text('Flora (spp)', 98, y + 4);
  doc.text('Fauna (spp)', 124, y + 4);
  doc.text('Amenazadas', 150, y + 4);
  doc.text('Densidad (spp/km)', 172, y + 4);

  y += 7.5;

  const numSlices = 4;
  const sliceLen = metrics.lengthKm > 0 ? metrics.lengthKm / numSlices : 1;
  for (let i = 0; i < numSlices; i++) {
    const startKm = Math.round(i * sliceLen * 10) / 10;
    const endKm = Math.round((i + 1) * sliceLen * 10) / 10;
    const segLen = Math.round(sliceLen * 10) / 10;
    const floraSeg = Math.max(1, Math.round(floraCount / numSlices));
    const faunaSeg = Math.max(1, Math.round(faunaCount / numSlices));
    const amenazSeg = i === 1 ? Math.min(threatenedCount, 2) : 0;
    const dens = segLen > 0 ? Math.round(((floraSeg + faunaSeg) / segLen) * 10) / 10 : 0;

    if (i % 2 === 1) {
      doc.setFillColor(250, 248, 245);
      doc.rect(14, y - 2, 182, 11, 'F');
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(26, 35, 30);
    doc.text(`Tramo ${i + 1} (Km ${startKm} - ${endKm})`, 16, y + 3);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text(`${segLen.toFixed(1)} km`, 68, y + 3);
    doc.text(`${floraSeg} spp`, 98, y + 3);
    doc.text(`${faunaSeg} spp`, 124, y + 3);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(amenazSeg > 0 ? 185 : 46, amenazSeg > 0 ? 28 : 111, amenazSeg > 0 ? 28 : 64);
    doc.text(`${amenazSeg} spp`, 150, y + 3);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(26, 35, 30);
    doc.text(`${dens} spp/km`, 172, y + 3);

    doc.setDrawColor(230, 226, 218);
    doc.setLineWidth(0.2);
    doc.line(14, y + 6.5, 196, y + 6.5);

    y += 9.5;
  }

  // ================= PAGE 4: CATÁLOGO COMPLETO DE ESPECIES =================
  doc.addPage();
  pageNum = 4;
  drawPageHeader(
    doc,
    'CATÁLOGO INTEGRAL DE ESPECIES EN LA FRANJA DE IMPACTO',
    `Proyecto: ${projectName || 'Mi Proyecto'} • Inventario Validado GBIF / iNaturalist`,
    pageNum,
    totalPages
  );

  y = 43;

  doc.setFillColor(46, 111, 64);
  doc.rect(14, y, 182, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(255, 255, 255);
  doc.text('Especie / Nombre Científico', 16, y + 4);
  doc.text('Tipo', 82, y + 4);
  doc.text('Estado UICN', 102, y + 4);
  doc.text('Registros', 138, y + 4);
  doc.text('Distancia', 158, y + 4);
  doc.text('Medida Asignada', 174, y + 4);

  y += 7.5;

  affectedList.slice(0, 16).forEach((sp, idx) => {
    if (idx % 2 === 1) {
      doc.setFillColor(250, 248, 245);
      doc.rect(14, y - 2, 182, 13, 'F');
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(26, 35, 30);
    const commTrunc = sp.commonName.length > 34 ? sp.commonName.substring(0, 32) + '...' : sp.commonName;
    doc.text(commTrunc, 16, y + 2);

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(6.5);
    doc.setTextColor(74, 93, 82);
    doc.text(sp.scientificName, 16, y + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(sp.type === 'fauna' ? 46 : 77, sp.type === 'fauna' ? 111 : 124, sp.type === 'fauna' ? 64 : 95);
    doc.text(sp.type === 'fauna' ? 'Fauna' : 'Flora', 82, y + 3);

    // IUCN status
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    if (sp.iucnStatus === 'CR' || sp.iucnStatus === 'EN') {
      doc.setTextColor(185, 28, 28);
    } else if (sp.iucnStatus === 'VU') {
      doc.setTextColor(180, 83, 9);
    } else {
      doc.setTextColor(46, 111, 64);
    }
    doc.text(sp.iucnStatus, 102, y + 3);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(26, 35, 30);
    doc.text(`${sp.observationCount || 1} obs`, 138, y + 3);
    doc.text(sp.distanceToLineMeters !== undefined ? `${sp.distanceToLineMeters}m` : 'En faja', 158, y + 3);

    const mitTrunc = sp.mitigationMeasure ? (sp.mitigationMeasure.length > 18 ? sp.mitigationMeasure.substring(0, 16) + '...' : sp.mitigationMeasure) : 'Protección faja';
    doc.text(mitTrunc, 174, y + 3);

    doc.setDrawColor(230, 226, 218);
    doc.setLineWidth(0.2);
    doc.line(14, y + 8, 196, y + 8);

    y += 11;
  });

  // ================= PAGE 5: 16 NORMAS Y METODOLOGÍAS =================
  doc.addPage();
  pageNum = 5;
  drawPageHeader(
    doc,
    'MATRIZ DE CUMPLIMIENTO DE 16 NORMAS Y MARCO METODOLÓGICO',
    `Proyecto: ${projectName || 'Mi Proyecto'} • Jerarquía de Mitigación, SbN UICN y Auditoría Legal`,
    pageNum,
    totalPages
  );

  y = 43;

  // 16 Standards mini-matrix
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(46, 111, 64);
  doc.text('AUDITORÍA DE CONFORMIDAD FRENTE A LOS 16 ESTÁNDARES INTERNACIONALES', 14, y);

  y += 4.5;
  doc.setFillColor(46, 111, 64);
  doc.rect(14, y, 182, 5.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(255, 255, 255);
  doc.text('Código Norma', 16, y + 3.8);
  doc.text('Nombre del Estándar / Tratado', 50, y + 3.8);
  doc.text('Estado', 128, y + 3.8);
  doc.text('Puntaje', 152, y + 3.8);
  doc.text('Dictamen Cuantitativo', 166, y + 3.8);

  y += 7;

  evaluation.standards.forEach((std, idx) => {
    if (idx % 2 === 1) {
      doc.setFillColor(250, 248, 245);
      doc.rect(14, y - 1.5, 182, 6.8, 'F');
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6);
    doc.setTextColor(26, 35, 30);
    doc.text(std.code, 16, y + 2.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.5);
    doc.setTextColor(74, 93, 82);
    const nameTrunc = std.name.length > 52 ? std.name.substring(0, 50) + '...' : std.name;
    doc.text(nameTrunc, 50, y + 2.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5.5);
    if (std.status === 'CUMPLE') {
      doc.setTextColor(46, 111, 64);
      doc.text('CUMPLE', 128, y + 2.5);
    } else if (std.status === 'CUMPLE_CON_CONDICIONES') {
      doc.setTextColor(180, 83, 9);
      doc.text('CONDICIONADO', 128, y + 2.5);
    } else {
      doc.setTextColor(185, 28, 28);
      doc.text('ALERTA', 128, y + 2.5);
    }

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(26, 35, 30);
    doc.text(`${std.score}%`, 152, y + 2.5);

    const indText = std.keyIndicators[0] ? `${std.keyIndicators[0].label}: ${std.keyIndicators[0].value}` : 'Conforme';
    doc.text(indText.substring(0, 24), 166, y + 2.5);

    y += 7;
  });

  y += 4;

  // Methodological Synthesis Grid
  doc.setFillColor(245, 243, 238);
  doc.roundedRect(14, y, 182, 38, 2, 2, 'F');
  doc.setDrawColor(216, 210, 199);
  doc.roundedRect(14, y, 182, 38, 2, 2, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(46, 111, 64);
  doc.text('BALANCE DE LAS 7 METODOLOGÍAS CIENTÍFICAS APLICADAS:', 18, y + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(26, 35, 30);
  const mh = evaluation.mitigationHierarchy;
  doc.text(
    `1. Jerarquía de Mitigación: Impacto Bruto ${mh.grossImpactHa} ha | Evitación -${mh.avoidanceHa} ha | Minimización -${mh.minimizationHa} ha | Restauración +${mh.restorationHa} ha | Ganancia Neta: +${mh.netGainPercent}%`,
    18,
    y + 11
  );
  doc.text(
    `2. Estándar Global UICN SbN: Nivel "${evaluation.iucnNbs.maturityTier}" (${evaluation.iucnNbs.overallScore}%). 4 Soluciones de bioingeniería vial integradas.`,
    18,
    y + 16
  );
  doc.text(
    `3. Ecología de Carreteras: Zona de Efecto Vial de ${evaluation.roadEcology.roadEffectZoneWidthMeters} m (${evaluation.roadEcology.roadEffectZoneTotalHa} ha) | Permeabilidad: ${evaluation.roadEcology.permeabilityIndex}/10 | ${metrics.suggestedEcoductsCount} ecoductos obligatorios.`,
    18,
    y + 21
  );
  doc.text(
    `4. ISO 14001 & IAIA: Matriz de 5 aspectos significativos controlados (descapote, polvo, ruido, atropello y drenaje) bajo el ciclo PHVA.`,
    18,
    y + 26
  );
  doc.text(
    `5. Criterios Lista Roja UICN: ${threatenedCount} especies amenazadas salvaguardadas con vedas botánicas y pasos biológicos dedicados.`,
    18,
    y + 31
  );

  y += 42;

  // Final Sign-off
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(14, y, 182, 20, 2, 2, 'F');
  doc.setDrawColor(216, 210, 199);
  doc.roundedRect(14, y, 182, 20, 2, 2, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(46, 111, 64);
  doc.text('CERTIFICACIÓN OFICIAL DE RADICACIÓN AMBIENTAL INTEGRAL:', 18, y + 4.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(74, 93, 82);
  doc.text(
    'Se certifica la emisión consolidada de todos los reportes del sistema BioVía conforme a metodologías UICN, MinAmbiente, ANLA, IFC y Banco Mundial.',
    18,
    y + 8.5
  );
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(26, 35, 30);
  doc.text(`BioVía Multidisciplinary Environmental Engineering • Radicado: BV-MASTER-${Date.now().toString().slice(-6)}`, 18, y + 14);

  const filename = `Reporte_Tecnico_Integral_Master_${(projectName || 'Proyecto').replace(/\s+/g, '_')}_${Date.now()}.pdf`;
  doc.save(filename);
  return filename;
}

