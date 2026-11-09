import React, { useState } from 'react';
import { SpeciesRecord, ImpactMetrics, ImpactCriteria } from '../types';

interface RightImpactPanelProps {
  metrics: ImpactMetrics;
  isMitigated: boolean;
  onToggleMitigation: (mitigated: boolean) => void;
  speciesList: SpeciesRecord[];
  onGenerateAlternative: () => void;
  isGeneratingAlternative: boolean;
  onOpenEIAModal: () => void;
  activeNav: string;
  onSelectNav?: (nav: string) => void;
  impactCriteria: ImpactCriteria;
  onToggleCriteria: (key: keyof ImpactCriteria) => void;
  hasRoute: boolean;
  onGoToConectividad: () => void;
  bufferRadiusMeters: number;
  onBufferRadiusChange?: (radius: number) => void;
  zoneName?: string;
  isBioLoading?: boolean;
  selectedSpecies?: SpeciesRecord | null;
  onSelectSpecies?: (sp: SpeciesRecord | null) => void;
  migratoryCrossings?: import('../types').MigratoryCrossing[];
  selectedMigratoryMonth?: number | null;
  onSelectMigratoryMonth?: (month: number | null) => void;
}

export const RightImpactPanel: React.FC<RightImpactPanelProps> = ({
  metrics,
  isMitigated,
  onToggleMitigation,
  speciesList,
  onGenerateAlternative,
  isGeneratingAlternative,
  onOpenEIAModal,
  activeNav,
  onSelectNav,
  impactCriteria,
  onToggleCriteria,
  hasRoute,
  onGoToConectividad,
  bufferRadiusMeters,
  onBufferRadiusChange,
  zoneName = 'Zona de Construcción',
  isBioLoading = false,
  selectedSpecies = null,
  onSelectSpecies,
  migratoryCrossings = [],
  selectedMigratoryMonth = null,
  onSelectMigratoryMonth,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'fauna' | 'flora' | 'inBuffer'>('all');
  const [filterThreatenedOnly, setFilterThreatenedOnly] = useState<boolean>(false);

  // Compute affected species totals for the influence buffer
  const inBufferAll = speciesList.filter((s) => s.isInBuffer);
  const effectiveAffected = hasRoute ? (inBufferAll.length > 0 ? inBufferAll : speciesList) : [];
  const totalFloraAfectadas = effectiveAffected.filter((s) => s.type === 'flora').length;
  const totalFaunaAfectadas = effectiveAffected.filter((s) => s.type === 'fauna').length;
  const totalAmenazadasAfectadas = effectiveAffected.filter(
    (s) => s.iucnStatus === 'CR' || s.iucnStatus === 'EN' || s.iucnStatus === 'VU'
  ).length;

  // Filter species based on criteria
  const filteredByCriteria = speciesList.filter((sp) => {
    if (sp.type === 'fauna' && !impactCriteria.fauna) return false;
    if (sp.type === 'flora' && !impactCriteria.flora) return false;
    if (filterThreatenedOnly && sp.iucnStatus !== 'CR' && sp.iucnStatus !== 'EN' && sp.iucnStatus !== 'VU') {
      return false;
    }
    return true;
  });

  const faunaSpecies = filteredByCriteria.filter((s) => s.type === 'fauna');
  const floraSpecies = filteredByCriteria.filter((s) => s.type === 'flora');
  const inBufferSpecies = filteredByCriteria.filter((s) => s.isInBuffer);

  const displayList =
    activeTab === 'all'
      ? filteredByCriteria
      : activeTab === 'fauna'
      ? faunaSpecies
      : activeTab === 'flora'
      ? floraSpecies
      : inBufferSpecies;

  // Gauge calculation
  const circumference = 251.3;
  const currentScore = hasRoute ? (isMitigated ? metrics.mitigatedScore : metrics.score) : 0;
  const strokeDashoffset = circumference * (1 - currentScore / 100);

  const isLowImpact = currentScore <= 45;

  const criteriaList: { key: keyof ImpactCriteria; label: string; icon: string; color: string }[] = [
    { key: 'flora', label: 'Flora & Bosques', icon: 'yard', color: '#2E6F40' },
    { key: 'fauna', label: 'Fauna Silvestre', icon: 'pets', color: '#4D7C5F' },
    { key: 'corridors', label: 'Corredores Biológicos', icon: 'alt_route', color: '#3B8650' },
    { key: 'protectedAreas', label: 'Áreas Protegidas', icon: 'nature_people', color: '#1B5E20' },
    { key: 'waterways', label: 'Cuencas Hidrográficas', icon: 'water', color: '#3B82A6' },
    { key: 'urbanZones', label: 'Zonas Urbanas', icon: 'location_city', color: '#8C968E' },
  ];

  const isBiodiversityView = activeNav === 'biodiversidad';

  return (
    <aside className="relative w-[430px] h-full flex flex-col bg-[#FAF8F5]/90 backdrop-blur-2xl shadow-[-4px_0_30px_rgba(26,35,30,0.06)] border-l border-white/80 z-40 overflow-hidden">
      {/* Panel Header */}
      <div className="p-4 pb-3 bg-gradient-to-b from-white/90 to-transparent border-b border-[#D8D2C7]/40">
        <div className="flex items-center justify-between mb-1.5">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#2E6F40]/10 text-[#2E6F40] border border-[#2E6F40]/20 font-['Space_Grotesk'] text-[11px] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2E6F40] animate-ping"></span>
            {isBiodiversityView ? 'Biodiversidad & Fauna' : 'Simulación de Impacto'}
          </span>
          <span className="text-[11px] font-['Space_Grotesk'] text-[#4A5D52] font-semibold">
            {hasRoute ? 'Obra en Análisis' : 'Esperando Trazado'}
          </span>
        </div>
        <h2 className="font-['Space_Grotesk'] text-[20px] text-[#1A231E] font-semibold tracking-tight">
          {isBiodiversityView ? 'Biodiversidad y Fauna de la Zona' : 'Impacto Ambiental en Vivo'}
        </h2>
        <p className="text-[12px] text-[#4A5D52] mt-0.5">
          {isBiodiversityView
            ? 'Inventario de especies de la zona donde se dibuja la construcción considerando la franja seleccionada.'
            : hasRoute
            ? 'Diagnóstico multicriterio en tiempo real según infraestructura trazada.'
            : 'Sin infraestructura trazada. Traza una carretera en Conectividad Vial para evaluar el impacto.'}
        </p>
      </div>

      {/* Scrollable Metrics & Species List */}
      <div className="flex-1 overflow-y-auto px-4 space-y-3.5 pb-4">
        {/* If no route is drawn yet */}
        {!hasRoute && (
          <div className="p-4 rounded-2xl bg-white border border-[#D8D2C7]/70 shadow-xs flex flex-col gap-2.5 text-center items-center">
            <div className="w-10 h-10 rounded-full bg-[#2E6F40]/10 flex items-center justify-center text-[#2E6F40]">
              <span className="material-symbols-outlined text-[24px]">timeline</span>
            </div>
            <div className="flex flex-col">
              <span className="font-['Space_Grotesk'] text-[14px] font-bold text-[#1A231E]">
                Mapa Listo para Trazar
              </span>
              <p className="text-[11px] text-[#4A5D52] mt-1 leading-relaxed">
                Selecciona <strong>Conectividad Vial</strong> en la barra izquierda y usa la herramienta <strong>Trazar Eje</strong> en el mapa. Pulsa la tecla <strong>ESC</strong> al terminar.
              </p>
            </div>
            <button
              onClick={onGoToConectividad}
              className="mt-1 px-4 py-2 rounded-full bg-[#2E6F40] text-white text-[12px] font-['Space_Grotesk'] font-semibold shadow-xs hover:bg-[#245833] transition-all cursor-pointer"
            >
              Ir a Conectividad Vial y Trazar
            </button>
          </div>
        )}

        {/* BUFFER INFLUENCE CARD (Displayed prominently for user control up to 5000m) */}
        <div className="p-3.5 rounded-2xl bg-white border border-[#2E6F40]/25 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-[11px] font-['Space_Grotesk']">
            <span className="text-[#2E6F40] font-bold flex items-center gap-1.5 uppercase tracking-wide">
              <span className="material-symbols-outlined text-[17px]">radar</span>
              Franja de Influencia Seleccionada
            </span>
            <span className="font-bold text-[#2E6F40] bg-[#2E6F40]/10 px-2 py-0.5 rounded-full">
              {bufferRadiusMeters >= 1000 ? `${(bufferRadiusMeters / 1000).toFixed(1)} km` : `${bufferRadiusMeters} m`}
            </span>
          </div>

          <div className="flex items-center justify-between text-[11px] text-[#4A5D52]">
            <span>Zona: <strong className="text-[#1A231E]">{zoneName}</strong></span>
            {isBioLoading && (
              <span className="text-[10px] text-[#2E6F40] flex items-center gap-1 animate-pulse">
                <span className="material-symbols-outlined text-[14px] animate-spin">sync</span>
                Actualizando...
              </span>
            )}
          </div>

          {onBufferRadiusChange && (
            <div className="space-y-1 pt-1">
              <input
                type="range"
                min={100}
                max={5000}
                step={100}
                value={bufferRadiusMeters}
                onChange={(e) => onBufferRadiusChange(Number(e.target.value))}
                className="w-full accent-[#2E6F40] cursor-pointer h-1.5 bg-[#EAE6DE] rounded-lg"
                aria-label="Franja de Influencia (hasta 5000m)"
              />
              <div className="flex justify-between text-[10px] text-[#8C968E]">
                <span>100 m</span>
                <span>1,000 m</span>
                <span>2,500 m</span>
                <span className="font-semibold text-[#2E6F40]">5,000 m (Máx)</span>
              </div>
            </div>
          )}

          <div className="pt-1.5 border-t border-[#D8D2C7]/50 flex items-center justify-between text-[11px]">
            <span className="text-[#4A5D52]">Especies en esta franja:</span>
            <span className="font-['Space_Grotesk'] font-bold text-[#2E6F40]">
              {inBufferSpecies.length} de {filteredByCriteria.length} detectadas
            </span>
          </div>
        </div>

        {/* ROAD CONNECTION & WATER VALIDATION BADGES IN IMPACT PANEL */}
        {hasRoute && (
          <div className="space-y-2">
            {metrics.roadConnection?.isConnected && (
              <div className="p-3 rounded-2xl bg-[#EBF7EE] border border-[#2E6F40]/30 shadow-xs flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="material-symbols-outlined text-[#2E6F40] text-[18px] shrink-0">add_road</span>
                  <div className="flex flex-col truncate">
                    <span className="text-[10px] uppercase font-['Space_Grotesk'] font-bold text-[#2E6F40]">Empalme Vial Detectado</span>
                    <span className="text-[12px] font-bold text-[#1A231E] truncate">{metrics.roadConnection.roadName}</span>
                  </div>
                </div>
                <span className="text-[9px] bg-[#2E6F40] text-white px-2 py-0.5 rounded-full font-bold shrink-0">Conectado</span>
              </div>
            )}

            {metrics.waterTerminalValidation?.hasWaterTerminal && (
              <div className="p-3 rounded-2xl bg-[#FEF2F2] border border-[#D33F36] shadow-xs flex items-start gap-2 text-[#991B1B]">
                <span className="material-symbols-outlined text-[#D33F36] text-[18px] shrink-0">warning</span>
                <div className="flex flex-col text-[11px]">
                  <span className="font-bold text-[#B91C1C]">Restricción: Extremo en {metrics.waterTerminalValidation.waterBodyName || 'Agua'}</span>
                  <span className="text-[#7F1D1D] mt-0.5">{metrics.waterTerminalValidation.message}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* NON-BIODIVERSITY VIEW: SHOW SIMULATION SCORE GAUGE & KPIS */}
        {!isBiodiversityView && (
          <>
            {/* SIMULACIÓN DE IMPACTO CRITERIA SELECTOR */}
            {activeNav === 'simulacion' && (
              <div className="p-3.5 rounded-2xl bg-white border border-[#2E6F40]/30 shadow-xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-['Space_Grotesk'] font-bold text-[#2E6F40] flex items-center gap-1.5 uppercase tracking-wide">
                    <span className="material-symbols-outlined text-[17px]">tune</span>
                    Criterios de Simulación
                  </span>
                  <span className="text-[10px] text-[#4A5D52] font-semibold">
                    {Object.values(impactCriteria).filter(Boolean).length}/6 Activos
                  </span>
                </div>
                <p className="text-[11px] text-[#4A5D52] leading-tight">
                  Selecciona qué factores ambientales ponderar en la simulación multicriterio:
                </p>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  {criteriaList.map((crit) => {
                    const checked = impactCriteria[crit.key];
                    return (
                      <label
                        key={crit.key}
                        className={`flex items-center gap-2 p-2 rounded-xl border text-[11px] font-medium cursor-pointer transition-all ${
                          checked
                            ? 'bg-[#FAF8F5] border-[#2E6F40] text-[#1A231E] shadow-2xs font-semibold'
                            : 'bg-white/60 border-[#D8D2C7]/60 text-[#8C968E]'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => onToggleCriteria(crit.key)}
                          className="accent-[#2E6F40] rounded w-3.5 h-3.5 cursor-pointer"
                        />
                        <span className="material-symbols-outlined text-[16px]" style={{ color: checked ? crit.color : '#8C968E' }}>
                          {crit.icon}
                        </span>
                        <span className="truncate">{crit.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Overall Impact Score Dial / Gauge Card */}
            <div className="relative p-4 rounded-2xl bg-[#EFECE6]/80 border border-white/90 shadow-sm overflow-hidden">
              <div className="absolute -right-8 -bottom-8 w-32 h-32 rounded-full bg-[#2E6F40]/5 blur-2xl pointer-events-none"></div>
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[10px] font-['Space_Grotesk'] text-[#4A5D52] uppercase tracking-wider font-semibold">
                    Índice Global de Afectación
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span
                      className={`font-['Space_Grotesk'] text-[42px] leading-none font-bold transition-colors ${
                        !hasRoute
                          ? 'text-[#8C968E]'
                          : isLowImpact
                          ? 'text-[#2E6F40]'
                          : 'text-[#D33F36]'
                      }`}
                    >
                      {currentScore}
                    </span>
                    <span className="font-['Space_Grotesk'] text-[18px] text-[#4A5D52]">
                      /100
                    </span>
                  </div>
                  <span
                    className={`inline-block mt-1.5 text-[12px] font-['Space_Grotesk'] font-semibold ${
                      !hasRoute
                        ? 'text-[#8C968E]'
                        : isLowImpact
                        ? 'text-[#2E6F40]'
                        : 'text-[#D33F36]'
                    }`}
                  >
                    {!hasRoute
                      ? 'Sin Infraestructura Trazada'
                      : isLowImpact
                      ? 'Impacto Aceptable (Mitigado)'
                      : 'Impacto Moderado-Alto'}
                  </span>
                </div>

                {/* Radial Gauge SVG */}
                <div className="relative w-22 h-22 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="transparent"
                      stroke="#DDD8CE"
                      strokeWidth="9"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="transparent"
                      stroke={!hasRoute ? '#8C968E' : isLowImpact ? '#2E6F40' : '#D33F36'}
                      strokeWidth="9"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                      className="transition-all duration-700"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span
                      className={`material-symbols-outlined text-[20px] ${
                        !hasRoute
                          ? 'text-[#8C968E]'
                          : isLowImpact
                          ? 'text-[#2E6F40]'
                          : 'text-[#D33F36]'
                      }`}
                    >
                      {!hasRoute ? 'explore' : isLowImpact ? 'verified' : 'warning'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Mitigation Switch Banner */}
              <div className="mt-3.5 pt-3 flex items-center justify-between bg-white/80 border border-[#D8D2C7]/70 p-2.5 rounded-xl">
                <div className="flex flex-col">
                  <span className="text-[12px] font-['Space_Grotesk'] text-[#1A231E] font-semibold">
                    Mitigar con Ecoductos
                  </span>
                  <span className="text-[11px] text-[#4A5D52] leading-tight">
                    Reduce fragmentación en 30 pts
                  </span>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={isMitigated}
                  disabled={!hasRoute}
                  onClick={() => onToggleMitigation(!isMitigated)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed ${
                    isMitigated ? 'bg-[#2E6F40]' : 'bg-[#DDD8CE]'
                  }`}
                  aria-label="Mitigar con Ecoductos"
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
                      isMitigated ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* 4 Key KPI Metrics Cards */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-3 rounded-xl bg-[#EFECE6]/75 border border-white/80 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-['Space_Grotesk'] text-[#4A5D52]">
                    Fragmentación
                  </span>
                  <span
                    className={`material-symbols-outlined text-[16px] ${
                      !hasRoute
                        ? 'text-[#8C968E]'
                        : isMitigated
                        ? 'text-[#2E6F40]'
                        : 'text-[#D33F36]'
                    }`}
                  >
                    {isMitigated ? 'check_circle' : 'broken_image'}
                  </span>
                </div>
                <span
                  className={`font-['Space_Grotesk'] text-[20px] font-bold ${
                    !hasRoute
                      ? 'text-[#8C968E]'
                      : isMitigated
                      ? 'text-[#2E6F40]'
                      : 'text-[#D33F36]'
                  }`}
                >
                  {hasRoute ? `+${metrics.fragmentationPercent}%` : '0%'}
                </span>
                <span className="text-[10px] text-[#4A5D52] mt-0.5">
                  {hasRoute ? (isMitigated ? 'Mitigado con ecoductos' : 'Riesgo en Corredor') : 'Sin afección'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-[#EFECE6]/75 border border-white/80 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-['Space_Grotesk'] text-[#4A5D52]">
                    Pérdida Vegetal
                  </span>
                  <span className="material-symbols-outlined text-[#4D7C5F] text-[16px]">
                    forest
                  </span>
                </div>
                <span className="font-['Space_Grotesk'] text-[20px] text-[#1A231E] font-bold">
                  {metrics.vegetationLossHa}{' '}
                  <span className="text-[12px] font-normal text-[#4A5D52]">ha</span>
                </span>
                <span className="text-[10px] text-[#4A5D52] mt-0.5">
                  {hasRoute ? 'En franja de influencia' : 'Sin desmonte'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-[#EFECE6]/75 border border-white/80 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-['Space_Grotesk'] text-[#4A5D52]">
                    CO₂ Evitado
                  </span>
                  <span className="material-symbols-outlined text-[#2E6F40] text-[16px]">
                    energy_savings_leaf
                  </span>
                </div>
                <span className="font-['Space_Grotesk'] text-[20px] text-[#2E6F40] font-bold">
                  {hasRoute ? `-${metrics.co2AvoidedTonsPerYear}` : '0'}{' '}
                  <span className="text-[12px] font-normal text-[#4A5D52]">t/a</span>
                </span>
                <span className="text-[10px] text-[#4A5D52] mt-0.5">
                  Por menor distancia
                </span>
              </div>

              <div className="p-3 rounded-xl bg-[#EFECE6]/75 border border-white/80 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-['Space_Grotesk'] text-[#4A5D52]">
                    Conectividad
                  </span>
                  <span className="material-symbols-outlined text-[#846B23] text-[16px]">
                    hub
                  </span>
                </div>
                <span className="font-['Space_Grotesk'] text-[20px] text-[#846B23] font-bold">
                  {hasRoute ? (
                    <>
                      7.2{' '}
                      <span className={`text-[12px] font-medium ${isMitigated ? 'text-[#2E6F40]' : 'text-[#D33F36]'}`}>
                        → {isMitigated ? '6.8' : '4.8'}
                      </span>
                    </>
                  ) : (
                    '10.0'
                  )}
                </span>
                <span className="text-[10px] text-[#4A5D52] mt-0.5">
                  Escala 1 al 10
                </span>
              </div>
            </div>
          </>
        )}

        {/* SPECIES SECTION: CONDITIONAL BY ACTIVE NAV */}
        {!isBiodiversityView ? (
          /* SIMULACIÓN DE IMPACTO: ONLY TOTAL ESPECIES AFECTADAS (Flora, Fauna, Amenazadas) */
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between">
              <h3 className="font-['Space_Grotesk'] text-[14px] font-semibold text-[#1A231E] flex items-center gap-2">
                <span className="material-symbols-outlined text-[#2E6F40] text-[18px]">
                  pest_control_rodent
                </span>
                <span>Total Especies Afectadas</span>
              </h3>
              <span className="text-[11px] font-['Space_Grotesk'] text-[#2E6F40] font-bold bg-[#2E6F40]/10 px-2.5 py-0.5 rounded-full border border-[#2E6F40]/20">
                {hasRoute ? `${totalFloraAfectadas + totalFaunaAfectadas} Especies Totales` : 'Sin Afección'}
              </span>
            </div>

            {/* Master Consolidated Count Card (Flora + Fauna) */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-[#2E6F40]/12 via-[#4D7C5F]/10 to-[#2E6F40]/5 border border-[#2E6F40]/30 shadow-xs flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#2E6F40] text-white flex items-center justify-center shrink-0 shadow-sm">
                  <span className="material-symbols-outlined text-[22px]">diversity_2</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-['Space_Grotesk'] text-[13px] font-bold text-[#1A231E]">
                    Conteo Total de Especies
                  </span>
                  <span className="text-[11px] text-[#4A5D52]">
                    {totalFloraAfectadas} de flora + {totalFaunaAfectadas} de fauna en la franja
                  </span>
                </div>
              </div>
              <div className="text-right pl-3">
                <span className="font-['Space_Grotesk'] text-[26px] font-bold text-[#2E6F40]">
                  {totalFloraAfectadas + totalFaunaAfectadas}
                </span>
                <span className="block text-[10px] text-[#4A5D52] font-semibold -mt-1">
                  total especies
                </span>
              </div>
            </div>

            <p className="text-[11px] text-[#4A5D52] leading-tight">
              Afectación biológica cuantificada en la franja de influencia seleccionada ({bufferRadiusMeters} m):
            </p>

            <div className="grid grid-cols-1 gap-2.5">
              {/* 1. Total Especies de Flora Afectadas */}
              <div className="p-3.5 rounded-2xl bg-white border border-[#2E6F40]/30 shadow-xs flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#2E6F40]/10 text-[#2E6F40] flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[22px]">yard</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-['Space_Grotesk'] text-[13px] font-bold text-[#1A231E]">
                      Total Especies de Flora Afectadas
                    </span>
                    <span className="text-[11px] text-[#4A5D52]">
                      Especies vegetales, arbóreas y epífitas en la franja
                    </span>
                  </div>
                </div>
                <div className="text-right pl-3">
                  <span className="font-['Space_Grotesk'] text-[24px] font-bold text-[#2E6F40]">
                    {totalFloraAfectadas}
                  </span>
                </div>
              </div>

              {/* 2. Total Especies de Fauna Afectadas */}
              <div className="p-3.5 rounded-2xl bg-white border border-[#4D7C5F]/30 shadow-xs flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#4D7C5F]/10 text-[#4D7C5F] flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[22px]">pets</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-['Space_Grotesk'] text-[13px] font-bold text-[#1A231E]">
                      Total Especies de Fauna Afectadas
                    </span>
                    <span className="text-[11px] text-[#4A5D52]">
                      Mamíferos, aves, reptiles y anfibios del ecosistema
                    </span>
                  </div>
                </div>
                <div className="text-right pl-3">
                  <span className="font-['Space_Grotesk'] text-[24px] font-bold text-[#4D7C5F]">
                    {totalFaunaAfectadas}
                  </span>
                </div>
              </div>

              {/* 3. Total Especies Clasificadas como Amenazadas */}
              <div
                className={`p-3.5 rounded-2xl border shadow-xs flex items-center justify-between ${
                  totalAmenazadasAfectadas > 0
                    ? 'bg-[#FEF2F2] border-[#D33F36]/35'
                    : 'bg-white border-[#2E6F40]/30'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      totalAmenazadasAfectadas > 0
                        ? 'bg-[#D33F36]/15 text-[#D33F36]'
                        : 'bg-[#2E6F40]/10 text-[#2E6F40]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[22px]">warning</span>
                  </div>
                  <div className="flex flex-col">
                    <span
                      className={`font-['Space_Grotesk'] text-[13px] font-bold ${
                        totalAmenazadasAfectadas > 0 ? 'text-[#991B1B]' : 'text-[#1A231E]'
                      }`}
                    >
                      Total Especies Clasificadas como Amenazadas
                    </span>
                    <span className="text-[11px] text-[#4A5D52]">
                      Categorías UICN en peligro: CR, EN y VU
                    </span>
                  </div>
                </div>
                <div className="text-right pl-3">
                  <span
                    className={`font-['Space_Grotesk'] text-[24px] font-bold ${
                      totalAmenazadasAfectadas > 0 ? 'text-[#D33F36]' : 'text-[#2E6F40]'
                    }`}
                  >
                    {totalAmenazadasAfectadas}
                  </span>
                </div>
              </div>
            </div>

            {onSelectNav && (
              <div className="pt-1">
                <button
                  onClick={() => onSelectNav('biodiversidad')}
                  className="w-full py-2.5 px-3.5 rounded-xl bg-white border border-[#2E6F40]/30 hover:border-[#2E6F40] hover:bg-[#FAF8F5] text-[#2E6F40] text-[12px] font-['Space_Grotesk'] font-semibold flex items-center justify-between transition-all cursor-pointer shadow-2xs group"
                >
                  <span className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[17px]">forest</span>
                    <span>Ver catálogo detallado en Biodiversidad & Fauna</span>
                  </span>
                  <span className="material-symbols-outlined text-[17px] group-hover:translate-x-1 transition-transform">
                    arrow_forward
                  </span>
                </button>
              </div>
            )}
          </div>
        ) : (
          /* BIODIVERSIDAD & FAUNA: COMPLETE DEDUPLICATED SPECIES LIST WITH OBSERVATION COUNT & INATURALIST LINK */
          <div className="space-y-3.5 pt-1">
            {/* 1. MIGRATORY ROUTES & SEASONAL ECOLOGICAL SENSITIVITY SECTION */}
            {hasRoute && migratoryCrossings && migratoryCrossings.length > 0 && (
              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-[#FAF8F5] via-white to-[#F0F7F2] border border-[#2E6F40]/30 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[#2E6F40] text-white flex items-center justify-center shadow-xs">
                      <span className="material-symbols-outlined text-[18px]">flight</span>
                    </div>
                    <div>
                      <h4 className="font-['Space_Grotesk'] text-[13px] font-bold text-[#1A231E] leading-tight">
                        Rutas Migratorias & Sensibilidad Estacional
                      </h4>
                      <p className="text-[10.5px] text-[#4A5D52]">
                        Puntos críticos donde el trazado corta corredores de fauna
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-['Space_Grotesk'] font-bold text-[#2E6F40] bg-[#2E6F40]/10 px-2 py-0.5 rounded-full border border-[#2E6F40]/25">
                    {migratoryCrossings.length} Cruces Críticos
                  </span>
                </div>

                {/* Seasonal Sensitivity Timeline (12 Months Calendar) */}
                <div className="space-y-1.5 p-2.5 rounded-xl bg-white border border-[#D8D2C7]/70 shadow-2xs">
                  <div className="flex items-center justify-between text-[11px] font-['Space_Grotesk']">
                    <span className="font-semibold text-[#1A231E] flex items-center gap-1">
                      <span className="material-symbols-outlined text-[15px] text-[#2E6F40]">calendar_month</span>
                      Periodos de Mayor Sensibilidad Ecológica:
                    </span>
                    {selectedMigratoryMonth !== null && onSelectMigratoryMonth && (
                      <button
                        onClick={() => onSelectMigratoryMonth(null)}
                        className="text-[10px] text-[#D33F36] hover:underline font-semibold cursor-pointer"
                      >
                        Ver todos los meses
                      </button>
                    )}
                  </div>

                  {/* 12 Months interactive buttons */}
                  <div className="grid grid-cols-6 gap-1 pt-0.5">
                    {[
                      { num: 1, label: 'Ene', peak: false },
                      { num: 2, label: 'Feb', peak: false },
                      { num: 3, label: 'Mar', peak: true },
                      { num: 4, label: 'Abr', peak: true },
                      { num: 5, label: 'May', peak: true },
                      { num: 6, label: 'Jun', peak: false },
                      { num: 7, label: 'Jul', peak: false },
                      { num: 8, label: 'Ago', peak: false },
                      { num: 9, label: 'Sep', peak: true },
                      { num: 10, label: 'Oct', peak: true },
                      { num: 11, label: 'Nov', peak: true },
                      { num: 12, label: 'Dic', peak: false },
                    ].map((m) => {
                      const isSelected = selectedMigratoryMonth === m.num;
                      const activeCrossingsInMonth = migratoryCrossings.filter((c) =>
                        c.peakMonths.includes(m.num)
                      ).length;

                      return (
                        <button
                          key={m.num}
                          type="button"
                          onClick={() => {
                            if (onSelectMigratoryMonth) {
                              onSelectMigratoryMonth(isSelected ? null : m.num);
                            }
                          }}
                          className={`py-1.5 px-1 rounded-lg text-center flex flex-col items-center justify-center transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[#2E6F40] text-white shadow-xs font-bold scale-[1.03]'
                              : m.peak
                              ? 'bg-[#FEF2F2] border border-[#D33F36]/30 text-[#991B1B] hover:bg-[#FEE2E2]'
                              : 'bg-[#FAF8F5] border border-[#D8D2C7]/60 text-[#4A5D52] hover:bg-white'
                          }`}
                          title={`Mes de ${m.label}: ${activeCrossingsInMonth} rutas con sensibilidad`}
                        >
                          <span className="text-[10px] font-['Space_Grotesk'] font-bold leading-none">
                            {m.label}
                          </span>
                          <span
                            className={`text-[8.5px] mt-0.5 leading-none ${
                              isSelected
                                ? 'text-white/90'
                                : m.peak
                                ? 'text-[#D33F36] font-bold'
                                : 'text-[#8C968E]'
                            }`}
                          >
                            {activeCrossingsInMonth > 0 ? `${activeCrossingsInMonth} cruces` : 'Bajo'}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-between text-[9.5px] pt-1 text-[#4A5D52] border-t border-[#D8D2C7]/40">
                    <span className="flex items-center gap-1 text-[#D33F36] font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#D33F36]"></span>
                      Pico Boreal: Sep - Nov & Mar - May
                    </span>
                    <span className="text-[9px] text-[#8C968E]">
                      {selectedMigratoryMonth
                        ? `Filtrando mes ${selectedMigratoryMonth}`
                        : 'Haz clic en un mes para filtrar'}
                    </span>
                  </div>
                </div>

                {/* Detected Critical Migratory Crossings List */}
                <div className="space-y-2">
                  <span className="text-[11px] font-['Space_Grotesk'] font-bold text-[#1A231E] block">
                    Puntos Críticos Detectados en el Trazado:
                  </span>
                  {migratoryCrossings
                    .filter((c) =>
                      selectedMigratoryMonth === null ? true : c.peakMonths.includes(selectedMigratoryMonth)
                    )
                    .map((cross) => (
                      <div
                        key={cross.id}
                        className="p-2.5 rounded-xl bg-white border border-[#2E6F40]/25 shadow-2xs space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-[#D33F36] animate-pulse"></span>
                            <span className="font-['Space_Grotesk'] text-[11.5px] font-bold text-[#1A231E]">
                              {cross.name} (PK {cross.kmMarker.toFixed(2)})
                            </span>
                          </div>
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[#FEF2F2] text-[#D33F36] border border-[#D33F36]/20">
                            {cross.sensitivityLevel.toUpperCase()}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-1 text-[10px]">
                          <span className="bg-[#FAF8F5] text-[#2E6F40] px-2 py-0.5 rounded border border-[#2E6F40]/20 font-medium">
                            🗓 {cross.peakSeasonLabel} ({cross.peakMonthsLabels})
                          </span>
                        </div>

                        <p className="text-[10px] text-[#4A5D52] leading-tight">
                          {cross.ecologicalRiskDescription}
                        </p>

                        <div className="p-1.5 rounded-lg bg-[#FAF8F5] border border-[#D8D2C7]/60 text-[9.5px] text-[#2E6F40]">
                          <strong className="text-[#1A231E]">Mitigación requerida: </strong>
                          {cross.recommendedMitigation}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* SIGHTING PINPOINT NOTICE & ACTIVE SELECTION BANNER */}
            <div className="p-2.5 rounded-xl bg-[#2E6F40]/10 border border-[#2E6F40]/30 shadow-2xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-['Space_Grotesk'] font-bold text-[#2E6F40] flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px]">pin_drop</span>
                  Ubicación Exacta del Avistamiento en Mapa
                </span>
                {selectedSpecies && onSelectSpecies && (
                  <button
                    onClick={() => onSelectSpecies(null)}
                    className="text-[10px] text-[#D33F36] font-semibold hover:underline cursor-pointer flex items-center gap-0.5"
                  >
                    <span className="material-symbols-outlined text-[12px]">close</span>
                    Desmarcar
                  </button>
                )}
              </div>
              <p className="text-[10.5px] text-[#4A5D52] leading-snug">
                {selectedSpecies ? (
                  <span>
                    Mostrando avistamiento exacto de <strong>{selectedSpecies.commonName}</strong> ({selectedSpecies.coordinates?.[0].toFixed(5)}°, {selectedSpecies.coordinates?.[1].toFixed(5)}°) a <strong>{selectedSpecies.distanceToLineMeters ?? 0} m</strong> del trazado.
                  </span>
                ) : (
                  <span>
                    Haz clic en cualquier tarjeta de especie a continuación para proyectar en el mapa el punto exacto donde se registró el avistamiento.
                  </span>
                )}
              </p>
            </div>

            {/* SPECIES LIST HEADER & FILTER TABS */}
            <div className="flex items-center justify-between">
              <h3 className="font-['Space_Grotesk'] text-[14px] font-semibold text-[#1A231E] flex items-center gap-2">
                <span className="material-symbols-outlined text-[#2E6F40] text-[18px]">
                  forest
                </span>
                <span>Lista Completa de Especies Afectadas</span>
              </h3>
              <label className="flex items-center gap-1.5 text-[11px] text-[#4A5D52] font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={filterThreatenedOnly}
                  onChange={(e) => setFilterThreatenedOnly(e.target.checked)}
                  className="accent-[#2E6F40] rounded w-3.5 h-3.5"
                />
                <span>Solo Amenazadas</span>
              </label>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center p-1 bg-[#EFECE6]/80 border border-[#D8D2C7]/70 rounded-xl gap-1">
              <button
                onClick={() => setActiveTab('all')}
                className={`flex-1 py-1.5 rounded-lg text-[11px] font-['Space_Grotesk'] font-medium text-center transition-all cursor-pointer ${
                  activeTab === 'all'
                    ? 'bg-white text-[#2E6F40] font-semibold shadow-xs'
                    : 'text-[#4A5D52] hover:text-[#1A231E]'
                }`}
              >
                Todas ({filteredByCriteria.length})
              </button>
              <button
                onClick={() => setActiveTab('inBuffer')}
                className={`flex-1 py-1.5 rounded-lg text-[11px] font-['Space_Grotesk'] font-medium text-center transition-all cursor-pointer ${
                  activeTab === 'inBuffer'
                    ? 'bg-white text-[#2E6F40] font-semibold shadow-xs'
                    : 'text-[#4A5D52] hover:text-[#1A231E]'
                }`}
              >
                En Franja ({inBufferSpecies.length})
              </button>
              <button
                onClick={() => setActiveTab('fauna')}
                className={`flex-1 py-1.5 rounded-lg text-[11px] font-['Space_Grotesk'] font-medium text-center transition-all cursor-pointer ${
                  activeTab === 'fauna'
                    ? 'bg-white text-[#2E6F40] font-semibold shadow-xs'
                    : 'text-[#4A5D52] hover:text-[#1A231E]'
                }`}
              >
                Fauna ({faunaSpecies.length})
              </button>
              <button
                onClick={() => setActiveTab('flora')}
                className={`flex-1 py-1.5 rounded-lg text-[11px] font-['Space_Grotesk'] font-medium text-center transition-all cursor-pointer ${
                  activeTab === 'flora'
                    ? 'bg-white text-[#2E6F40] font-semibold shadow-xs'
                    : 'text-[#4A5D52] hover:text-[#1A231E]'
                }`}
              >
                Flora ({floraSpecies.length})
              </button>
            </div>

            {/* Species Cards List */}
            <div className="space-y-2.5 overflow-y-auto pr-1 max-h-[520px]">
              {displayList.length === 0 ? (
                <div className="p-4 text-center text-[12px] text-[#8C968E] bg-white rounded-xl border border-[#D8D2C7]/60">
                  {hasRoute
                    ? 'No se encontraron especies con los filtros seleccionados para esta franja de influencia.'
                    : 'Traza una carretera en el mapa para ver las especies específicas de esa zona.'}
                </div>
              ) : (
                displayList.map((sp) => {
                  const isCrit = sp.iucnStatus === 'CR' || sp.iucnStatus === 'EN';
                  const isVuln = sp.iucnStatus === 'VU';
                  const inBuffer = sp.isInBuffer;
                  const isSelected = selectedSpecies?.id === sp.id;
                  const inatUrl =
                    sp.inaturalistUrl ||
                    `https://www.inaturalist.org/taxa?q=${encodeURIComponent(sp.scientificName)}`;

                  return (
                    <div
                      key={sp.id}
                      onClick={() => onSelectSpecies?.(isSelected ? null : sp)}
                      className={`p-3 rounded-xl border transition-all flex flex-col gap-2 shadow-xs group cursor-pointer ${
                        isSelected
                          ? 'ring-2 ring-[#2E6F40] bg-[#F4FAF6] border-[#2E6F40] shadow-md scale-[1.01]'
                          : inBuffer
                          ? 'bg-white border-[#2E6F40]/30 hover:border-[#2E6F40] hover:bg-[#FAF8F5]'
                          : 'bg-[#EFECE6]/60 border-[#D8D2C7]/60 opacity-80 hover:opacity-100 hover:bg-white'
                      }`}
                    >
                      {/* Active Sighting Ribbon */}
                      {isSelected && (
                        <div className="flex items-center justify-between -mt-1 pb-1 border-b border-[#2E6F40]/25 text-[10px] text-[#2E6F40] font-bold">
                          <span className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#2E6F40] animate-ping"></span>
                            📍 Avistamiento marcado en el mapa
                          </span>
                          <span className="text-[9px] bg-[#2E6F40] text-white px-2 py-0.2 rounded-full">
                            Activo
                          </span>
                        </div>
                      )}

                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          {sp.imageUrl ? (
                            <img
                              src={sp.imageUrl}
                              alt={sp.commonName}
                              className="w-10 h-10 rounded-lg object-cover border border-[#D8D2C7]/70 shrink-0"
                            />
                          ) : (
                            <div
                              className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 text-white ${
                                inBuffer
                                  ? isCrit
                                    ? 'bg-[#D33F36]'
                                    : sp.type === 'fauna'
                                    ? 'bg-[#2E6F40]'
                                    : 'bg-[#4D7C5F]'
                                  : 'bg-[#8C968E]'
                              }`}
                            >
                              <span className="material-symbols-outlined text-[20px]">
                                {sp.type === 'fauna' ? 'pets' : 'yard'}
                              </span>
                            </div>
                          )}
                          <div className="flex flex-col">
                            <span className="font-['Space_Grotesk'] text-[13px] font-semibold text-[#1A231E] group-hover:text-[#2E6F40] transition-colors leading-tight">
                              {sp.commonName}
                            </span>
                            <span className="text-[11px] italic text-[#4A5D52]">
                              {sp.scientificName}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wide font-['Space_Grotesk'] ${
                              isCrit
                                ? 'bg-[#FDEAE8] text-[#D33F36] border border-[#D33F36]/25'
                                : isVuln
                                ? 'bg-[#FEF3C7] text-[#B45309] border border-[#FDE68A]'
                                : 'bg-[#2E6F40]/10 text-[#2E6F40] border border-[#2E6F40]/25'
                            }`}
                          >
                            {sp.iucnCategoryLabel}
                          </span>

                          {inBuffer ? (
                            <span className="text-[9px] font-bold text-[#2E6F40] bg-[#2E6F40]/10 px-1.5 py-0.2 rounded flex items-center gap-1">
                              <span className="w-1 h-1 rounded-full bg-[#2E6F40]"></span>
                              En Franja
                            </span>
                          ) : (
                            <span className="text-[9px] text-[#8C968E]">Fuera</span>
                          )}
                        </div>
                      </div>

                      {/* OBSERVATION COUNT & DISTANCE TO LINE */}
                      <div className="flex items-center justify-between text-[#4A5D52] text-[11px] pt-1 border-t border-[#D8D2C7]/50">
                        <span className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[14px] text-[#2E6F40]">
                            visibility
                          </span>
                          <span className="font-['Space_Grotesk'] font-medium text-[#1A231E]">
                            Observaciones en el área: <strong>{sp.observationCount || 1}</strong>
                          </span>
                        </span>

                        {sp.distanceToLineMeters !== undefined && (
                          <span className="text-[10px] text-[#4A5D52]">
                            {sp.distanceToLineMeters} m al eje
                          </span>
                        )}
                      </div>

                      {/* INTERACTIVE ACTIONS: MAP SIGHTING & INATURALIST LINK */}
                      <div className="flex items-center justify-between gap-2 pt-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectSpecies?.(isSelected ? null : sp);
                          }}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10.5px] font-['Space_Grotesk'] font-semibold transition-all cursor-pointer shadow-2xs ${
                            isSelected
                              ? 'bg-[#2E6F40] text-white shadow-xs'
                              : 'bg-white hover:bg-[#2E6F40]/10 text-[#2E6F40] border border-[#2E6F40]/30'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[14px]">
                            {isSelected ? 'check_circle' : 'pin_drop'}
                          </span>
                          <span>{isSelected ? 'Marcado en mapa' : 'Ver avistamiento en mapa'}</span>
                        </button>

                        <a
                          href={inatUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#FAF8F5] hover:bg-[#2E6F40] hover:text-white text-[#2E6F40] border border-[#2E6F40]/30 text-[10px] font-['Space_Grotesk'] font-semibold transition-all shadow-2xs group/btn cursor-pointer"
                          title={`Abrir registro de ${sp.scientificName} en iNaturalist`}
                        >
                          <span className="material-symbols-outlined text-[13px] group-hover/btn:translate-x-0.5 transition-transform">
                            open_in_new
                          </span>
                          <span>iNaturalist</span>
                        </a>
                      </div>

                      {sp.mitigationMeasure && (
                        <div className="text-[10px] text-[#4A5D52] bg-[#FAF8F5] p-2 rounded-lg border border-[#D8D2C7]/50 leading-snug mt-0.5">
                          <span className="font-semibold text-[#1A231E]">Medida de Mitigación: </span>
                          {sp.mitigationMeasure}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="p-4 bg-white/85 backdrop-blur-xl border-t border-white/80 flex flex-col gap-2.5">
        <button
          onClick={onGenerateAlternative}
          disabled={isGeneratingAlternative || !hasRoute}
          className="w-full flex items-center justify-center gap-2.5 py-3 px-4 rounded-full bg-gradient-to-r from-[#2E6F40] to-[#4D7C5F] text-white font-['Space_Grotesk'] text-[13px] font-semibold shadow-[0_4px_16px_rgba(46,111,64,0.28)] hover:brightness-105 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGeneratingAlternative ? (
            <>
              <span className="material-symbols-outlined text-[18px] animate-spin">
                sync
              </span>
              <span>Calculando Corredor Óptimo...</span>
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-[18px]">
                auto_fix_high
              </span>
              <span>Generar Alternativa de Menor Impacto</span>
            </>
          )}
        </button>

        <button
          onClick={onOpenEIAModal}
          disabled={!hasRoute}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-full bg-[#EFECE6] hover:bg-[#EAE6DE] text-[#1A231E] font-['Space_Grotesk'] text-[12px] font-medium border border-[#D8D2C7]/70 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="material-symbols-outlined text-[17px] text-[#4D7C5F]">
            picture_as_pdf
          </span>
          <span>Exportar Dictamen Técnico EIA (.GeoJSON / .PDF)</span>
        </button>
      </div>
    </aside>
  );
};
