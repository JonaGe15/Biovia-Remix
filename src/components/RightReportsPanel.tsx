import React, { useState, useMemo } from 'react';
import * as turf from '@turf/turf';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area,
} from 'recharts';
import { SpeciesRecord, ImpactMetrics, RoadConnectionInfo, WaterTerminalValidation, ImpactCriteria, CorridorChokepoint } from '../types';
import {
  generateAffectedSpeciesPDF,
  generateImpactSimulationPDF,
  generateComplianceReportPDF,
  generateMasterTechnicalReportPDF,
} from '../utils/pdfGenerator';
import {
  evaluateAllStandards,
  StandardEvaluation,
  ComplianceStatus,
} from '../utils/complianceCalculations';

interface RightReportsPanelProps {
  projectName: string;
  routeCoords: [number, number][];
  metrics: ImpactMetrics;
  isMitigated: boolean;
  speciesList: SpeciesRecord[];
  bufferRadiusMeters: number;
  zoneName: string;
  roadConnection?: RoadConnectionInfo;
  waterTerminalValidation?: WaterTerminalValidation;
  impactCriteria?: ImpactCriteria;
  chokepoints?: CorridorChokepoint[];
  onGoToConectividad: () => void;
  onGoToBiodiversidad: () => void;
  onGoToSimulacion: () => void;
}

export interface SegmentBioData {
  id: string;
  name: string;
  shortName: string;
  kmStart: number;
  kmEnd: number;
  extensionKm: number;
  cumulativeKm: number;
  flora: number;
  fauna: number;
  totalEspecies: number;
  amenazadas: number;
  density: number;
  cumulativeFlora: number;
  cumulativeFauna: number;
  cumulativeTotal: number;
}

