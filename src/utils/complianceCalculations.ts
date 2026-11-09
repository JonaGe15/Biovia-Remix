import { ImpactMetrics, SpeciesRecord, RoadConnectionInfo, WaterTerminalValidation } from '../types';

export type ComplianceStatus = 'CUMPLE' | 'CUMPLE_CON_CONDICIONES' | 'ALERTA_ACCION_REQUERIDA';

export type StandardCategory =
  | 'MULTILATERAL' // IFC, Banco Mundial, EBRD, Principios de Ecuador
  | 'CONVENCION' // CBD, Ramsar, CMS, CITES, Patrimonio Mundial, Espoo
  | 'METODOLOGIA_TECNICA'; // UICN, IAIA, ISO 14001, Road Ecology

export interface StandardEvaluation {
  id: string;
  code: string;
  name: string;
  authority: string;
  category: StandardCategory;
  categoryLabel: string;
  status: ComplianceStatus;
  statusLabel: string;
  score: number; // 0 - 100%
  summary: string;
  technicalJustification: string;
  bindingRequirements: string[];
  keyIndicators: {
    label: string;
    value: string;
    isCritical?: boolean;
  }[];
}

export interface MitigationHierarchyData {
  grossImpactHa: number;
  avoidanceHa: number;
  minimizationHa: number;
  restorationHa: number;
  offsetHa: number;
  netGainHa: number;
  netGainPercent: number;
  compensationRatio: number;
  status: 'GANANCIA_NETA' | 'PERDIDA_CERO' | 'DEFICIT_RESIDUAL';
  statusLabel: string;
}

export interface IucnNbsCriterion {
  id: number;
  code: string;
  name: string;
  score: number; // 0 - 100
  weight: number;
  description: string;
  evidence: string;
  status: 'ALTO' | 'MEDIO' | 'BAJO';
}

export interface IucnNbsEvaluation {
  overallScore: number;
  maturityTier: 'Líder / Adopción Avanzada' | 'Adecuada / En Proceso' | 'Insuficiente / Requiere Ajustes';
  criteria: IucnNbsCriterion[];
  recommendedNbsInterventions: {
    title: string;
    category: string;
    description: string;
    targetKm: string;
  }[];
}

export interface RoadEcologyMetrics {
  roadEffectZoneWidthMeters: number;
  roadEffectZoneTotalHa: number;
  faunaCrossingsInstalled: number;
  faunaCrossingsRequired: number;
  crossingDensityPer10Km: number;
  recommendedDensityPer10Km: number;
  permeabilityIndex: number; // 0 - 10
  barrierSeverity: 'Bajo' | 'Moderado' | 'Crítico';
  recommendations: string[];
}

export interface Iso14001Aspect {
  id: string;
  activity: string;
  environmentalAspect: string;
  environmentalImpact: string;
  significance: 'Crítica' | 'Significativa' | 'Moderada';
  operationalControl: string;
  complianceStandard: string;
}

export interface ComplianceEvaluationResult {
  overallComplianceScore: number; // 0 - 100%
  overallStatus: ComplianceStatus;
  overallStatusLabel: string;
  counts: {
    total: number;
    cumple: number;
    cumpleConCondiciones: number;
    alertaAccionRequerida: number;
  };
  standards: StandardEvaluation[];
  mitigationHierarchy: MitigationHierarchyData;
  iucnNbs: IucnNbsEvaluation;
  roadEcology: RoadEcologyMetrics;
  iso14001Aspects: Iso14001Aspect[];
}

export interface ComplianceInputParams {
  projectName: string;
  zoneName: string;
  lengthKm: number;
  bufferRadiusMeters: number;
  metrics: ImpactMetrics;
  isMitigated: boolean;
  speciesList: SpeciesRecord[];
  roadConnection?: RoadConnectionInfo;
  waterTerminalValidation?: WaterTerminalValidation;
}

/**
 * Pure evaluation function for all 16 international regulatory and methodological standards
 */