// Custom tooltip for segment-level composed chart
const CustomSegmentTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload as SegmentBioData;
    return (
      <div className="bg-[#1A231E]/95 backdrop-blur-md text-white p-2.5 rounded-xl text-[11px] shadow-lg border border-white/10 max-w-[220px]">
        <p className="font-bold font-['Space_Grotesk'] text-[#82C341]">{data.name}</p>
        <p className="text-[#A3B899] text-[10px] mb-1.5">
          Longitud de tramo: {data.extensionKm.toFixed(2)} km (Km {data.kmStart.toFixed(1)} - {data.kmEnd.toFixed(1)})
        </p>
        <div className="space-y-0.5 border-t border-white/10 pt-1.5">
          <div className="flex justify-between font-semibold">
            <span className="text-white">Total Especies:</span>
            <span className="text-[#82C341]">{data.totalEspecies} spp</span>
          </div>
          <div className="flex justify-between text-[#82C341]">
            <span>Flora:</span>
            <span>{data.flora} spp</span>
          </div>
          <div className="flex justify-between text-[#A3B899]">
            <span>Fauna:</span>
            <span>{data.fauna} spp</span>
          </div>
          <div className="flex justify-between text-[#F59E0B]">
            <span>Amenazadas (CR/EN/VU):</span>
            <span className="font-bold">{data.amenazadas} spp</span>
          </div>
          <div className="flex justify-between text-white/60 text-[10px] pt-1 border-t border-white/10">
            <span>Densidad:</span>
            <span>{data.density.toFixed(1)} spp/km</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

// Custom tooltip for cumulative progression chart
const CustomCumulativeTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload as SegmentBioData;
    return (
      <div className="bg-[#1A231E]/95 backdrop-blur-md text-white p-2.5 rounded-xl text-[11px] shadow-lg border border-white/10 max-w-[220px]">
        <p className="font-bold font-['Space_Grotesk'] text-[#82C341]">{data.name}</p>
        <p className="text-[#A3B899] text-[10px] mb-1.5">
          Progresiva acumulada: Km {data.cumulativeKm.toFixed(1)}
        </p>
        <div className="space-y-0.5 border-t border-white/10 pt-1.5">
          <div className="flex justify-between font-semibold">
            <span className="text-white">Especies Acumuladas:</span>
            <span className="text-[#82C341]">{data.cumulativeTotal} spp</span>
          </div>
          <div className="flex justify-between text-[#82C341]">
            <span>Flora acumulada:</span>
            <span>{data.cumulativeFlora} spp</span>
          </div>
          <div className="flex justify-between text-[#A3B899]">
            <span>Fauna acumulada:</span>
            <span>{data.cumulativeFauna} spp</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export const RightReportsPanel: React.FC<RightReportsPanelProps> = ({
  projectName,
  routeCoords,
  metrics,
  isMitigated,
  speciesList,
  bufferRadiusMeters,
  zoneName,
  roadConnection,
  waterTerminalValidation,
  impactCriteria,
  onGoToConectividad,
  onGoToBiodiversidad,
  onGoToSimulacion,
}) => {
  // Navigation tabs within Reports & Compliance
  const [activeTab, setActiveTab] = useState<'reportes' | 'matriz' | 'metodologias'>('reportes');

  // Selected PDF reports to generate
  const [selectedReports, setSelectedReports] = useState<{
    speciesList: boolean;
    impactSimulation: boolean;
    regulatoryCompliance: boolean;
  }>({
    speciesList: true,
    impactSimulation: true,
    regulatoryCompliance: true,
  });

  const [chartViewMode, setChartViewMode] = useState<'tramos' | 'acumulado'>('tramos');
  const [includeCoordinates, setIncludeCoordinates] = useState<boolean>(true);
  const [includeMitigations, setIncludeMitigations] = useState<boolean>(true);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatedSuccessFiles, setGeneratedSuccessFiles] = useState<string[] | null>(null);

  // Compliance Matrix interactive filter state
  const [complianceFilter, setComplianceFilter] = useState<
    'TODAS' | 'CUMPLE' | 'CUMPLE_CON_CONDICIONES' | 'ALERTA_ACCION_REQUERIDA'
  >('TODAS');
  const [expandedStandardId, setExpandedStandardId] = useState<string | null>('ifc-ps6');
  const [standardsSearchQuery, setStandardsSearchQuery] = useState<string>('');

  // Methodological Tools active section
  const [activeMethodologySection, setActiveMethodologySection] = useState<
    'jerarquia' | 'sbn' | 'road_ecology' | 'iso_iaia'
  >('jerarquia');

  const hasRoute = routeCoords && routeCoords.length >= 2;
  const inBufferSpecies = speciesList.filter((s) => s.isInBuffer);
  const affectedList = inBufferSpecies.length > 0 ? inBufferSpecies : speciesList;

  // Complete evaluation of all 16 standards and methodologies
  const complianceEvaluation = useMemo(() => {
    return evaluateAllStandards({
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
  }, [
    projectName,
    zoneName,
    metrics,
    bufferRadiusMeters,
    isMitigated,
    speciesList,
    roadConnection,
    waterTerminalValidation,
  ]);

  // Spatial calculation: break route into segments and map strictly registered species to each segment
  const segmentsData: SegmentBioData[] = useMemo(() => {
    if (!routeCoords || routeCoords.length < 2) return [];

    type SegmentDef = {
      id: string;
      name: string;
      shortName: string;
      line: ReturnType<typeof turf.lineString>;
      kmStart: number;
      kmEnd: number;
      extensionKm: number;
    };

    const defs: SegmentDef[] = [];
    const turfLine = turf.lineString(routeCoords.map(([lat, lng]) => [lng, lat]));
    const totalLineKm = turf.length(turfLine, { units: 'kilometers' });

    if (routeCoords.length === 2) {
      const numSlices = totalLineKm > 2 ? 3 : 2;
      const sliceLen = totalLineKm / numSlices;
      for (let i = 0; i < numSlices; i++) {
        const startKm = i * sliceLen;
        const endKm = (i + 1) * sliceLen;
        const pt1 = turf.along(turfLine, startKm, { units: 'kilometers' });
        const pt2 = turf.along(turfLine, endKm, { units: 'kilometers' });
        const segLine = turf.lineString([pt1.geometry.coordinates, pt2.geometry.coordinates]);
        const segLen = Math.round(turf.length(segLine, { units: 'kilometers' }) * 100) / 100;
        defs.push({
          id: `seg-${i + 1}`,
          name: `Tramo ${i + 1}`,
          shortName: `T${i + 1}`,
          line: segLine,
          kmStart: Math.round(startKm * 10) / 10,
          kmEnd: Math.round(endKm * 10) / 10,
          extensionKm: segLen > 0 ? segLen : Math.round(sliceLen * 100) / 100,
        });
      }
    } else {
      let cumulative = 0;
      for (let i = 0; i < routeCoords.length - 1; i++) {
        const p1: [number, number] = [routeCoords[i][1], routeCoords[i][0]];
        const p2: [number, number] = [routeCoords[i + 1][1], routeCoords[i + 1][0]];
        const segLine = turf.lineString([p1, p2]);
        const segLen = Math.round(turf.length(segLine, { units: 'kilometers' }) * 100) / 100;
        const startKm = cumulative;
        const endKm = cumulative + segLen;
        cumulative = endKm;
        defs.push({
          id: `seg-${i + 1}`,
          name: `Tramo ${i + 1}`,
          shortName: `T${i + 1}`,
          line: segLine,
          kmStart: Math.round(startKm * 10) / 10,
          kmEnd: Math.round(endKm * 10) / 10,
          extensionKm: segLen,
        });
      }
    }

    // Map strictly authentic species to the closest segment line
    const segmentSpeciesMap = new Map<string, { flora: number; fauna: number; amenazadas: number; species: Set<string> }>();
    defs.forEach((d) => {
      segmentSpeciesMap.set(d.id, { flora: 0, fauna: 0, amenazadas: 0, species: new Set<string>() });
    });

    affectedList.forEach((sp) => {
      let bestSegId = defs[0].id;
      let minDistance = 999999;

      if (sp.coordinates && sp.coordinates.length === 2) {
        const pt = turf.point([sp.coordinates[1], sp.coordinates[0]]);
        defs.forEach((d) => {
          const dist = turf.pointToLineDistance(pt, d.line, { units: 'kilometers' });
          if (dist < minDistance) {
            minDistance = dist;
            bestSegId = d.id;
          }
        });
      }

      const segStats = segmentSpeciesMap.get(bestSegId);
      if (segStats) {
        if (!segStats.species.has(sp.scientificName)) {
          segStats.species.add(sp.scientificName);
          if (sp.type === 'flora') segStats.flora++;
          else segStats.fauna++;
          if (sp.iucnStatus === 'CR' || sp.iucnStatus === 'EN' || sp.iucnStatus === 'VU') {
            segStats.amenazadas++;
          }
        }
      }
    });

    let runningKm = 0;
    let runningFlora = 0;
    let runningFauna = 0;
    let runningTotal = 0;

    return defs.map((d) => {
      const stats = segmentSpeciesMap.get(d.id)!;
      runningKm += d.extensionKm;
      runningFlora += stats.flora;
      runningFauna += stats.fauna;
      runningTotal += (stats.flora + stats.fauna);

      const totalSpp = stats.flora + stats.fauna;
      const density = d.extensionKm > 0 ? Math.round((totalSpp / d.extensionKm) * 10) / 10 : 0;

      return {
        id: d.id,
        name: `${d.name} (${d.kmStart}-${d.kmEnd} km)`,
        shortName: d.shortName,
        kmStart: d.kmStart,
        kmEnd: d.kmEnd,
        extensionKm: d.extensionKm,
        cumulativeKm: Math.round(runningKm * 10) / 10,
        flora: stats.flora,
        fauna: stats.fauna,
        totalEspecies: totalSpp,
        amenazadas: stats.amenazadas,
        density,
        cumulativeFlora: runningFlora,
        cumulativeFauna: runningFauna,
        cumulativeTotal: runningTotal,
      };
    });
  }, [routeCoords, affectedList]);

  const totalFloraAfectadas = hasRoute ? affectedList.filter((s) => s.type === 'flora').length : 0;
  const totalFaunaAfectadas = hasRoute ? affectedList.filter((s) => s.type === 'fauna').length : 0;
  const totalAmenazadasAfectadas = hasRoute
    ? affectedList.filter((s) => s.iucnStatus === 'CR' || s.iucnStatus === 'EN' || s.iucnStatus === 'VU').length
    : 0;

  const currentScore = hasRoute ? (isMitigated ? metrics.mitigatedScore : metrics.score) : 0;

  // Filtered standards for the compliance matrix view
  const filteredStandards = useMemo(() => {
    return complianceEvaluation.standards.filter((std) => {
      const matchesStatus =
        complianceFilter === 'TODAS' || std.status === complianceFilter;
      const matchesSearch =
        !standardsSearchQuery ||
        std.code.toLowerCase().includes(standardsSearchQuery.toLowerCase()) ||
        std.name.toLowerCase().includes(standardsSearchQuery.toLowerCase()) ||
        std.authority.toLowerCase().includes(standardsSearchQuery.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [complianceEvaluation, complianceFilter, standardsSearchQuery]);

  const [isGeneratingMaster, setIsGeneratingMaster] = useState<boolean>(false);

  const handleGenerateMasterPDF = () => {
    setIsGeneratingMaster(true);
    setGeneratedSuccessFiles(null);
    try {
      const options = {
        projectName,
        zoneName,
        bufferRadiusMeters,
        routeCoords,
        metrics,
        isMitigated,
        speciesList,
        roadConnection,
        waterTerminalValidation,
        impactCriteria,
      };
      const masterFile = generateMasterTechnicalReportPDF(options);
      setGeneratedSuccessFiles([masterFile]);
    } catch (err) {
      console.error('Error generating Master PDF technical report:', err);
    } finally {
      setIsGeneratingMaster(false);
    }
  };

  const handleGeneratePDFs = () => {
    setIsGenerating(true);
    setGeneratedSuccessFiles(null);

    const generated: string[] = [];

    try {
      const options = {
        projectName,
        zoneName,
        bufferRadiusMeters,
        routeCoords,
        metrics,
        isMitigated,
        speciesList,
        roadConnection,
        waterTerminalValidation,
        impactCriteria,
      };

      if (selectedReports.speciesList) {
        const file1 = generateAffectedSpeciesPDF(options);
        generated.push(file1);
      }

      if (selectedReports.impactSimulation) {
        const file2 = generateImpactSimulationPDF(options);
        generated.push(file2);
      }

      if (selectedReports.regulatoryCompliance) {
        const file3 = generateComplianceReportPDF(options);
        generated.push(file3);
      }

      setGeneratedSuccessFiles(generated);
    } catch (err) {
      console.error('Error generating PDF reports:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const selectedCount = [
    selectedReports.speciesList,
    selectedReports.impactSimulation,
    selectedReports.regulatoryCompliance,
  ].filter(Boolean).length;

  return (
    <aside className="relative w-[440px] h-full flex flex-col bg-[#FAF8F5]/90 backdrop-blur-2xl shadow-[-4px_0_30px_rgba(26,35,30,0.06)] border-l border-white/80 z-40 overflow-hidden">
      {/* Panel Header */}
      <div className="p-4 pb-2.5 bg-gradient-to-b from-white/95 to-transparent border-b border-[#D8D2C7]/40">
        <div className="flex items-center justify-between mb-1.5">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#2E6F40]/10 text-[#2E6F40] border border-[#2E6F40]/20 font-['Space_Grotesk'] text-[11px] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2E6F40] animate-pulse"></span>
            Informes & Cumplimiento
          </span>
          <span className="text-[11px] font-['Space_Grotesk'] text-[#4A5D52] font-semibold">
            16 Estándares Internacionales
          </span>
        </div>
        <h2 className="font-['Space_Grotesk'] text-[19px] text-[#1A231E] font-semibold tracking-tight">
          Gestor de Informes y Salvaguardas
        </h2>
        <p className="text-[11.5px] text-[#4A5D52] mt-0.5">
          Auditoría técnica de cumplimiento normativo, jerarquía de mitigación y exportación de reportes oficiales.
        </p>

        {/* Tab Switcher */}
        <div className="grid grid-cols-3 gap-1 bg-[#FAF8F5] p-1 rounded-xl border border-[#D8D2C7]/60 mt-2.5 text-[11px] font-['Space_Grotesk'] font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('reportes')}
            className={`py-1.5 px-2 rounded-lg transition-all text-center truncate cursor-pointer ${
              activeTab === 'reportes'
                ? 'bg-[#2E6F40] text-white shadow-xs'
                : 'text-[#4A5D52] hover:text-[#1A231E]'
            }`}
          >
            Reportes PDF
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('matriz')}
            className={`py-1.5 px-2 rounded-lg transition-all text-center truncate cursor-pointer ${
              activeTab === 'matriz'
                ? 'bg-[#2E6F40] text-white shadow-xs'
                : 'text-[#4A5D52] hover:text-[#1A231E]'
            }`}
          >
            Matriz 16 Normas
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('metodologias')}
            className={`py-1.5 px-2 rounded-lg transition-all text-center truncate cursor-pointer ${
              activeTab === 'metodologias'
                ? 'bg-[#2E6F40] text-white shadow-xs'
                : 'text-[#4A5D52] hover:text-[#1A231E]'
            }`}
          >
            Metodologías
          </button>
        </div>
      </div>

      {/* Scrollable Content Body */}
      <div className="flex-1 overflow-y-auto px-4 space-y-3.5 pb-4 pt-3">
        {/* If no route is drawn notice */}
        {!hasRoute && (
          <div className="p-3.5 rounded-2xl bg-white border border-[#D8D2C7]/70 shadow-xs flex flex-col gap-2 text-center items-center">
            <div className="w-8 h-8 rounded-full bg-[#2E6F40]/10 flex items-center justify-center text-[#2E6F40]">
              <span className="material-symbols-outlined text-[18px]">info</span>
            </div>
            <div className="flex flex-col">
              <span className="font-['Space_Grotesk'] text-[12.5px] font-bold text-[#1A231E]">
                Sin Trazado para Evaluar
              </span>
              <p className="text-[11px] text-[#4A5D52] mt-0.5">
                Traza una carretera en el mapa para auditar automáticamente las 16 salvaguardas y calcular la jerarquía de mitigación.
              </p>
            </div>
            <button
              onClick={onGoToConectividad}
              className="mt-1 px-3 py-1 rounded-full bg-[#2E6F40] text-white text-[11px] font-['Space_Grotesk'] font-semibold hover:bg-[#245833] transition-all cursor-pointer"
            >
              Ir a Conectividad Vial
            </button>
          </div>
        )}

        {/* Success notification banner */}
        {generatedSuccessFiles && generatedSuccessFiles.length > 0 && (
          <div className="p-3 rounded-2xl bg-[#EBF7EE] border border-[#2E6F40]/30 shadow-xs flex items-start gap-2.5">
            <span className="material-symbols-outlined text-[#2E6F40] text-[20px] shrink-0 mt-0.5">
              task_alt
            </span>
            <div className="flex flex-col text-[11px]">
              <span className="font-bold text-[#1B5E20] font-['Space_Grotesk']">
                ¡{generatedSuccessFiles.length} Reporte(s) Generado(s) y Descargado(s)!
              </span>
              <ul className="mt-1 space-y-0.5 text-[#2E6F40]">
                {generatedSuccessFiles.map((fn, i) => (
                  <li key={i} className="truncate">
                    📄 {fn}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* ===================== TAB 1: REPORTES PDF & RELACIÓN EXTENSIÓN ===================== */}
        {activeTab === 'reportes' && (
          <>
            {/* Recharts Data Visualization: Extensión vs Especies Registradas */}
            <div className="p-3.5 rounded-2xl bg-white border border-[#2E6F40]/30 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[#2E6F40] text-[18px]">
                    monitoring
                  </span>
                  <span className="text-[11.5px] font-['Space_Grotesk'] font-bold text-[#2E6F40] uppercase tracking-wide">
                    Extensión vs Especies por Tramo
                  </span>
                </div>
                {hasRoute && segmentsData.length > 0 && (
                  <div className="flex items-center bg-[#FAF8F5] p-0.5 rounded-lg border border-[#D8D2C7]/60 text-[10px] font-semibold">
                    <button
                      type="button"
                      onClick={() => setChartViewMode('tramos')}
                      className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                        chartViewMode === 'tramos'
                          ? 'bg-[#2E6F40] text-white shadow-xs'
                          : 'text-[#4A5D52] hover:text-[#1A231E]'
                      }`}
                    >
                      Por Tramos
                    </button>
                    <button
                      type="button"
                      onClick={() => setChartViewMode('acumulado')}
                      className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                        chartViewMode === 'acumulado'
                          ? 'bg-[#2E6F40] text-white shadow-xs'
                          : 'text-[#4A5D52] hover:text-[#1A231E]'
                      }`}
                    >
                      Acumulado
                    </button>
                  </div>
                )}
              </div>

              <p className="text-[11px] text-[#4A5D52] leading-snug">
                {hasRoute
                  ? `Relación entre la extensión kilométrica (${metrics.lengthKm} km) y las especies inventariadas en su franja (${bufferRadiusMeters} m).`
                  : 'Dibuja una carretera en el mapa para analizar la relación entre la extensión del trazado y las especies registradas.'}
              </p>

              {hasRoute && segmentsData.length > 0 ? (
                <div className="space-y-2.5">
                  <div className="w-full h-[210px] bg-[#FAF8F5]/90 rounded-xl p-2 border border-[#D8D2C7]/50">
                    <ResponsiveContainer width="100%" height="100%">
                      {chartViewMode === 'tramos' ? (
                        <ComposedChart
                          data={segmentsData}
                          margin={{ top: 10, right: 10, left: -20, bottom: 2 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#E5E0D8" vertical={false} />
                          <XAxis
                            dataKey="shortName"
                            tick={{ fontSize: 10, fill: '#4A5D52', fontWeight: 600 }}
                          />
                          <YAxis
                            yAxisId="left"
                            orientation="left"
                            allowDecimals={false}
                            tick={{ fontSize: 9.5, fill: '#4A5D52' }}
                            domain={[0, 'auto']}
                          />
                          <YAxis
                            yAxisId="right"
                            orientation="right"
                            unit=" km"
                            tick={{ fontSize: 9.5, fill: '#C05621' }}
                            domain={[0, 'auto']}
                          />
                          <Tooltip content={<CustomSegmentTooltip />} />
                          <Legend
                            wrapperStyle={{ fontSize: 10, paddingTop: 4 }}
                            iconType="circle"
                            iconSize={8}
                          />
                          <Bar
                            yAxisId="left"
                            dataKey="flora"
                            name="Flora (spp)"
                            fill="#2E6F40"
                            stackId="spp"
                            radius={[0, 0, 0, 0]}
                          />
                          <Bar
                            yAxisId="left"
                            dataKey="fauna"
                            name="Fauna (spp)"
                            fill="#4D7C5F"
                            stackId="spp"
                            radius={[3, 3, 0, 0]}
                          />
                          <Line
                            yAxisId="right"
                            type="monotone"
                            dataKey="extensionKm"
                            name="Longitud Tramo (km)"
                            stroke="#E67E22"
                            strokeWidth={2.2}
                            dot={{ r: 3.5, fill: '#E67E22', strokeWidth: 1.5, stroke: '#FFFFFF' }}
                          />
                        </ComposedChart>
                      ) : (
                        <AreaChart
                          data={segmentsData}
                          margin={{ top: 10, right: 10, left: -20, bottom: 2 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#E5E0D8" vertical={false} />
                          <XAxis
                            dataKey="shortName"
                            tick={{ fontSize: 10, fill: '#4A5D52', fontWeight: 600 }}
                          />
                          <YAxis
                            yAxisId="left"
                            orientation="left"
                            allowDecimals={false}
                            tick={{ fontSize: 9.5, fill: '#4A5D52' }}
                            domain={[0, 'auto']}
                          />
                          <YAxis
                            yAxisId="right"
                            orientation="right"
                            unit=" km"
                            tick={{ fontSize: 9.5, fill: '#C05621' }}
                            domain={[0, 'auto']}
                          />
                          <Tooltip content={<CustomCumulativeTooltip />} />
                          <Legend
                            wrapperStyle={{ fontSize: 10, paddingTop: 4 }}
                            iconType="circle"
                            iconSize={8}
                          />
                          <Area
                            yAxisId="left"
                            type="monotone"
                            dataKey="cumulativeTotal"
                            name="Especies Acumuladas"
                            stroke="#2E6F40"
                            fill="#2E6F40"
                            fillOpacity={0.15}
                            strokeWidth={2}
                          />
                          <Line
                            yAxisId="right"
                            type="monotone"
                            dataKey="cumulativeKm"
                            name="Extensión Acumulada (km)"
                            stroke="#E67E22"
                            strokeWidth={2}
                            dot={{ r: 3, fill: '#E67E22' }}
                          />
                        </AreaChart>
                      )}
                    </ResponsiveContainer>
                  </div>

                  {/* Summary Metric Strip */}
                  <div className="grid grid-cols-3 gap-1.5 text-center">
                    <div className="p-2 rounded-xl bg-[#FAF8F5] border border-[#D8D2C7]/50">
                      <span className="block text-[9.5px] text-[#4A5D52] font-['Space_Grotesk']">Tramos</span>
                      <span className="text-[14px] font-bold text-[#1A231E] font-['Space_Grotesk']">
                        {segmentsData.length}
                      </span>
                    </div>
                    <div className="p-2 rounded-xl bg-[#FAF8F5] border border-[#D8D2C7]/50">
                      <span className="block text-[9.5px] text-[#4A5D52] font-['Space_Grotesk']">Densidad Media</span>
                      <span className="text-[14px] font-bold text-[#2E6F40] font-['Space_Grotesk']">
                        {metrics.lengthKm > 0 ? ((totalFloraAfectadas + totalFaunaAfectadas) / metrics.lengthKm).toFixed(1) : 0} <span className="text-[9.5px] font-normal">spp/km</span>
                      </span>
                    </div>
                    <div className="p-2 rounded-xl bg-[#FAF8F5] border border-[#D8D2C7]/50">
                      <span className="block text-[9.5px] text-[#4A5D52] font-['Space_Grotesk']">Tramo + Sensible</span>
                      <span className="text-[12.5px] font-bold text-[#D33F36] font-['Space_Grotesk'] truncate block">
                        {(() => {
                          const highest = [...segmentsData].sort((a, b) => b.totalEspecies - a.totalEspecies)[0];
                          return highest && highest.totalEspecies > 0 ? `${highest.shortName} (${highest.totalEspecies} spp)` : 'Homogéneo';
                        })()}
                      </span>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Master Technical Report Card (Unified PDF - All in One) */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-[#1A3D24] to-[#2E6F40] text-white shadow-md space-y-3 border border-white/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none"></div>

              <div className="flex items-start justify-between relative z-10">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#84E296] text-[24px]">
                    menu_book
                  </span>
                  <div>
                    <span className="inline-block px-2 py-0.5 rounded-full bg-white/20 text-[#84E296] text-[9.5px] font-['Space_Grotesk'] font-bold uppercase tracking-wider mb-0.5">
                      Todo en Uno • Master PDF (5 Págs)
                    </span>
                    <h3 className="font-['Space_Grotesk'] text-[14.5px] font-bold text-white leading-tight">
                      Reporte Técnico General Detallado
                    </h3>
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-white/90 leading-snug relative z-10">
                Consolida en un único documento oficial todos los análisis del sistema: mapas generados con cuadrícula WGS84, métricas de impacto por tramos, catálogo de flora y fauna (GBIF/iNaturalist), auditoría de 16 normas internacionales y puntos de estrangulamiento ecológico.
              </p>

              <div className="flex items-center gap-2 text-[10px] text-white/90 bg-black/25 px-2.5 py-1.5 rounded-xl border border-white/10 relative z-10">
                <span className="material-symbols-outlined text-[16px] text-[#84E296]">verified</span>
                <span>Incluye certificación formal con código institucional de radicado único.</span>
              </div>

              <button
                type="button"
                onClick={handleGenerateMasterPDF}
                disabled={isGeneratingMaster || isGenerating}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white text-[#1A3D24] font-['Space_Grotesk'] text-[12.5px] font-bold shadow-md hover:bg-[#F0FDF4] active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed relative z-10"
              >
                {isGeneratingMaster ? (
                  <>
                    <span className="material-symbols-outlined text-[17px] animate-spin text-[#2E6F40]">
                      sync
                    </span>
                    <span>Generando Reporte Técnico General...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px] text-[#2E6F40]">
                      download_for_offline
                    </span>
                    <span>Descargar Reporte Master Todo en Uno (PDF)</span>
                  </>
                )}
              </button>
            </div>

            {/* Report Selection Section (3 options) */}
            <div className="p-3.5 rounded-2xl bg-white border border-[#2E6F40]/30 shadow-xs space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-['Space_Grotesk'] font-bold text-[#2E6F40] flex items-center gap-1.5 uppercase tracking-wide">
                  <span className="material-symbols-outlined text-[17px]">checklist</span>
                  Reportes a Generar en PDF
                </span>
                <span className="text-[10px] text-[#4A5D52] font-semibold">
                  {selectedCount}/3 Seleccionados
                </span>
              </div>

              {/* Option 1: Especies Afectadas (Lista Total) */}
              <label
                className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                  selectedReports.speciesList
                    ? 'bg-[#FAF8F5] border-[#2E6F40] shadow-xs'
                    : 'bg-white/60 border-[#D8D2C7]/60 opacity-70 hover:opacity-100'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedReports.speciesList}
                  onChange={(e) =>
                    setSelectedReports((prev) => ({ ...prev, speciesList: e.target.checked }))
                  }
                  className="accent-[#2E6F40] rounded w-4 h-4 mt-0.5 cursor-pointer shrink-0"
                />
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[#2E6F40] text-[17px]">
                      pets
                    </span>
                    <span className="font-['Space_Grotesk'] text-[12.5px] font-bold text-[#1A231E]">
                      Reporte de Especies Afectadas (Lista Total)
                    </span>
                  </div>
                  <p className="text-[10.5px] text-[#4A5D52] mt-0.5 leading-snug">
                    Inventario completo de flora y fauna en la franja, cantidad de observaciones (GBIF/iNaturalist), categoría UICN y distancias al eje vial.
                  </p>
                  <div className="flex items-center gap-2 mt-1.5 text-[9.5px] text-[#2E6F40] font-semibold">
                    <span className="bg-[#2E6F40]/10 px-2 py-0.5 rounded-full">
                      {affectedList.length} especies inventariadas
                    </span>
                    <span className="bg-[#2E6F40]/10 px-2 py-0.5 rounded-full">
                      {totalAmenazadasAfectadas} amenazadas
                    </span>
                  </div>
                </div>
              </label>

              {/* Option 2: Simulación de Impacto */}
              <label
                className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                  selectedReports.impactSimulation
                    ? 'bg-[#FAF8F5] border-[#2E6F40] shadow-xs'
                    : 'bg-white/60 border-[#D8D2C7]/60 opacity-70 hover:opacity-100'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedReports.impactSimulation}
                  onChange={(e) =>
                    setSelectedReports((prev) => ({ ...prev, impactSimulation: e.target.checked }))
                  }
                  className="accent-[#2E6F40] rounded w-4 h-4 mt-0.5 cursor-pointer shrink-0"
                />
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[#2E6F40] text-[17px]">
                      vital_signs
                    </span>
                    <span className="font-['Space_Grotesk'] text-[12.5px] font-bold text-[#1A231E]">
                      Reporte de Simulación de Impacto Ambiental
                    </span>
                  </div>
                  <p className="text-[10.5px] text-[#4A5D52] mt-0.5 leading-snug">
                    Índice Global de Afectación ({currentScore}/100), tasa de fragmentación ({metrics.fragmentationPercent}%), desmonte ({metrics.vegetationLossHa} ha), CO₂ evitado y empalmes.
                  </p>
                  <div className="flex items-center gap-2 mt-1.5 text-[9.5px] text-[#2E6F40] font-semibold">
                    <span className="bg-[#2E6F40]/10 px-2 py-0.5 rounded-full">
                      {metrics.lengthKm} km de eje
                    </span>
                    <span className="bg-[#2E6F40]/10 px-2 py-0.5 rounded-full">
                      Franja {bufferRadiusMeters} m
                    </span>
                  </div>
                </div>
              </label>

              {/* Option 3: Cumplimiento Normativo (16 Estándares) */}
              <label
                className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                  selectedReports.regulatoryCompliance
                    ? 'bg-[#FAF8F5] border-[#2E6F40] shadow-xs'
                    : 'bg-white/60 border-[#D8D2C7]/60 opacity-70 hover:opacity-100'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedReports.regulatoryCompliance}
                  onChange={(e) =>
                    setSelectedReports((prev) => ({
                      ...prev,
                      regulatoryCompliance: e.target.checked,
                    }))
                  }
                  className="accent-[#2E6F40] rounded w-4 h-4 mt-0.5 cursor-pointer shrink-0"
                />
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[#2E6F40] text-[17px]">
                      gavel
                    </span>
                    <span className="font-['Space_Grotesk'] text-[12.5px] font-bold text-[#1A231E]">
                      Reporte de Cumplimiento Normativo (16 Estándares)
                    </span>
                  </div>
                  <p className="text-[10.5px] text-[#4A5D52] mt-0.5 leading-snug">
                    Auditoría rigurosa frente a: IFC PS6, WB ESS6, CBD, Ramsar, CMS, CITES, UNESCO, Espoo, IFC PS1, ESS1, EBRD PR6, EP4, UICN, IAIA, ISO 14001 y Road Ecology.
                  </p>
                  <div className="flex items-center gap-2 mt-1.5 text-[9.5px] text-[#2E6F40] font-semibold">
                    <span className="bg-[#2E6F40]/10 px-2 py-0.5 rounded-full">
                      16 Estándares Auditados
                    </span>
                    <span className="bg-[#2E6F40]/10 px-2 py-0.5 rounded-full">
                      Jerarquía Mitigación & SbN UICN
                    </span>
                  </div>
                </div>
              </label>
            </div>

            {/* Project Summary Snapshot */}
            <div className="p-3.5 rounded-2xl bg-white border border-[#D8D2C7]/70 shadow-xs space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-['Space_Grotesk'] font-bold text-[#1A231E] uppercase tracking-wide">
                  Resumen del Proyecto a Incluir
                </span>
                <span className="text-[11px] text-[#2E6F40] font-semibold">{zoneName}</span>
              </div>

              <div className="grid grid-cols-4 gap-1.5 text-center">
                <div className="p-2 rounded-xl bg-[#2E6F40]/10 border border-[#2E6F40]/25">
                  <span className="block text-[9px] text-[#2E6F40] font-['Space_Grotesk'] font-bold">Total Especies</span>
                  <span className="text-[15px] font-bold text-[#2E6F40] font-['Space_Grotesk']">
                    {totalFloraAfectadas + totalFaunaAfectadas}
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-[#FAF8F5] border border-[#D8D2C7]/50">
                  <span className="block text-[9px] text-[#4A5D52] font-['Space_Grotesk']">Flora</span>
                  <span className="text-[15px] font-bold text-[#2E6F40] font-['Space_Grotesk']">
                    {totalFloraAfectadas}
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-[#FAF8F5] border border-[#D8D2C7]/50">
                  <span className="block text-[9px] text-[#4A5D52] font-['Space_Grotesk']">Fauna</span>
                  <span className="text-[15px] font-bold text-[#4D7C5F] font-['Space_Grotesk']">
                    {totalFaunaAfectadas}
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-[#FAF8F5] border border-[#D8D2C7]/50">
                  <span className="block text-[9px] text-[#4A5D52] font-['Space_Grotesk']">Amenazadas</span>
                  <span
                    className={`text-[15px] font-bold font-['Space_Grotesk'] ${
                      totalAmenazadasAfectadas > 0 ? 'text-[#D33F36]' : 'text-[#2E6F40]'
                    }`}
                  >
                    {totalAmenazadasAfectadas}
                  </span>
                </div>
              </div>

              {roadConnection?.isConnected && (
                <div className="p-2 rounded-lg bg-[#EBF7EE] text-[#2E6F40] text-[10.5px] flex items-center gap-1.5 font-medium">
                  <span className="material-symbols-outlined text-[15px]">add_road</span>
                  <span className="truncate">
                    Conectado a carretera existente: <strong>{roadConnection.roadName}</strong>
                  </span>
                </div>
              )}

              {waterTerminalValidation?.hasWaterTerminal && (
                <div className="p-2 rounded-lg bg-[#FEF2F2] text-[#B91C1C] text-[10.5px] flex items-center gap-1.5 font-medium">
                  <span className="material-symbols-outlined text-[15px]">warning</span>
                  <span className="truncate">
                    Alerta hídrica: El extremo finaliza en <strong>{waterTerminalValidation.waterBodyName}</strong>
                  </span>
                </div>
              )}
            </div>

            {/* Document Options */}
            <div className="p-3 rounded-2xl bg-white border border-[#D8D2C7]/70 shadow-xs space-y-1.5">
              <span className="text-[10.5px] font-['Space_Grotesk'] font-bold text-[#1A231E] uppercase tracking-wide block">
                Opciones del Documento
              </span>
              <label className="flex items-center gap-2 text-[10.5px] text-[#4A5D52] cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeCoordinates}
                  onChange={(e) => setIncludeCoordinates(e.target.checked)}
                  className="accent-[#2E6F40] rounded w-3.5 h-3.5 cursor-pointer"
                />
                <span>Incluir parámetros de franja ({bufferRadiusMeters} m) y metadatos espaciales</span>
              </label>
              <label className="flex items-center gap-2 text-[10.5px] text-[#4A5D52] cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeMitigations}
                  onChange={(e) => setIncludeMitigations(e.target.checked)}
                  className="accent-[#2E6F40] rounded w-3.5 h-3.5 cursor-pointer"
                />
                <span>Incluir medidas de mitigación específicas y condiciones vinculantes</span>
              </label>
            </div>
          </>
        )}

        {/* ===================== TAB 2: MATRIZ DE CUMPLIMIENTO 16 NORMAS ===================== */}
        {activeTab === 'matriz' && (
          <div className="space-y-3">
            {/* Executive Compliance Card */}
            <div className="p-3.5 rounded-2xl bg-white border border-[#2E6F40]/30 shadow-xs space-y-2.5">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-['Space_Grotesk'] uppercase tracking-wider font-bold text-[#2E6F40]">
                    Dictamen Global de Salvaguardas
                  </span>
                  <h3 className="font-['Space_Grotesk'] text-[15px] font-bold text-[#1A231E] mt-0.5">
                    {complianceEvaluation.overallStatusLabel}
                  </h3>
                </div>
                <div className="text-right">
                  <span className="text-[20px] font-bold font-['Space_Grotesk'] text-[#2E6F40]">
                    {complianceEvaluation.overallComplianceScore}%
                  </span>
                  <span className="block text-[9px] text-[#4A5D52]">Índice Promedio</span>
                </div>
              </div>

              {/* Status breakdown pills */}
              <div className="grid grid-cols-3 gap-1.5 text-center text-[10.5px]">
                <div className="p-1.5 rounded-lg bg-[#EBF7EE] border border-[#2E6F40]/30 text-[#1B5E20]">
                  <span className="block font-bold">{complianceEvaluation.counts.cumple}</span>
                  <span className="text-[9px]">Cumple Pleno</span>
                </div>
                <div className="p-1.5 rounded-lg bg-[#FEF3C7] border border-[#D97706]/30 text-[#92400E]">
                  <span className="block font-bold">{complianceEvaluation.counts.cumpleConCondiciones}</span>
                  <span className="text-[9px]">Condicionado</span>
                </div>
                <div className="p-1.5 rounded-lg bg-[#FEE2E2] border border-[#DC2626]/30 text-[#991B1B]">
                  <span className="block font-bold">{complianceEvaluation.counts.alertaAccionRequerida}</span>
                  <span className="text-[9px]">Alertas Críticas</span>
                </div>
              </div>

              {/* Fast filter pills */}
              <div className="flex flex-wrap gap-1 pt-1 border-t border-[#D8D2C7]/40 text-[10px] font-semibold">
                <button
                  type="button"
                  onClick={() => setComplianceFilter('TODAS')}
                  className={`px-2 py-0.5 rounded-full transition-all cursor-pointer ${
                    complianceFilter === 'TODAS'
                      ? 'bg-[#2E6F40] text-white shadow-xs'
                      : 'bg-[#FAF8F5] text-[#4A5D52] border border-[#D8D2C7]/60 hover:text-[#1A231E]'
                  }`}
                >
                  Todas (16)
                </button>
                <button
                  type="button"
                  onClick={() => setComplianceFilter('CUMPLE')}
                  className={`px-2 py-0.5 rounded-full transition-all cursor-pointer ${
                    complianceFilter === 'CUMPLE'
                      ? 'bg-[#1B5E20] text-white shadow-xs'
                      : 'bg-[#FAF8F5] text-[#4A5D52] border border-[#D8D2C7]/60 hover:text-[#1A231E]'
                  }`}
                >
                  Cumple ({complianceEvaluation.counts.cumple})
                </button>
                <button
                  type="button"
                  onClick={() => setComplianceFilter('CUMPLE_CON_CONDICIONES')}
                  className={`px-2 py-0.5 rounded-full transition-all cursor-pointer ${
                    complianceFilter === 'CUMPLE_CON_CONDICIONES'
                      ? 'bg-[#D97706] text-white shadow-xs'
                      : 'bg-[#FAF8F5] text-[#4A5D52] border border-[#D8D2C7]/60 hover:text-[#1A231E]'
                  }`}
                >
                  Condicionado ({complianceEvaluation.counts.cumpleConCondiciones})
                </button>
                <button
                  type="button"
                  onClick={() => setComplianceFilter('ALERTA_ACCION_REQUERIDA')}
                  className={`px-2 py-0.5 rounded-full transition-all cursor-pointer ${
                    complianceFilter === 'ALERTA_ACCION_REQUERIDA'
                      ? 'bg-[#DC2626] text-white shadow-xs'
                      : 'bg-[#FAF8F5] text-[#4A5D52] border border-[#D8D2C7]/60 hover:text-[#1A231E]'
                  }`}
                >
                  Alertas ({complianceEvaluation.counts.alertaAccionRequerida})
                </button>
              </div>

              {/* Search standard box */}
              <div className="relative">
                <span className="material-symbols-outlined absolute left-2.5 top-2 text-[#4A5D52] text-[16px]">
                  search
                </span>
                <input
                  type="text"
                  placeholder="Buscar norma (ej: IFC PS6, Ramsar, ISO 14001)..."
                  value={standardsSearchQuery}
                  onChange={(e) => setStandardsSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[#FAF8F5] border border-[#D8D2C7]/60 text-[11px] text-[#1A231E] focus:outline-none focus:border-[#2E6F40]"
                />
              </div>
            </div>

            {/* 16 Standards Accordion List */}
            <div className="space-y-2">
              {filteredStandards.map((std) => {
                const isExpanded = expandedStandardId === std.id;
                const isAlert = std.status === 'ALERTA_ACCION_REQUERIDA';
                const isCond = std.status === 'CUMPLE_CON_CONDICIONES';

                return (
                  <div
                    key={std.id}
                    className={`rounded-xl border transition-all overflow-hidden ${
                      isAlert
                        ? 'border-[#DC2626]/40 bg-[#FEF2F2]/40'
                        : isCond
                        ? 'border-[#D97706]/40 bg-[#FFFBEB]/40'
                        : 'border-[#2E6F40]/30 bg-white'
                    }`}
                  >
                    {/* Header bar */}
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedStandardId(isExpanded ? null : std.id)
                      }
                      className="w-full p-3 flex items-start justify-between text-left cursor-pointer hover:bg-black/2 transition-colors gap-2"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-['Space_Grotesk'] text-[12.5px] font-bold text-[#1A231E]">
                            {std.code}
                          </span>
                          <span className="text-[9.5px] px-1.5 py-0.2 rounded-md bg-[#FAF8F5] border border-[#D8D2C7]/60 text-[#4A5D52]">
                            {std.categoryLabel}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#4A5D52] truncate mt-0.5">
                          {std.name}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full ${
                            isAlert
                              ? 'bg-[#DC2626] text-white'
                              : isCond
                              ? 'bg-[#D97706] text-white'
                              : 'bg-[#2E6F40] text-white'
                          }`}
                        >
                          {isAlert ? 'Alerta' : isCond ? 'Condicionado' : 'Cumple'}
                        </span>
                        <span className="material-symbols-outlined text-[#4A5D52] text-[18px]">
                          {isExpanded ? 'expand_less' : 'expand_more'}
                        </span>
                      </div>
                    </button>

                    {/* Expandable Technical Detail */}
                    {isExpanded && (
                      <div className="px-3 pb-3 pt-1 border-t border-[#D8D2C7]/30 space-y-2 text-[11px]">
                        <div>
                          <span className="text-[9.5px] font-bold uppercase tracking-wide text-[#2E6F40] block">
                            Autoridad / Tratado
                          </span>
                          <p className="text-[#1A231E] font-medium">{std.authority}</p>
                        </div>

                        <div>
                          <span className="text-[9.5px] font-bold uppercase tracking-wide text-[#2E6F40] block">
                            Fundamentación Técnica Cuantitativa
                          </span>
                          <p className="text-[#4A5D52] leading-relaxed mt-0.5 bg-[#FAF8F5] p-2 rounded-lg border border-[#D8D2C7]/40">
                            {std.technicalJustification}
                          </p>
                        </div>

                        {/* Indicators Grid */}
                        <div className="grid grid-cols-3 gap-1 text-center">
                          {std.keyIndicators.map((ind, i) => (
                            <div
                              key={i}
                              className={`p-1.5 rounded-lg border text-[10px] ${
                                ind.isCritical
                                  ? 'bg-[#FEF2F2] border-[#DC2626]/30 text-[#991B1B]'
                                  : 'bg-white border-[#D8D2C7]/50 text-[#1A231E]'
                              }`}
                            >
                              <span className="block text-[8.5px] text-[#4A5D52] truncate">
                                {ind.label}
                              </span>
                              <span className="font-bold truncate block">{ind.value}</span>
                            </div>
                          ))}
                        </div>

                        {/* Binding Requirements */}
                        <div>
                          <span className="text-[9.5px] font-bold uppercase tracking-wide text-[#1A231E] block">
                            Exigencias Vinculantes para la Obra:
                          </span>
                          <ul className="mt-1 space-y-1 text-[#4A5D52]">
                            {std.bindingRequirements.map((req, i) => (
                              <li key={i} className="flex items-start gap-1.5 text-[10.5px]">
                                <span className="material-symbols-outlined text-[#2E6F40] text-[14px] shrink-0 mt-0.5">
                                  check_circle
                                </span>
                                <span>{req}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ===================== TAB 3: HERRAMIENTAS METODOLÓGICAS ===================== */}
        {activeTab === 'metodologias' && (
          <div className="space-y-3">
            {/* Methodology Subtabs */}
            <div className="grid grid-cols-4 gap-1 bg-[#FAF8F5] p-1 rounded-xl border border-[#D8D2C7]/60 text-[10px] font-['Space_Grotesk'] font-semibold">
              <button
                type="button"
                onClick={() => setActiveMethodologySection('jerarquia')}
                className={`py-1 px-1 rounded-md transition-all text-center truncate cursor-pointer ${
                  activeMethodologySection === 'jerarquia'
                    ? 'bg-[#2E6F40] text-white shadow-xs'
                    : 'text-[#4A5D52] hover:text-[#1A231E]'
                }`}
              >
                Jerarquía Mitig.
              </button>
              <button
                type="button"
                onClick={() => setActiveMethodologySection('sbn')}
                className={`py-1 px-1 rounded-md transition-all text-center truncate cursor-pointer ${
                  activeMethodologySection === 'sbn'
                    ? 'bg-[#2E6F40] text-white shadow-xs'
                    : 'text-[#4A5D52] hover:text-[#1A231E]'
                }`}
              >
                SbN UICN (8 Crit.)
              </button>
              <button
                type="button"
                onClick={() => setActiveMethodologySection('road_ecology')}
                className={`py-1 px-1 rounded-md transition-all text-center truncate cursor-pointer ${
                  activeMethodologySection === 'road_ecology'
                    ? 'bg-[#2E6F40] text-white shadow-xs'
                    : 'text-[#4A5D52] hover:text-[#1A231E]'
                }`}
              >
                Road Ecology
              </button>
              <button
                type="button"
                onClick={() => setActiveMethodologySection('iso_iaia')}
                className={`py-1 px-1 rounded-md transition-all text-center truncate cursor-pointer ${
                  activeMethodologySection === 'iso_iaia'
                    ? 'bg-[#2E6F40] text-white shadow-xs'
                    : 'text-[#4A5D52] hover:text-[#1A231E]'
                }`}
              >
                ISO 14001 / IAIA
              </button>
            </div>

            {/* 1. Jerarquía de Mitigación (Waterfall) */}
            {activeMethodologySection === 'jerarquia' && (
              <div className="p-3.5 rounded-2xl bg-white border border-[#2E6F40]/30 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-['Space_Grotesk'] font-bold text-[#2E6F40] uppercase tracking-wide">
                      Metodología: Jerarquía de Mitigación
                    </span>
                    <h3 className="font-['Space_Grotesk'] text-[14px] font-bold text-[#1A231E]">
                      Balance Cuantitativo de Hectáreas
                    </h3>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-[#2E6F40]/10 text-[#2E6F40] text-[10px] font-bold">
                    {complianceEvaluation.mitigationHierarchy.statusLabel}
                  </span>
                </div>

                <p className="text-[11px] text-[#4A5D52] leading-snug">
                  Evaluación escalonada según Voluntary Guidelines on Biodiversity-Inclusive EIA & IFC PS6: Evitación de trazado -&gt; Minimización de faja -&gt; Restauración in situ -&gt; Compensación / Offsets.
                </p>

                {/* Waterfall cards */}
                <div className="space-y-2">
                  <div className="p-2.5 rounded-xl bg-[#FEF2F2] border border-[#DC2626]/30 flex items-center justify-between text-[11px]">
                    <div>
                      <span className="font-bold text-[#991B1B] block">1. Impacto Bruto Inicial</span>
                      <span className="text-[10px] text-[#991B1B]/80">Huella de descapote teórica</span>
                    </div>
                    <span className="font-['Space_Grotesk'] text-[15px] font-bold text-[#991B1B]">
                      {complianceEvaluation.mitigationHierarchy.grossImpactHa} ha
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-[#EBF7EE] border border-[#2E6F40]/30 flex items-center justify-between text-[11px]">
                    <div>
                      <span className="font-bold text-[#1B5E20] block">2. Evitación Espacial (Trazado Optimizado)</span>
                      <span className="text-[10px] text-[#1B5E20]/80">Ajuste de radios y desvíos de humedales</span>
                    </div>
                    <span className="font-['Space_Grotesk'] text-[15px] font-bold text-[#1B5E20]">
                      -{complianceEvaluation.mitigationHierarchy.avoidanceHa} ha
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-[#FAF8F5] border border-[#D8D2C7]/60 flex items-center justify-between text-[11px]">
                    <div>
                      <span className="font-bold text-[#1A231E] block">3. Minimización de Servidumbre</span>
                      <span className="text-[10px] text-[#4A5D52]">Muros de suelo reforzado y vallado</span>
                    </div>
                    <span className="font-['Space_Grotesk'] text-[15px] font-bold text-[#2E6F40]">
                      -{complianceEvaluation.mitigationHierarchy.minimizationHa} ha
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-[#FAF8F5] border border-[#D8D2C7]/60 flex items-center justify-between text-[11px]">
                    <div>
                      <span className="font-bold text-[#1A231E] block">4. Restauración In Situ</span>
                      <span className="text-[10px] text-[#4A5D52]">Revegetación de taludes y bermas</span>
                    </div>
                    <span className="font-['Space_Grotesk'] text-[15px] font-bold text-[#2E6F40]">
                      +{complianceEvaluation.mitigationHierarchy.restorationHa} ha
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-[#EFF6FF] border border-[#3B82F6]/30 flex items-center justify-between text-[11px]">
                    <div>
                      <span className="font-bold text-[#1E40AF] block">
                        5. Compensación Ecológica Externa (Ratio {complianceEvaluation.mitigationHierarchy.compensationRatio}:1)
                      </span>
                      <span className="text-[10px] text-[#1E40AF]/80">Acuerdos de conservación a perpetuidad</span>
                    </div>
                    <span className="font-['Space_Grotesk'] text-[15px] font-bold text-[#1E40AF]">
                      +{complianceEvaluation.mitigationHierarchy.offsetHa} ha
                    </span>
                  </div>
                </div>

                {/* Net Gain Summary Box */}
                <div className="p-3 rounded-xl bg-gradient-to-r from-[#2E6F40]/15 to-[#4D7C5F]/15 border border-[#2E6F40]/40 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#2E6F40] block">
                      Resultado Neto (Net Positive Gain)
                    </span>
                    <span className="text-[12px] font-bold text-[#1A231E]">
                      Ganancia Neta Verificable de Hábitat
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[20px] font-bold font-['Space_Grotesk'] text-[#2E6F40]">
                      +{complianceEvaluation.mitigationHierarchy.netGainPercent}%
                    </span>
                    <span className="block text-[9.5px] text-[#4A5D52]">
                      (+{complianceEvaluation.mitigationHierarchy.netGainHa} ha equivalentes)
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* 2. Estándar Global UICN para SbN (8 Criterios) */}
            {activeMethodologySection === 'sbn' && (
              <div className="p-3.5 rounded-2xl bg-white border border-[#2E6F40]/30 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-['Space_Grotesk'] font-bold text-[#2E6F40] uppercase tracking-wide">
                      Estándar Global UICN SbN
                    </span>
                    <h3 className="font-['Space_Grotesk'] text-[14px] font-bold text-[#1A231E]">
                      8 Criterios para Vías Verdes
                    </h3>
                  </div>
                  <div className="text-right">
                    <span className="text-[16px] font-bold font-['Space_Grotesk'] text-[#2E6F40]">
                      {complianceEvaluation.iucnNbs.overallScore}%
                    </span>
                    <span className="block text-[8.5px] text-[#4A5D52]">
                      {complianceEvaluation.iucnNbs.maturityTier}
                    </span>
                  </div>
                </div>

                {/* 8 Criteria Progress List */}
                <div className="space-y-1.5 max-h-[170px] overflow-y-auto pr-1">
                  {complianceEvaluation.iucnNbs.criteria.map((c) => (
                    <div
                      key={c.id}
                      className="p-2 rounded-lg bg-[#FAF8F5] border border-[#D8D2C7]/40 text-[10.5px] space-y-1"
                    >
                      <div className="flex items-center justify-between font-semibold">
                        <span className="text-[#1A231E]">
                          {c.code}: {c.name}
                        </span>
                        <span className="text-[#2E6F40] font-bold">{c.score}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-[#D8D2C7]/40 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#2E6F40] rounded-full transition-all"
                          style={{ width: `${c.score}%` }}
                        ></div>
                      </div>
                      <p className="text-[9.5px] text-[#4A5D52] truncate">{c.evidence}</p>
                    </div>
                  ))}
                </div>

                {/* 4 NbS Interventions Designed for Road */}
                <div className="space-y-1.5 pt-1 border-t border-[#D8D2C7]/40">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#2E6F40] block">
                    Intervenciones NbS Diseñadas:
                  </span>
                  {complianceEvaluation.iucnNbs.recommendedNbsInterventions.map((intv, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded-lg bg-[#FAF8F5] border border-[#D8D2C7]/50 text-[10.5px]"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#1A231E]">{intv.title}</span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#2E6F40]/10 text-[#2E6F40] font-semibold">
                          {intv.category}
                        </span>
                      </div>
                      <p className="text-[9.5px] text-[#4A5D52] mt-0.5 leading-tight">
                        {intv.description}
                      </p>
                      <span className="text-[9px] text-[#2E6F40] font-medium block mt-0.5">
                        📍 {intv.targetKm}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3. Road Ecology Guidelines */}
            {activeMethodologySection === 'road_ecology' && (
              <div className="p-3.5 rounded-2xl bg-white border border-[#2E6F40]/30 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-['Space_Grotesk'] font-bold text-[#2E6F40] uppercase tracking-wide">
                      Directrices Road Ecology
                    </span>
                    <h3 className="font-['Space_Grotesk'] text-[14px] font-bold text-[#1A231E]">
                      Forman & Clevenger Road-Effect Zone
                    </h3>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-[#2E6F40]/10 text-[#2E6F40] text-[10px] font-bold">
                    Efecto Barrera: {complianceEvaluation.roadEcology.barrierSeverity}
                  </span>
                </div>

                {/* Road Ecology KPIs */}
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2.5 rounded-xl bg-[#FAF8F5] border border-[#D8D2C7]/50">
                    <span className="block text-[9.5px] text-[#4A5D52]">Zona de Efecto Vial (Ruido/Borde)</span>
                    <span className="font-bold text-[16px] text-[#1A231E] font-['Space_Grotesk']">
                      {complianceEvaluation.roadEcology.roadEffectZoneWidthMeters} m
                    </span>
                    <span className="block text-[9px] text-[#4A5D52]">
                      ({complianceEvaluation.roadEcology.roadEffectZoneTotalHa} ha de influencia directa)
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-[#FAF8F5] border border-[#D8D2C7]/50">
                    <span className="block text-[9.5px] text-[#4A5D52]">Densidad de Pasos Exigida</span>
                    <span className="font-bold text-[16px] text-[#2E6F40] font-['Space_Grotesk']">
                      1 paso / 1.8 km
                    </span>
                    <span className="block text-[9px] text-[#4A5D52]">
                      ({complianceEvaluation.roadEcology.faunaCrossingsRequired} ecoductos totales)
                    </span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-[#FAF8F5] border border-[#D8D2C7]/50 flex items-center justify-between text-[11px]">
                  <div>
                    <span className="font-bold text-[#1A231E] block">Índice de Permeabilidad Faunística</span>
                    <span className="text-[10px] text-[#4A5D52]">Flujo biológico a través de la calzada</span>
                  </div>
                  <span className="text-[16px] font-bold font-['Space_Grotesk'] text-[#2E6F40]">
                    {complianceEvaluation.roadEcology.permeabilityIndex} / 10
                  </span>
                </div>

                {/* Recommendations */}
                <div className="space-y-1.5 pt-1 border-t border-[#D8D2C7]/40">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#2E6F40] block">
                    Directrices de Ingeniería Ecológica:
                  </span>
                  <ul className="space-y-1 text-[10.5px] text-[#4A5D52]">
                    {complianceEvaluation.roadEcology.recommendations.map((rec, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#2E6F40] shrink-0 mt-1.5"></span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* 4. ISO 14001:2015 & IAIA */}
            {activeMethodologySection === 'iso_iaia' && (
              <div className="p-3.5 rounded-2xl bg-white border border-[#2E6F40]/30 shadow-xs space-y-3">
                <div>
                  <span className="text-[10px] font-['Space_Grotesk'] font-bold text-[#2E6F40] uppercase tracking-wide">
                    Sistemas de Gestión & IAIA
                  </span>
                  <h3 className="font-['Space_Grotesk'] text-[14px] font-bold text-[#1A231E]">
                    Matriz de Aspectos Ambientales (Ciclo PHVA)
                  </h3>
                </div>

                <p className="text-[11px] text-[#4A5D52] leading-snug">
                  Identificación de aspectos ambientales significativos bajo ISO 14001 y valoración de servicios ecosistémicos bajo directrices IAIA.
                </p>

                {/* ISO Aspects Table */}
                <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                  {complianceEvaluation.iso14001Aspects.map((asp) => (
                    <div
                      key={asp.id}
                      className="p-2.5 rounded-xl bg-[#FAF8F5] border border-[#D8D2C7]/50 text-[10.5px] space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#1A231E]">{asp.activity}</span>
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                            asp.significance === 'Crítica'
                              ? 'bg-[#DC2626]/10 text-[#DC2626]'
                              : 'bg-[#D97706]/10 text-[#D97706]'
                          }`}
                        >
                          {asp.significance}
                        </span>
                      </div>
                      <p className="text-[9.5px] text-[#4A5D52]">
                        <strong>Aspecto / Impacto: </strong> {asp.environmentalImpact}
                      </p>
                      <div className="p-1.5 rounded-lg bg-white border border-[#D8D2C7]/40 text-[9.5px] text-[#2E6F40]">
                        <strong>Control Operacional: </strong> {asp.operationalControl}
                      </div>
                      <span className="text-[8.5px] text-[#4A5D52] block">
                        Norma aplicable: {asp.complianceStandard}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Quick Links */}
        <div className="flex items-center justify-between pt-1 text-[11px] text-[#4A5D52]">
          <button
            onClick={onGoToBiodiversidad}
            className="hover:text-[#2E6F40] underline cursor-pointer"
          >
            Ver catálogo en Biodiversidad
          </button>
          <button
            onClick={onGoToSimulacion}
            className="hover:text-[#2E6F40] underline cursor-pointer"
          >
            Ver simulación en vivo
          </button>
        </div>
      </div>

      {/* Action Footer */}
      <div className="p-4 bg-white/95 backdrop-blur-xl border-t border-white/80 flex flex-col gap-2">
        <button
          type="button"
          onClick={handleGenerateMasterPDF}
          disabled={isGeneratingMaster || isGenerating}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-full bg-[#1A3D24] text-white font-['Space_Grotesk'] text-[12.5px] font-bold shadow-md hover:bg-[#245833] active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGeneratingMaster ? (
            <>
              <span className="material-symbols-outlined text-[17px] animate-spin text-[#84E296]">
                sync
              </span>
              <span>Generando Reporte Master Integral...</span>
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-[18px] text-[#84E296]">
                menu_book
              </span>
              <span>Descargar Reporte Master Todo en Uno (PDF)</span>
            </>
          )}
        </button>

        <button
          onClick={handleGeneratePDFs}
          disabled={selectedCount === 0 || isGenerating || isGeneratingMaster}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-full bg-white border border-[#2E6F40] text-[#2E6F40] font-['Space_Grotesk'] text-[12px] font-semibold hover:bg-[#2E6F40]/5 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGenerating ? (
            <>
              <span className="material-symbols-outlined text-[17px] animate-spin">
                sync
              </span>
              <span>Generando ({selectedCount})...</span>
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-[17px]">
                picture_as_pdf
              </span>
              <span>
                Exportar Solo Seleccionados ({selectedCount})
              </span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
};