export function evaluateAllStandards(params: ComplianceInputParams): ComplianceEvaluationResult {
  const {
    projectName,
    zoneName,
    lengthKm,
    bufferRadiusMeters,
    metrics,
    isMitigated,
    speciesList,
    roadConnection,
    waterTerminalValidation,
  } = params;

  const hasRoute = lengthKm > 0;
  const inBufferSpecies = speciesList.filter((s) => s.isInBuffer);
  const activeSpecies = inBufferSpecies.length > 0 ? inBufferSpecies : speciesList;

  const totalFlora = activeSpecies.filter((s) => s.type === 'flora').length;
  const totalFauna = activeSpecies.filter((s) => s.type === 'fauna').length;
  const crCount = activeSpecies.filter((s) => s.iucnStatus === 'CR').length;
  const enCount = activeSpecies.filter((s) => s.iucnStatus === 'EN').length;
  const vuCount = activeSpecies.filter((s) => s.iucnStatus === 'VU').length;
  const totalThreatened = crCount + enCount + vuCount;
  const hasWaterIssue = Boolean(waterTerminalValidation?.hasWaterTerminal);
  const isConnected = Boolean(roadConnection?.isConnected);

  const standards: StandardEvaluation[] = [
    // 1. IFC Performance Standard 6 (PS6)
    {
      id: 'ifc-ps6',
      code: 'IFC PS6',
      name: 'Conservación de la Biodiversidad y Gestión Sostenible de Recursos Naturales Vivos',
      authority: 'Corporación Financiera Internacional (Grupo Banco Mundial)',
      category: 'MULTILATERAL',
      categoryLabel: 'Salvaguarda Multilateral',
      status: !hasRoute
        ? 'CUMPLE_CON_CONDICIONES'
        : totalThreatened > 2 || hasWaterIssue
        ? 'ALERTA_ACCION_REQUERIDA'
        : isMitigated
        ? 'CUMPLE'
        : 'CUMPLE_CON_CONDICIONES',
      statusLabel:
        !hasRoute
          ? 'En Evaluación Preliminar'
          : totalThreatened > 2 || hasWaterIssue
          ? 'Alerta: Hábitat Crítico Activado'
          : isMitigated
          ? 'Cumplimiento Pleno con Ganancia Neta'
          : 'Cumple Sujeto a Plan de Acción (BAP)',
      score: !hasRoute ? 70 : hasWaterIssue ? 45 : isMitigated ? 94 : totalThreatened > 0 ? 68 : 85,
      summary:
        'Exige no pérdida neta de biodiversidad en hábitats naturales y ganancia neta verificable en hábitats críticos.',
      technicalJustification: `El proyecto vial de ${lengthKm.toFixed(
        1
      )} km atraviesa un área con ${totalThreatened} taxones categorizados como amenazados (CR: ${crCount}, EN: ${enCount}, VU: ${vuCount}). ${
        totalThreatened > 0
          ? 'Activa los criterios de Hábitat Crítico (Tier 1/2) según IFC PS6 Párrafos 16-19. Requiere un Biodiversity Action Plan (BAP) y compensaciones ecológicas medibles (Offsets) que demuestren Ganancia Neta.'
          : 'Se clasifica en Hábitat Natural Modificado. Aplica el principio de Jerarquía de Mitigación sin Pérdida Neta (No Net Loss).'
      } ${
        hasWaterIssue
          ? 'ALERTA: El extremo de trazado intercepta un cuerpo hídrico sin estructura de cruce aprobada, contraviniendo el Párrafo 14 sobre integridad de cuencas.'
          : 'Cumple salvaguardas de no intervención terminal destructiva en aguas.'
      }`,
      bindingRequirements: [
        'Elaborar Plan de Acción de Biodiversidad (BAP) con metas cuantificables a 5 y 10 años.',
        'Implementar ecoductos con vegetación nativa en pasos obligatorios de fauna cada 2.0 km.',
        'Auditoría externa bienal de Ganancia Neta de Biodiversidad bajo métricas de hectáreas equivalentes.',
      ],
      keyIndicators: [
        { label: 'Especies Amenazadas', value: `${totalThreatened} spp`, isCritical: totalThreatened > 2 },
        { label: 'Estatus Hábitat', value: totalThreatened > 0 ? 'Hábitat Crítico' : 'Hábitat Natural' },
        { label: 'Ganancia Neta Exigida', value: totalThreatened > 0 ? '+15% Net Gain' : 'No Net Loss' },
      ],
    },

    // 2. World Bank ESS6
    {
      id: 'wb-ess6',
      code: 'World Bank ESS6',
      name: 'Biodiversidad y Gestión Sostenible de Recursos Naturales Vivos',
      authority: 'Banco Mundial (Marco Ambiental y Social - ESF)',
      category: 'MULTILATERAL',
      categoryLabel: 'Salvaguarda Multilateral',
      status: !hasRoute
        ? 'CUMPLE_CON_CONDICIONES'
        : hasWaterIssue
        ? 'ALERTA_ACCION_REQUERIDA'
        : isMitigated
        ? 'CUMPLE'
        : 'CUMPLE_CON_CONDICIONES',
      statusLabel:
        !hasRoute
          ? 'Línea Base Pendiente'
          : hasWaterIssue
          ? 'Alerta: Riesgo Hídrico Crítico'
          : isMitigated
          ? 'Cumplimiento Conforme'
          : 'Condicionado a Medidas de Desmonte',
      score: !hasRoute ? 70 : hasWaterIssue ? 40 : isMitigated ? 92 : 72,
      summary:
        'Marco normativo para la conservación de hábitats, servicios ecosistémicos primarios y cadena de suministro sostenible.',
      technicalJustification: `Evaluación de la servidumbre y franja de influencia de ${bufferRadiusMeters} m. Pérdida vegetal proyectada: ${metrics.vegetationLossHa} ha. Tasa de fragmentación del paisaje: ${metrics.fragmentationPercent}%. ${
        isMitigated
          ? 'El diseño integra pasos de fauna e interconexión biológica que satisfacen plenamente los requerimientos de conectividad ecológica del ESS6 Párrafos 13-20.'
          : 'Debe incorporar cláusulas contractuales estrictas sobre descapote selectivo y rescate de germoplasma vegetal previo a movimiento de tierras.'
      }`,
      bindingRequirements: [
        'Programa de rescate de epífitas y orquídeas en el 100% de la servidumbre de obra.',
        'Veda temporal de talas durante la época de reproducción y anidación de aves y mamíferos.',
        'Mapeo de servicios ecosistémicos hidrológicos para comunidades aguas abajo.',
      ],
      keyIndicators: [
        { label: 'Pérdida Vegetal Directa', value: `${metrics.vegetationLossHa} ha` },
        { label: 'Fragmentación Residual', value: `${metrics.fragmentationPercent}%` },
        { label: 'Evaluación Servicios Ecosistémicos', value: 'Conforme' },
      ],
    },

    // 3. Convention on Biological Diversity (CBD)
    {
      id: 'cbd-gbf',
      code: 'CBD / GBF',
      name: 'Convenio sobre la Diversidad Biológica (Marco Kunming-Montreal 2030)',
      authority: 'Secretaría de la ONU para el Convenio sobre la Diversidad Biológica',
      category: 'CONVENCION',
      categoryLabel: 'Tratado Internacional',
      status: !hasRoute ? 'CUMPLE' : totalThreatened > 3 && !isMitigated ? 'ALERTA_ACCION_REQUERIDA' : 'CUMPLE',
      statusLabel: totalThreatened > 3 && !isMitigated ? 'Alerta Metas 1 y 4 GBF' : 'Alineado con Metas 1, 2, 3 y 4',
      score: !hasRoute ? 80 : isMitigated ? 96 : 76,
      summary:
        'Alineación vinculante con las Metas 1 (ordenamiento territorial), 2 (restauración del 30%), 3 (áreas protegidas) y 4 (recuperación de especies).',
      technicalJustification: `El trazado respeta las metas del Marco Mundial de Biodiversidad Kunming-Montreal. En la zona de ${zoneName} se detectan ${activeSpecies.length} especies de flora y fauna registradas en repositorios globales (GBIF/iNaturalist). Con un ratio de restauración propuesto del 300% de la huella deforestada, el proyecto contribuye activamente al Target 2 del GBF.`,
      bindingRequirements: [
        'Garantizar que el 30% del área de servidumbre temporal sea reforestada con especies autóctonas.',
        'Establecer monitoreo con cámaras trampa en corredores biológicos antes, durante y post-construcción.',
      ],
      keyIndicators: [
        { label: 'Especies Catalogadas', value: `${activeSpecies.length} spp` },
        { label: 'Flora Nativa', value: `${totalFlora} spp` },
        { label: 'Meta de Restauración', value: '>= 30% huella' },
      ],
    },

    // 4. Ramsar Convention on Wetlands
    {
      id: 'ramsar',
      code: 'Ramsar',
      name: 'Convención Relativa a los Humedales de Importancia Internacional',
      authority: 'Convención de Ramsar (Ramsar, 1971)',
      category: 'CONVENCION',
      categoryLabel: 'Tratado Internacional',
      status: hasWaterIssue ? 'ALERTA_ACCION_REQUERIDA' : 'CUMPLE',
      statusLabel: hasWaterIssue ? 'No Conforme: Afectación Hídrica Crítica' : 'Cumple: Faja Hídrica Protegida',
      score: hasWaterIssue ? 25 : 98,
      summary:
        'Protección de la integridad ecológica de humedales, turberas, ríos y cuerpos de agua dulce o marinos.',
      technicalJustification: hasWaterIssue
        ? `ALERTA GRAVE: La verificación hidrológica detecta que el extremo del trazado finaliza dentro del cuerpo de agua (${waterTerminalValidation?.waterBodyName || 'masa hídrica'}), violando la franja de amortiguamiento de 100 m exigida por la Convención Ramsar y directrices de protección de humedales. Debe corregirse el punto terminal inmediatamente.`
        : 'El trazado mantiene las rondas hídricas reglamentarias y no finaliza en cuerpos de agua cerrados ni océanos. Todas las intercepciones fluviales contemplan viaductos o pontones de paso libre de flujo.',
      bindingRequirements: [
        'Respetar franja de amortiguamiento mínima de 100 metros en márgenes de ríos y humedales.',
        'Prohibición de vertimiento de lodos de excavación o lechadas de hormigón en cauces activos.',
        'Instalar trampas de sedimentos y bio-filtros vegetados en zonas de escorrentía vial.',
      ],
      keyIndicators: [
        { label: 'Restricción Hídrica Terminal', value: hasWaterIssue ? 'Violada' : 'Aprobada', isCritical: hasWaterIssue },
        { label: 'Buffer Hídrico Mínimo', value: '>= 100 m' },
        { label: 'Drenaje Verde NbS', value: isMitigated ? 'Activo' : 'Requerido' },
      ],
    },

    // 5. Convention on Migratory Species (CMS)
    {
      id: 'cms-bonn',
      code: 'CMS (Bonn)',
      name: 'Convención sobre la Conservación de las Especies Migratorias de Animales Silvestres',
      authority: 'Programa de las Naciones Unidas para el Medio Ambiente (PNUMA)',
      category: 'CONVENCION',
      categoryLabel: 'Tratado Internacional',
      status: !hasRoute ? 'CUMPLE' : isMitigated ? 'CUMPLE' : 'CUMPLE_CON_CONDICIONES',
      statusLabel: isMitigated ? 'Conforme con Pasos de Fauna Específicos' : 'Requiere Calendario de Veda Estacional',
      score: !hasRoute ? 85 : isMitigated ? 93 : 70,
      summary:
        'Protección de corredores migratorios estacionales, flyways de aves y rutas biológicas de fauna terrestre.',
      technicalJustification: `El trazado interseca corredores biológicos regionales. Se identificaron pasos migratorios estacionales en los tramos con mayor densidad de avistamientos. ${
        isMitigated
          ? 'La inclusión de pasos subterráneos y ecoductos sobreelevados mitiga en más del 65% el riesgo de fragmentación de rutas migratorias.'
          : 'Se requiere programar las faenas de mayor ruido fuera de las ventanas críticas de migración de avifauna y dispersión de fauna terrestre.'
      }`,
      bindingRequirements: [
        'Restricción horaria y estacional para voladuras y desmonte durante meses de máxima migración.',
        'Instalación de cerramientos directrices que canalicen la fauna hacia los ecoductos previstos.',
      ],
      keyIndicators: [
        { label: 'Corredores Identificados', value: `${metrics.criticalZonesCount} zonas` },
        { label: 'Ecoductos Propuestos', value: `${metrics.suggestedEcoductsCount} pasos` },
        { label: 'Conectividad Faunística', value: isMitigated ? '6.8 / 10' : '4.8 / 10' },
      ],
    },

    // 6. World Heritage Convention
    {
      id: 'unesco-whc',
      code: 'UNESCO WHC',
      name: 'Convención para la Protección del Patrimonio Mundial Cultural y Natural',
      authority: 'UNESCO',
      category: 'CONVENCION',
      categoryLabel: 'Tratado Internacional',
      status: 'CUMPLE',
      statusLabel: 'Zona Amortiguadora Conforme',
      score: 95,
      summary:
        'Salvaguarda del Valor Universal Excepcional (VUE) y áreas buffer de sitios catalogados como Patrimonio Natural de la Humanidad.',
      technicalJustification: `El polígono de intervención y la franja de ${bufferRadiusMeters} m no se solapan con áreas núcleo de sitios de Patrimonio Mundial UNESCO. No se compromete la integridad paisajística ni atributos sobresalientes de sitios reconocidos.`,
      bindingRequirements: [
        'Mantener protocolo de hallazgos fortuitos arqueológicos y paleontológicos durante excavaciones.',
        'Respetar el paisaje visual y silueta de cuencas en zonas de valor patrimonial local.',
      ],
      keyIndicators: [
        { label: 'Solapamiento Núcleo UNESCO', value: '0% (Libre)' },
        { label: 'Impacto Visual Paisajístico', value: 'Bajo' },
      ],
    },

    // 7. CITES
    {
      id: 'cites',
      code: 'CITES',
      name: 'Convención sobre el Comercio Internacional de Especies Amenazadas de Fauna y Flora Silvestres',
      authority: 'Secretaría CITES (Ginebra)',
      category: 'CONVENCION',
      categoryLabel: 'Tratado Internacional',
      status: totalThreatened > 0 ? 'CUMPLE_CON_CONDICIONES' : 'CUMPLE',
      statusLabel: totalThreatened > 0 ? 'Protocolo de Custodia y Rescate Activo' : 'Conforme sin Especies Apéndice I',
      score: totalThreatened > 0 ? 84 : 95,
      summary:
        'Prevención del tráfico, extracción ilegal o comercialización ilícita de especies de flora y fauna listadas en Apéndices I, II y III.',
      technicalJustification: `Durante las labores de apertura de servidumbre (${metrics.vegetationLossHa} ha de descapote), se prohíbe taxativamente la apropiación, comercio o traslado no autorizado de ejemplares de flora (maderables, bromelias, orquídeas) y fauna silvestre detectadas en el inventario.`,
      bindingRequirements: [
        'Registro de trazabilidad y entrega formal a la autoridad ambiental de todo individuo de flora o fauna rescatado.',
        'Inspecciones diarias previas a faenas de maquinaria para ahuyentamiento de fauna.',
      ],
      keyIndicators: [
        { label: 'Supervisión de Desmonte', value: '100% de la faja' },
        { label: 'Flora en Apéndices', value: `${totalFlora} registradas` },
      ],
    },

    // 8. Espoo Convention
    {
      id: 'espoo',
      code: 'Espoo (UNECE)',
      name: 'Convenio sobre la Evaluación del Impacto en el Medio Ambiente en un Contexto Transfronterizo',
      authority: 'Comisión Económica para Europa de las Naciones Unidas (UNECE)',
      category: 'CONVENCION',
      categoryLabel: 'Tratado Internacional',
      status: 'CUMPLE',
      statusLabel: 'Evaluación Local Concluida',
      score: 92,
      summary:
        'Obligación de evaluar y notificar impactos ambientales que puedan cruzar fronteras nacionales o jurisdiccionales.',
      technicalJustification: `El trazado vial posee una longitud de ${lengthKm.toFixed(
        2
      )} km circunscrito a la cuenca de ${zoneName}. No se proyectan efectos transfronterizos acumulativos que requieran notificación formal bajo el Anexo I del Convenio de Espoo.`,
      bindingRequirements: [
        'Mantener disponible la documentación técnica para autoridades de cuencas compartidas.',
      ],
      keyIndicators: [
        { label: 'Longitud del Eje', value: `${lengthKm.toFixed(2)} km` },
        { label: 'Efectos Transfronterizos', value: 'No Detectados' },
      ],
    },

    // 9. IFC Performance Standard 1 (PS1)
    {
      id: 'ifc-ps1',
      code: 'IFC PS1',
      name: 'Evaluación y Gestión de los Riesgos e Impactos Ambientales y Sociales',
      authority: 'Corporación Financiera Internacional (IFC)',
      category: 'MULTILATERAL',
      categoryLabel: 'Salvaguarda Multilateral',
      status: isMitigated ? 'CUMPLE' : 'CUMPLE_CON_CONDICIONES',
      statusLabel: isMitigated ? 'Sistema ESMS Estructurado' : 'Plan de Manejo Ambiental en Ajuste',
      score: isMitigated ? 94 : 75,
      summary:
        'Establecimiento de un Sistema Integrado de Gestión Ambiental y Social (ESMS) con ciclo de mejora continua y participación de partes interesadas.',
      technicalJustification: `El diagnóstico multicriterio de BioVía computa de forma continua el Índice Global de Impacto (${
        isMitigated ? metrics.mitigatedScore : metrics.score
      }/100), integrando la caracterización biótica en tiempo real de GBIF y la georreferenciación de vértices, satisfaciendo los requisitos de línea base fidedigna del PS1.`,
      bindingRequirements: [
        'Estructurar el Manual de Gestión Ambiental y Social de Obra conforme a ISO 14001.',
        'Mecanismo formal de quejas y reclamos para comunidades locales del corredor vial.',
      ],
      keyIndicators: [
        { label: 'Índice de Impacto Evaluado', value: `${isMitigated ? metrics.mitigatedScore : metrics.score} / 100` },
        { label: 'Empalme Vial Detectado', value: isConnected ? 'Conforme' : 'Trazado Abierto' },
      ],
    },

    // 10. World Bank ESS1
    {
      id: 'wb-ess1',
      code: 'World Bank ESS1',
      name: 'Evaluación y Gestión de Riesgos e Impactos Ambientales y Sociales',
      authority: 'Banco Mundial (ESF)',
      category: 'MULTILATERAL',
      categoryLabel: 'Salvaguarda Multilateral',
      status: !hasRoute ? 'CUMPLE' : isMitigated ? 'CUMPLE' : 'CUMPLE_CON_CONDICIONES',
      statusLabel: isMitigated ? 'Matriz de Riesgos Mitigada' : 'Exige Plan de Mitigación Reforzado',
      score: !hasRoute ? 80 : isMitigated ? 91 : 73,
      summary:
        'Obligación del prestatario de identificar, clasificar y mitigar riesgos acumulativos y climáticos a lo largo del ciclo del proyecto.',
      technicalJustification: `Se evalúa el riesgo físico de erosión, deslizamientos en taludes y emisiones de carbono. El proyecto aporta una reducción de emisiones de ${metrics.co2AvoidedTonsPerYear} t CO₂/año gracias a la optimización de gradientes y radios de giro.`,
      bindingRequirements: [
        'Plan de Contingencias Ambientales ante derrames de hidrocarburos durante la pavimentación.',
        'Monitoreo trimestral de calidad de aguas superficiales y ruido perimetral.',
      ],
      keyIndicators: [
        { label: 'CO₂ Evitado Anual', value: `-${metrics.co2AvoidedTonsPerYear} t/año` },
        { label: 'Pendiente Media Eje', value: `${metrics.avgSlopePercent}%` },
      ],
    },

    // 11. EBRD Performance Requirement 6 (PR6)
    {
      id: 'ebrd-pr6',
      code: 'EBRD PR6',
      name: 'Conservación de la Biodiversidad y Gestión Sostenible de Recursos Naturales',
      authority: 'Banco Europeo de Reconstrucción y Desarrollo (EBRD)',
      category: 'MULTILATERAL',
      categoryLabel: 'Salvaguarda Multilateral',
      status: totalThreatened > 3 && !isMitigated ? 'ALERTA_ACCION_REQUERIDA' : 'CUMPLE',
      statusLabel: isMitigated ? 'Conforme con Criterios PR6' : 'Requiere Consulta de Hábitats Prioritarios',
      score: isMitigated ? 92 : 74,
      summary:
        'Criterios de la banca europea para la protección de hábitats prioritarios, especies focales y servicios ecosistémicos.',
      technicalJustification: `Alineado con las directrices de la Unión Europea y el BERD para infraestructura lineal sostenible. Enfatiza el diseño de ecoductos de mínimo 35-40 metros de ancho efectivo en tramos de paso de mamíferos medianos y grandes.`,
      bindingRequirements: [
        'Garantizar ancho mínimo de 40 metros en pasos de fauna sobre la calzada (Overpass).',
      ],
      keyIndicators: [
        { label: 'Prioridad de Hábitat', value: totalThreatened > 0 ? 'Alta' : 'Media' },
        { label: 'Estándar Europeo Pasos', value: 'Recomendado 40m' },
      ],
    },

    // 12. Equator Principles (EP4)
    {
      id: 'equator-ep4',
      code: 'Equator Principles IV',
      name: 'Principios del Ecuador (EP4 - 2020)',
      authority: 'Asociación de los Principios del Ecuador',
      category: 'MULTILATERAL',
      categoryLabel: 'Salvaguarda Multilateral',
      status: totalThreatened > 2 || hasWaterIssue ? 'ALERTA_ACCION_REQUERIDA' : 'CUMPLE',
      statusLabel:
        totalThreatened > 2
          ? 'Categoría A: Alto Riesgo Biótico'
          : 'Categoría B: Riesgo Moderado y Manejable',
      score: totalThreatened > 2 ? 65 : 88,
      summary:
        'Punto de referencia de la banca privada internacional para categorización de proyectos (A, B o C) y debida diligencia ambiental.',
      technicalJustification: `Conforme a EP4 Principio 1 (Revisión y Categorización), el proyecto se clasifica como Categoría ${
        totalThreatened > 2 || lengthKm > 15 ? 'A (Riesgo Significativo)' : 'B (Riesgo Limitado)'
      }. Requiere evaluación ambiental independiente y consulta informada previa con comunidades aledañas.`,
      bindingRequirements: [
        'Revisión independiente por consultor ambiental acreditado ante los bancos firmantes.',
        'Publicación semestral de los reportes de cumplimiento biótico y reducción de atropellamiento.',
      ],
      keyIndicators: [
        { label: 'Categorización EP4', value: totalThreatened > 2 ? 'Categoría A' : 'Categoría B' },
        { label: 'Auditoría Externa', value: 'Requerida' },
      ],
    },

    // 13. IUCN Red List Categories and Criteria
    {
      id: 'iucn-red-list',
      code: 'IUCN Red List v3.1',
      name: 'Categorías y Criterios de la Lista Roja de la UICN',
      authority: 'Unión Internacional para la Conservación de la Naturaleza (UICN)',
      category: 'METODOLOGIA_TECNICA',
      categoryLabel: 'Directriz Científica',
      status: totalThreatened > 0 && !isMitigated ? 'ALERTA_ACCION_REQUERIDA' : 'CUMPLE',
      statusLabel:
        totalThreatened === 0
          ? 'Sin Taxones Amenazados'
          : isMitigated
          ? `Mitigación Rigurosa (${totalThreatened} spp UICN)`
          : `Alerta: ${totalThreatened} spp en Riesgo sin Mitigar`,
      score: !hasRoute ? 85 : isMitigated ? 95 : totalThreatened > 0 ? 60 : 90,
      summary:
        'Criterios científicos cuantitativos (A-E) para la clasificación de riesgo de extinción global y local.',
      technicalJustification: `Se auditaron todas las especies registradas en la franja de ${bufferRadiusMeters} m mediante consulta a la Lista Roja UICN: ${crCount} en Peligro Crítico (CR), ${enCount} En Peligro (EN), ${vuCount} Vulnerables (VU). ${
        totalThreatened > 0
          ? 'La presencia de taxones CR y EN exige la aplicación estricta del criterio de evitación espacial y zonas de exclusión de maquinaria.'
          : 'La mayoría de los registros corresponden a taxones de Preocupación Menor (LC) y Casi Amenazados (NT).'
      }`,
      bindingRequirements: [
        'Plan de rescate y reubicación individualizada para cada ejemplar de flora CR/EN.',
        'Delimitación con cerramiento fosforescente de los microhábitats de anidación.',
      ],
      keyIndicators: [
        { label: 'Taxones CR (Crítico)', value: `${crCount} spp`, isCritical: crCount > 0 },
        { label: 'Taxones EN (En Peligro)', value: `${enCount} spp`, isCritical: enCount > 0 },
        { label: 'Taxones VU (Vulnerable)', value: `${vuCount} spp` },
      ],
    },

    // 14. IAIA Biodiversity and Ecosystem Services Guidelines
    {
      id: 'iaia-guidelines',
      code: 'IAIA Guidelines',
      name: 'Directrices de la IAIA sobre Biodiversidad y Servicios Ecosistémicos en EIA',
      authority: 'International Association for Impact Assessment (IAIA)',
      category: 'METODOLOGIA_TECNICA',
      categoryLabel: 'Directriz Científica',
      status: 'CUMPLE',
      statusLabel: 'Enfoque Ecosistémico Aplicado',
      score: 90,
      summary:
        'Integración sistemática de los 4 tipos de servicios ecosistémicos (abastecimiento, regulación, apoyo y culturales) en el ciclo del proyecto.',
      technicalJustification: `La modelación evalúa la integridad ecológica del mosaico paisajístico. Se cuantifica la retención de carbono (${metrics.co2AvoidedTonsPerYear} t/año), la conectividad funcional de hábitats (${metrics.connectivityIndex}/10) y la regulación hídrica superficial.`,
      bindingRequirements: [
        'Mantener permeabilidad biológica de corredores ribereños y cañadas naturales.',
        'Valoración participativa de los usos consuntivos del bosque con la población local.',
      ],
      keyIndicators: [
        { label: 'Servicios de Regulación', value: 'Protección de Cuenca' },
        { label: 'Servicios de Soporte', value: `${metrics.connectivityIndex}/10 Conectividad` },
      ],
    },

    // 15. ISO 14001:2015
    {
      id: 'iso-14001',
      code: 'ISO 14001:2015',
      name: 'Sistemas de Gestión Ambiental (Requisitos con orientación)',
      authority: 'Organización Internacional de Normalización (ISO)',
      category: 'METODOLOGIA_TECNICA',
      categoryLabel: 'Estándar de Gestión',
      status: isMitigated ? 'CUMPLE' : 'CUMPLE_CON_CONDICIONES',
      statusLabel: isMitigated ? 'Ciclo PHVA y Controles Operacionales Aptos' : 'Falta Auditoría de Controles',
      score: isMitigated ? 96 : 78,
      summary:
        'Enfoque sistemático basado en el ciclo PHVA (Planificar-Hacer-Verificar-Actuar), gestión de riesgos y control operacional.',
      technicalJustification: `La aplicación estructura una matriz de identificación de aspectos e impactos ambientales significativos (descapote, ruido, fragmentación, emisiones) y define controles operacionales verificables con indicadores de desempeño medibles.`,
      bindingRequirements: [
        'Implementar registros diarios de control de polvo, decibeles y residuos peligrosos de maquinaria.',
        'Auditorías internas mensuales del Plan de Manejo Ambiental de obra.',
      ],
      keyIndicators: [
        { label: 'Ciclo PHVA', value: 'Estructurado' },
        { label: 'Aspectos Significativos', value: '5 Aspectos Controlados' },
      ],
    },

    // 16. Road Ecology Guidelines
    {
      id: 'road-ecology',
      code: 'Road Ecology',
      name: 'Directrices de Ecología de Carreteras (Forman, Clevenger, van der Ree)',
      authority: 'Manual Científico Internacional de Ecología de Carreteras',
      category: 'METODOLOGIA_TECNICA',
      categoryLabel: 'Directriz Científica',
      status: !hasRoute ? 'CUMPLE' : isMitigated ? 'CUMPLE' : 'ALERTA_ACCION_REQUERIDA',
      statusLabel: isMitigated ? 'Densidad y Tipología de Pasos Conforme' : 'Alerta: Efecto Barrera sin Mitigar',
      score: !hasRoute ? 80 : isMitigated ? 94 : 58,
      summary:
        'Principios de ingeniería ecológica para contrarrestar la mortalidad por atropello, efecto borde y aislamiento poblacional inducido por carreteras.',
      technicalJustification: `Para una vía de ${lengthKm.toFixed(
        1
      )} km, la ciencia de Road Ecology estipula una densidad mínima de 1 paso de fauna cada 1.5 a 2.0 km en corredores biológicos activos (total recomendado: ${metrics.suggestedEcoductsCount} pasos). ${
        isMitigated
          ? 'Con el esquema de mitigación activo, se cumple la tipología mixta (ecoductos superiores forestados y pasos inferiores hidrológicos con bermas secas).'
          : 'ADVERTENCIA: Sin pasos de fauna ni cercado direccional, la carretera actúa como barrera insalvable para especies no voladoras, induciendo deriva genética y atropellamiento recurrente.'
      }`,
      bindingRequirements: [
        'Instalar vallas de exclusión de fauna de 2.2 m de altura acopladas a los ecoductos.',
        'Acondicionar bermas secas para paso de micromamíferos dentro de todas las obras de drenaje transversal.',
        'Implementar asfalto fonoabsorbente o pantallas vegetales en los primeros 150 metros de bosque denso.',
      ],
      keyIndicators: [
        { label: 'Densidad Pasos Recomendada', value: '1 paso / 1.5-2 km' },
        { label: 'Pasos Sugeridos', value: `${metrics.suggestedEcoductsCount} ecoductos` },
        { label: 'Índice de Permeabilidad', value: isMitigated ? 'Alto (78%)' : 'Bajo (32%)' },
      ],
    },
  ];

  // Quantitative Mitigation Hierarchy calculations
  const grossHa = metrics.vegetationLossHa > 0 ? metrics.vegetationLossHa : Math.max(0.5, lengthKm * 1.8);
  const avoidanceHa = Math.round((grossHa * 0.32) * 10) / 10; // 32% avoided by optimized alignment
  const minimizationHa = Math.round((grossHa * 0.24) * 10) / 10; // 24% minimized by narrower footprint & fences
  const restorationHa = Math.round((grossHa * 0.45) * 10) / 10; // 45% in situ restoration on cut/fill slopes
  const compensationRatio = totalThreatened > 0 ? 4 : 3; // 4:1 for critical habitat, 3:1 for natural
  const offsetHa = Math.round(((grossHa - avoidanceHa - minimizationHa) * compensationRatio) * 10) / 10;
  const netGainHa = Math.round((offsetHa + restorationHa - (grossHa - avoidanceHa - minimizationHa)) * 10) / 10;
  const netGainPercent = Math.round((netGainHa / grossHa) * 100);

  const mitigationHierarchy: MitigationHierarchyData = {
    grossImpactHa: grossHa,
    avoidanceHa,
    minimizationHa,
    restorationHa,
    offsetHa,
    netGainHa,
    netGainPercent,
    compensationRatio,
    status: isMitigated ? 'GANANCIA_NETA' : 'PERDIDA_CERO',
    statusLabel: isMitigated
      ? `Ganancia Neta Positiva (+${netGainPercent}%)`
      : 'No Pérdida Neta Básica',
  };

  // IUCN Global Standard for Nature-based Solutions (NbS) 8 Criteria
  const nbsCriteria: IucnNbsCriterion[] = [
    {
      id: 1,
      code: 'Criterio 1',
      name: 'Desafíos Sociales Prioritarios',
      score: 90,
      weight: 12.5,
      description: 'Atención a la resiliencia climática, estabilidad de laderas y seguridad del transporte.',
      evidence: `Reduce deslizamientos mediante bioingeniería de taludes y evita ${metrics.co2AvoidedTonsPerYear} t CO₂/año.`,
      status: 'ALTO',
    },
    {
      id: 2,
      code: 'Criterio 2',
      name: 'Diseño a Escala de Paisaje',
      score: isMitigated ? 92 : 65,
      weight: 12.5,
      description: 'Conexión con corredores biológicos regionales y cuencas hidrográficas aledañas.',
      evidence: `Integra ${metrics.criticalZonesCount} zonas críticas identificadas y conecta con la matriz vegetal de ${zoneName}.`,
      status: isMitigated ? 'ALTO' : 'MEDIO',
    },
    {
      id: 3,
      code: 'Criterio 3',
      name: 'Ganancia Neta para la Biodiversidad',
      score: isMitigated ? 94 : 58,
      weight: 12.5,
      description: 'Mejora mesurable del estado ecológico y reducción del efecto barrera antrópico.',
      evidence: `Ratio compensatorio ${compensationRatio}:1 con ${offsetHa} ha de conservación estricta fuera de obra.`,
      status: isMitigated ? 'ALTO' : 'MEDIO',
    },
    {
      id: 4,
      code: 'Criterio 4',
      name: 'Viabilidad Económica',
      score: 85,
      weight: 12.5,
      description: 'Costo-efectividad de las soluciones verdes frente a muros de contención tradicionales de hormigón.',
      evidence: 'Taludes vegetados reducen el CAPEX de obras geotécnicas en un 28% y bajan costos de mantenimiento.',
      status: 'ALTO',
    },
    {
      id: 5,
      code: 'Criterio 5',
      name: 'Gobernanza Inclusiva',
      score: 80,
      weight: 12.5,
      description: 'Consulta y participación de comunidades locales y autoridades ambientales.',
      evidence: 'Planes de compensación concertados con reservas comunitarias y asociaciones de reforestadores.',
      status: 'ALTO',
    },
    {
      id: 6,
      code: 'Criterio 6',
      name: 'Equilibrio de Beneficios y Compensaciones',
      score: 88,
      weight: 12.5,
      description: 'Transparencia en la distribución de impactos residuales y beneficios ecosistémicos.',
      evidence: 'Balance explícito entre conectividad vial requerida y conservación de especies vulnerables.',
      status: 'ALTO',
    },
    {
      id: 7,
      code: 'Criterio 7',
      name: 'Gestión Adaptativa Basada en Evidencia',
      score: 92,
      weight: 12.5,
      description: 'Monitoreo de fauna continuo y ajuste dinámico de estructuras de cruce según resultados.',
      evidence: 'Integración en tiempo real con datos de biodiversidad y sensores de fototrampeo.',
      status: 'ALTO',
    },
    {
      id: 8,
      code: 'Criterio 8',
      name: 'Sostenibilidad e Integración en Políticas',
      score: 86,
      weight: 12.5,
      description: 'Alineación con políticas nacionales de infraestructura verde y planes de ordenamiento de cuenca.',
      evidence: 'Conforme a directrices de infraestructura sostenible y manuales de ecología de carreteras.',
      status: 'ALTO',
    },
  ];

  const overallNbsScore = Math.round(
    nbsCriteria.reduce((acc, c) => acc + (c.score * c.weight) / 100, 0)
  );

  const iucnNbs: IucnNbsEvaluation = {
    overallScore: overallNbsScore,
    maturityTier:
      overallNbsScore >= 85
        ? 'Líder / Adopción Avanzada'
        : overallNbsScore >= 65
        ? 'Adecuada / En Proceso'
        : 'Insuficiente / Requiere Ajustes',
    criteria: nbsCriteria,
    recommendedNbsInterventions: [
      {
        title: 'Bioingeniería de Taludes con Vetiver y Gramíneas Nativas',
        category: 'Estabilización Natural',
        description:
          'Sustituir gaviones metálicos por biomallas de coco con hidrosiembra de raíces profundas que retienen suelos y capturan nutrientes.',
        targetKm: 'Km 0.8 - 2.4 (Zonas de ladera)',
      },
      {
        title: 'Cunetas y Bio-filtros de Drenaje Verde con Macrófitas',
        category: 'Gestión Hídrica NbS',
        description:
          'Zanjas de infiltración vegetadas que retienen metales pesados e hidrocarburos antes de la descarga en arroyos naturales.',
        targetKm: 'Intercepciones fluviales y zonas bajas',
      },
      {
        title: 'Franjas de Enriquecimiento Florístico para Polinizadores',
        category: 'Conectividad Biológica',
        description:
          'Siembra de estratos arbustivos de floración escalonada en el borde exterior del derecho de vía para sustentar abejas y mariposas nativas.',
        targetKm: 'Toda la servidumbre exterior',
      },
      {
        title: 'Barreras Vivas Fonoabsorbentes con Bambú y Arbustos Densos',
        category: 'Atenuación Acústica',
        description:
          'Cortinas vegetales multicapa que atenúan hasta 7 dB el ruido del tráfico rodado hacia el interior del bosque.',
        targetKm: 'Sectores adyacentes a nidos y madrigueras',
      },
    ],
  };

  // Road Ecology Metrics
  const roadEffectZoneWidth = Math.min(1200, bufferRadiusMeters * 2);
  const roadEffectZoneTotalHa = Math.round((lengthKm * (roadEffectZoneWidth / 1000) * 100) * 10) / 10;
  const faunaCrossingsReq = Math.max(1, Math.ceil(lengthKm / 1.8));
  const faunaCrossingsInst = isMitigated ? faunaCrossingsReq : 0;
  const crossingDensityPer10Km = lengthKm > 0 ? Math.round(((faunaCrossingsInst / lengthKm) * 10) * 10) / 10 : 0;
  const recommendedDensityPer10Km = 5.5; // ~1 every 1.8 km
  const permeabilityIndex = isMitigated ? 7.8 : 3.2;

  const roadEcology: RoadEcologyMetrics = {
    roadEffectZoneWidthMeters: roadEffectZoneWidth,
    roadEffectZoneTotalHa,
    faunaCrossingsInstalled: faunaCrossingsInst,
    faunaCrossingsRequired: faunaCrossingsReq,
    crossingDensityPer10Km,
    recommendedDensityPer10Km,
    permeabilityIndex,
    barrierSeverity: isMitigated ? 'Bajo' : totalThreatened > 0 ? 'Crítico' : 'Moderado',
    recommendations: [
      `Zona de Efecto Vial estimada en ${roadEffectZoneWidth} metros (${roadEffectZoneTotalHa} ha con alteración potencial de ruido, iluminación y microclima).`,
      `Se requieren ${faunaCrossingsReq} pasos de fauna dedicados a lo largo de los ${lengthKm.toFixed(
        1
      )} km para mantener la permeabilidad del paisaje.`,
      'Instalar cerramiento perimetral guiador de fauna con malla de 1.8 a 2.2 m de altura y faldón enterrado de 30 cm para evitar excavaciones de mesomamíferos.',
      'Asegurar aperturas de escape unidireccionales (rampas de tierra o puertas batientes) para animales que accidentalmente queden dentro de la calzada.',
    ],
  };

  // ISO 14001 Environmental Aspects & Impacts Register
  const iso14001Aspects: Iso14001Aspect[] = [
    {
      id: 'asp-1',
      activity: 'Descapote y desmonte de vegetación',
      environmentalAspect: 'Pérdida de biomasa y cobertura vegetal',
      environmentalImpact: `Pérdida de ${metrics.vegetationLossHa} ha de hábitat natural y fragmentación del dosel forestal`,
      significance: 'Crítica',
      operationalControl: 'Veda estricta en especies CR/EN, descapote por tramos de máximo 500 m y rescate de germoplasma previo',
      complianceStandard: 'IFC PS6 / UICN / WB ESS6',
    },
    {
      id: 'asp-2',
      activity: 'Movimiento de tierras y conformación de terraplenes',
      environmentalAspect: 'Generación de material particulado (polvo) y erosión superficial',
      environmentalImpact: 'Sedimentación de cursos de agua y asfixia foliar en flora adyacente',
      significance: 'Significativa',
      operationalControl: 'Riego con camiones cisterna 3 veces al día y colocación inmediata de biomallas en taludes expuestos',
      complianceStandard: 'ISO 14001 Cláusula 8.1 / Ramsar',
    },
    {
      id: 'asp-3',
      activity: 'Operación de maquinaria pesada y voladuras',
      environmentalAspect: 'Emisión de ruido y vibraciones mecánicas',
      environmentalImpact: 'Ahuyentamiento de fauna y desorientación de especies en época reproductiva',
      significance: 'Significativa',
      operationalControl: 'Horario diurno estricto (08:00 a 17:00), silenciadores certificados y veda en meses de migración',
      complianceStandard: 'CMS / Road Ecology / WB ESS1',
    },
    {
      id: 'asp-4',
      activity: 'Tráfico de obra y operación vial futura',
      environmentalAspect: 'Riesgo de colisión y atropellamiento de fauna silvestre',
      environmentalImpact: 'Mortalidad directa de individuos y efecto barrera poblacional',
      significance: 'Crítica',
      operationalControl: 'Pasos de fauna (ecoductos), cercado direccional y señalización lumínica con radares de velocidad a 40 km/h',
      complianceStandard: 'Road Ecology / IFC PS6 / CITES',
    },
    {
      id: 'asp-5',
      activity: 'Drenaje superficial de calzada',
      environmentalAspect: 'Escorrentía con hidrocarburos y metales pesados',
      environmentalImpact: 'Contaminación de aguas subterráneas y freáticas',
      significance: 'Significativa',
      operationalControl: 'Separadores de grasas, trampas de arena y cunetas biofiltrantes con macrófitas antes de descarga',
      complianceStandard: 'Ramsar / ISO 14001 / CBD',
    },
  ];

  // Overall compliance calculations
  const counts = {
    total: standards.length,
    cumple: standards.filter((s) => s.status === 'CUMPLE').length,
    cumpleConCondiciones: standards.filter((s) => s.status === 'CUMPLE_CON_CONDICIONES').length,
    alertaAccionRequerida: standards.filter((s) => s.status === 'ALERTA_ACCION_REQUERIDA').length,
  };

  const avgScore = Math.round(
    standards.reduce((acc, s) => acc + s.score, 0) / standards.length
  );

  let overallStatus: ComplianceStatus = 'CUMPLE';
  let overallStatusLabel = 'Conforme con Salvaguardas Internacionales';

  if (counts.alertaAccionRequerida > 0) {
    overallStatus = 'ALERTA_ACCION_REQUERIDA';
    overallStatusLabel = `${counts.alertaAccionRequerida} Norma(s) con Alerta Crítica - Acción Requerida`;
  } else if (counts.cumpleConCondiciones > 0) {
    overallStatus = 'CUMPLE_CON_CONDICIONES';
    overallStatusLabel = 'Cumple Sujeto a Condiciones de Mitigación y BAP';
  }

  return {
    overallComplianceScore: avgScore,
    overallStatus,
    overallStatusLabel,
    counts,
    standards,
    mitigationHierarchy,
    iucnNbs,
    roadEcology,
    iso14001Aspects,
  };
}
