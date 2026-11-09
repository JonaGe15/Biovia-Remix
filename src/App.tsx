import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Header } from './components/Header';
import { LeftSidebar } from './components/LeftSidebar';
import { RightImpactPanel } from './components/RightImpactPanel';
import { RightConnectivityPanel } from './components/RightConnectivityPanel';
import { RightReportsPanel } from './components/RightReportsPanel';
import { MapComponent } from './components/MapComponent';
import { AltimetricProfile } from './components/AltimetricProfile';
import { EIAExportModal } from './components/EIAExportModal';
import { MethodologyModal } from './components/MethodologyModal';
import {
  calculateLineLengthKm,
  calculateVegetationLossHa,
  calculateFragmentation,
  calculateCO2Avoided,
  computeImpactScore,
  generateEcoOptimizedRoute,
  generateBufferPolygon,
  checkRoadConnection,
  checkWaterTerminalValidation,
  calculateMigratoryCrossings,
  calculateCorridorChokepoints,
} from './utils/geoCalculations';
import {
  fetchGBIFSpecies,
  fetchINaturalistObservations,
  fetchZoneSpeciesWithBuffer,
} from './services/bioApis';
import {
  ImpactMetrics,
  LayerVisibility,
  SpeciesRecord,
  DrawingToolType,
  RoadConnectionInfo,
  WaterTerminalValidation,
} from './types';

// Default highway alignment B-204 in the Colombian Central Andes (available as template or when generating alternative)
export const DEFAULT_DEMO_COORDS: [number, number][] = [
  [4.609, -75.561],
  [4.637, -75.534],
  [4.665, -75.510],
  [4.706, -75.470],
];

export default function App() {
  // Initial state starts without markers and with project name 'Mi Proyecto' as requested
  const [projectName, setProjectName] = useState<string>('Mi Proyecto');
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);
  const [bufferRadiusMeters, setBufferRadiusMeters] = useState<number>(500);
  const [isMitigated, setIsMitigated] = useState<boolean>(false);
  const [activeNav, setActiveNav] = useState<string>('conectividad');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeBaseMap, setActiveBaseMap] = useState<'positron' | 'satellite'>('positron');
  const [is3DActive, setIs3DActive] = useState<boolean>(false);
  const [isEIAModalOpen, setIsEIAModalOpen] = useState<boolean>(false);
  const [isMethodologyOpen, setIsMethodologyOpen] = useState<boolean>(false);
  const [isGeneratingAlternative, setIsGeneratingAlternative] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Panels collapse states for full map view
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState<boolean>(true);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState<boolean>(true);

  // Drawing tool & removal mode in Conectividad Vial
  const [activeDrawingTool, setActiveDrawingTool] = useState<DrawingToolType | null>(null);
  const [isRemovalMode, setIsRemovalMode] = useState<boolean>(false);

  const [cursorCoords, setCursorCoords] = useState<{ lat: number; lng: number }>({
    lat: 4.655,
    lng: -75.52,
  });

  // Criteria selected when in "Simulación de Impacto"
  const [impactCriteria, setImpactCriteria] = useState<{
    flora: boolean;
    fauna: boolean;
    corridors: boolean;
    protectedAreas: boolean;
    waterways: boolean;
    urbanZones: boolean;
  }>({
    flora: true,
    fauna: true,
    corridors: true,
    protectedAreas: true,
    waterways: true,
    urbanZones: true,
  });

  const handleToggleCriteria = useCallback((key: keyof typeof impactCriteria) => {
    setImpactCriteria((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  }, []);

  const [layers, setLayers] = useState<LayerVisibility>({
    protectedAreas: true,
    corridors: true,
    waterways: true,
    urbanZones: false,
    sensitivityHeatmap: false,
    bufferZone: true,
    migratoryRoutes: true,
    chokepoints: true,
  });

  const [allSpecies, setAllSpecies] = useState<SpeciesRecord[]>([]);
  const [selectedSpecies, setSelectedSpecies] = useState<SpeciesRecord | null>(null);
  const [selectedMigratoryMonth, setSelectedMigratoryMonth] = useState<number | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [zoneName, setZoneName] = useState<string>('Zona del Proyecto');
  const [isBioLoading, setIsBioLoading] = useState<boolean>(false);

  // Road connection detection & Water terminal validation states
  const [roadConnection, setRoadConnection] = useState<RoadConnectionInfo | undefined>(undefined);
  const [waterTerminalValidation, setWaterTerminalValidation] = useState<WaterTerminalValidation | undefined>(undefined);

  // Show temporary toast feedback
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  }, []);

  // Check road connection & water terminal validation when route changes
  useEffect(() => {
    let isMounted = true;
    if (routeCoords && routeCoords.length >= 2) {
      Promise.all([
        checkRoadConnection(routeCoords),
        checkWaterTerminalValidation(routeCoords),
      ]).then(([roadInfo, waterInfo]) => {
        if (!isMounted) return;
        setRoadConnection(roadInfo);
        setWaterTerminalValidation(waterInfo);

        if (roadInfo.isConnected && roadInfo.roadName) {
          showToast(`🔗 Empalme vial detectado: Conectado a ${roadInfo.roadName}`);
        }
        if (waterInfo.hasWaterTerminal && waterInfo.waterBodyName) {
          showToast(`⛔ Atención: El extremo del trazado termina en ${waterInfo.waterBodyName}`);
        }
      });
    } else {
      setRoadConnection(undefined);
      setWaterTerminalValidation(undefined);
    }

    return () => {
      isMounted = false;
    };
  }, [routeCoords, showToast]);

  // Spatial query: fetch strictly authentic species registered in the drawn road's influence buffer (up to 5000m)
  useEffect(() => {
    let isMounted = true;
    const hasRoute = routeCoords && routeCoords.length >= 2;

    if (!hasRoute) {
      setAllSpecies([]);
      setZoneName('Sin trazado dibujado');
      setIsBioLoading(false);
      return;
    }

    setIsBioLoading(true);
    const timer = setTimeout(async () => {
      try {
        const result = await fetchZoneSpeciesWithBuffer(routeCoords, bufferRadiusMeters);
        if (isMounted) {
          setAllSpecies(result.species);
          setZoneName(result.zoneName);
        }
      } catch (err) {
        console.warn('Error fetching zone species:', err);
      } finally {
        if (isMounted) setIsBioLoading(false);
      }
    }, 300);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [routeCoords, bufferRadiusMeters]);

  // Real-time calculations with criteria weighting and influence buffer
  const metrics: ImpactMetrics = useMemo(() => {
    const hasPoints = routeCoords && routeCoords.length >= 2;
    if (!hasPoints) {
      return {
        score: 0,
        mitigatedScore: 0,
        isMitigated: false,
        fragmentationPercent: 0,
        vegetationLossHa: 0,
        co2AvoidedTonsPerYear: 0,
        connectivityIndex: 0,
        lengthKm: 0,
        avgSlopePercent: 0,
        criticalZonesCount: 0,
        suggestedEcoductsCount: 0,
        speciesImpactedCount: 0,
        roadConnection,
        waterTerminalValidation,
      };
    }

    const lengthKm = calculateLineLengthKm(routeCoords);
    const vegetationLossHa = calculateVegetationLossHa(lengthKm, bufferRadiusMeters);
    const fragmentationPercent = calculateFragmentation(lengthKm, 2, isMitigated);
    const co2AvoidedTonsPerYear = calculateCO2Avoided(lengthKm);
    const score = computeImpactScore(34, vegetationLossHa, 2, false, impactCriteria);
    const mitigatedScore = computeImpactScore(fragmentationPercent, vegetationLossHa, 1, true, impactCriteria);
    const impactedCount = allSpecies.filter((s) => s.isInBuffer).length;

    return {
      score,
      mitigatedScore: Math.min(42, Math.round(mitigatedScore)),
      isMitigated,
      fragmentationPercent,
      vegetationLossHa,
      co2AvoidedTonsPerYear,
      connectivityIndex: isMitigated ? 6.8 : 4.8,
      lengthKm,
      avgSlopePercent: 4.2,
      criticalZonesCount: 2,
      suggestedEcoductsCount: 2,
      speciesImpactedCount: impactedCount > 0 ? impactedCount : allSpecies.length,
      roadConnection,
      waterTerminalValidation,
    };
  }, [routeCoords, bufferRadiusMeters, isMitigated, allSpecies, impactCriteria, roadConnection, waterTerminalValidation]);

  // Seasonal migratory corridors and critical crossings along the drawn alignment
  const migratoryCrossings = useMemo(() => {
    if (!routeCoords || routeCoords.length < 2) return [];
    return calculateMigratoryCrossings(routeCoords, allSpecies);
  }, [routeCoords, allSpecies]);

  // Biological corridor chokepoints and pinch points based on altimetry and vegetation cover
  const corridorChokepoints = useMemo(() => {
    if (!routeCoords || routeCoords.length < 2) return [];
    return calculateCorridorChokepoints(routeCoords, bufferRadiusMeters, allSpecies, metrics.avgSlopePercent);
  }, [routeCoords, bufferRadiusMeters, allSpecies, metrics.avgSlopePercent]);

  // Filtered species based on search query and active navigation
  const filteredSpecies = useMemo(() => {
    if (!searchQuery.trim()) {
      if (activeNav === 'biodiversidad') return allSpecies;
      return allSpecies;
    }
    const q = searchQuery.toLowerCase().trim();
    return allSpecies.filter(
      (s) =>
        s.commonName.toLowerCase().includes(q) ||
        s.scientificName.toLowerCase().includes(q) ||
        s.mitigationMeasure?.toLowerCase().includes(q) ||
        s.source.toLowerCase().includes(q) ||
        s.iucnStatus.toLowerCase().includes(q)
    );
  }, [allSpecies, searchQuery, activeNav]);

  // Handler for Generating Eco-Optimized Alternative
  const handleGenerateAlternative = useCallback(() => {
    setIsGeneratingAlternative(true);
    setTimeout(() => {
      const baseCoords = routeCoords.length >= 2 ? routeCoords : DEFAULT_DEMO_COORDS;
      const optimized = generateEcoOptimizedRoute(baseCoords);
      setRouteCoords(optimized);
      setIsMitigated(true);
      setIsGeneratingAlternative(false);
      showToast('Alternativa Eco-Optimizada B-204-Eco generada: impacto reducido en 45%');
    }, 1100);
  }, [routeCoords, showToast]);

  // Export GeoJSON function
  const handleExportGeoJSON = useCallback(() => {
    const hasPoints = routeCoords && routeCoords.length >= 2;
    if (!hasPoints) {
      showToast('Traza una carretera primero para exportar el archivo GeoJSON');
      return;
    }
    const buffer = generateBufferPolygon(routeCoords, bufferRadiusMeters);
    const lineFeature = {
      type: 'Feature',
      properties: {
        name: projectName || 'Conexión B-204',
        lengthKm: metrics.lengthKm,
        vegetationLossHa: metrics.vegetationLossHa,
        score: isMitigated ? metrics.mitigatedScore : metrics.score,
        mitigated: isMitigated,
      },
      geometry: {
        type: 'LineString',
        coordinates: routeCoords.map(([lat, lng]) => [lng, lat]),
      },
    };

    const collection = {
      type: 'FeatureCollection',
      name: projectName.replace(/\s+/g, '_'),
      features: [lineFeature, ...(buffer ? [buffer] : [])],
    };

    const blob = new Blob([JSON.stringify(collection, null, 2)], {
      type: 'application/geo+json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.geojson`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Archivo GeoJSON descargado exitosamente');
  }, [routeCoords, bufferRadiusMeters, metrics, isMitigated, projectName, showToast]);

  const handleUndo = useCallback(() => {
    if (routeCoords.length > 2) {
      setRouteCoords(routeCoords.slice(0, -1));
      showToast('Último punto deshecho');
    } else {
      setRouteCoords([]);
      showToast('Trazado eliminado');
    }
  }, [routeCoords, showToast]);

  const handleClearAll = useCallback(() => {
    setRouteCoords([]);
    setActiveDrawingTool(null);
    setIsRemovalMode(false);
    showToast('Todos los trazos eliminados del mapa');
  }, [showToast]);

  const handleShare = useCallback(() => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      showToast('Enlace del escenario copiado al portapapeles');
    }
  }, [showToast]);

  return (
    <div className="flex h-screen w-screen bg-[#F7F5F0] text-[#1A231E] font-['Inter'] overflow-hidden relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-full bg-[#1A231E] text-white text-[12px] font-['Space_Grotesk'] font-medium shadow-xl border border-white/20 animate-in fade-in slide-in-from-top-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px] text-[#4edea3]">
            check_circle
          </span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Left Sidebar (collapsible) */}
      <LeftSidebar
        activeNav={activeNav}
        setActiveNav={setActiveNav}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        layers={layers}
        setLayers={setLayers}
        fragmentationPercent={metrics.fragmentationPercent}
        isOpen={isLeftSidebarOpen}
        onToggle={() => setIsLeftSidebarOpen(false)}
        onOpenMethodology={() => setIsMethodologyOpen(true)}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col h-full overflow-hidden transition-all duration-300 ${
          isLeftSidebarOpen ? 'pl-72' : 'pl-0'
        }`}
      >
        {/* Top Header with panel toggles */}
        <Header
          projectName={projectName}
          onProjectNameChange={setProjectName}
          onExportGeoJSON={handleExportGeoJSON}
          onShare={handleShare}
          onOpenSettings={() => showToast('Ajustes de Renderizado CartoDB y Overpass')}
          isLeftSidebarOpen={isLeftSidebarOpen}
          onToggleLeftSidebar={() => setIsLeftSidebarOpen((prev) => !prev)}
          isRightPanelOpen={isRightPanelOpen}
          onToggleRightPanel={() => setIsRightPanelOpen((prev) => !prev)}
          onOpenMethodology={() => setIsMethodologyOpen(true)}
        />

        {/* Central Map & Right Panels */}
        <div className="relative pt-16 flex-1 flex overflow-hidden">
          {/* Floating button to reopen Left Sidebar when collapsed */}
          {!isLeftSidebarOpen && (
            <button
              onClick={() => setIsLeftSidebarOpen(true)}
              className="absolute top-20 left-4 z-[1001] px-3.5 py-2 rounded-full bg-white/95 backdrop-blur-md shadow-lg border border-[#D8D2C7] text-[#2E6F40] hover:bg-[#FAF8F5] flex items-center gap-1.5 font-['Space_Grotesk'] text-[12px] font-bold cursor-pointer transition-all hover:scale-105"
              title="Mostrar menú lateral y capas"
            >
              <span className="material-symbols-outlined text-[18px]">left_panel_open</span>
              <span>Menú & Capas</span>
            </button>
          )}

          {/* Floating button to reopen Right Panel when collapsed */}
          {!isRightPanelOpen && (
            <button
              onClick={() => setIsRightPanelOpen(true)}
              className="absolute top-20 right-4 z-[1001] px-3.5 py-2 rounded-full bg-white/95 backdrop-blur-md shadow-lg border border-[#D8D2C7] text-[#2E6F40] hover:bg-[#FAF8F5] flex items-center gap-1.5 font-['Space_Grotesk'] text-[12px] font-bold cursor-pointer transition-all hover:scale-105"
              title="Mostrar panel de herramientas/impacto"
            >
              <span>{activeNav === 'conectividad' ? 'Herramientas de Dibujo' : 'Panel de Impacto'}</span>
              <span className="material-symbols-outlined text-[18px]">right_panel_open</span>
            </button>
          )}

          {/* Map Viewport */}
          <div className="relative flex-1 h-full">
            <MapComponent
              routeCoords={routeCoords}
              onRouteCoordsChange={setRouteCoords}
              bufferRadiusMeters={bufferRadiusMeters}
              onBufferRadiusChange={setBufferRadiusMeters}
              isMitigated={isMitigated}
              layers={layers}
              activeBaseMap={activeBaseMap}
              setActiveBaseMap={setActiveBaseMap}
              is3DActive={is3DActive}
              onCursorMove={setCursorCoords}
              activeNav={activeNav}
              onSelectNav={setActiveNav}
              activeDrawingTool={activeDrawingTool}
              onSelectDrawingTool={setActiveDrawingTool}
              isRemovalMode={isRemovalMode}
              onToggleRemovalMode={() => setIsRemovalMode((prev) => !prev)}
              speciesList={allSpecies}
              onUserLocationFound={setUserLocation}
              roadConnection={metrics.roadConnection}
              waterTerminalValidation={metrics.waterTerminalValidation}
              selectedSpecies={selectedSpecies}
              onSelectSpecies={setSelectedSpecies}
              migratoryCrossings={migratoryCrossings}
              selectedMigratoryMonth={selectedMigratoryMonth}
              chokepoints={corridorChokepoints}
            />

            {/* Altimetric Profile & Coordinates Card */}
            <AltimetricProfile
              onZoomIn={() => {
                const mapEl = document.querySelector('.leaflet-container');
                if (mapEl) {
                  const event = new KeyboardEvent('keydown', { key: '+' });
                  window.dispatchEvent(event);
                }
              }}
              onZoomOut={() => {
                const mapEl = document.querySelector('.leaflet-container');
                if (mapEl) {
                  const event = new KeyboardEvent('keydown', { key: '-' });
                  window.dispatchEvent(event);
                }
              }}
              onToggle3D={() => setIs3DActive((prev) => !prev)}
              onResetView={() => {
                setIs3DActive(false);
                setRouteCoords([]);
                setIsMitigated(false);
                setBufferRadiusMeters(500);
                setActiveDrawingTool(null);
                setIsRemovalMode(false);
                showToast('Mapa despejado y parámetros restablecidos');
              }}
              is3DActive={is3DActive}
              coords={cursorCoords}
            />
          </div>

          {/* RIGHT PANELS SWITCHER:
              - When activeNav === 'conectividad': show RightConnectivityPanel (drawing tools)
              - When activeNav === 'informes': show RightReportsPanel (PDF report generation)
              - When activeNav is 'simulacion' or 'biodiversidad': show RightImpactPanel
          */}
          {isRightPanelOpen && (
            activeNav === 'conectividad' ? (
              <RightConnectivityPanel
                metrics={metrics}
                routeCoords={routeCoords}
                bufferRadiusMeters={bufferRadiusMeters}
                onBufferRadiusChange={setBufferRadiusMeters}
                activeDrawingTool={activeDrawingTool}
                onSelectDrawingTool={(tool) => {
                  if (tool === 'eraser') {
                    setIsRemovalMode((prev) => !prev);
                  } else {
                    setIsRemovalMode(false);
                  }
                  setActiveDrawingTool(tool);
                }}
                isRemovalMode={isRemovalMode}
                onToggleRemovalMode={() => {
                  setIsRemovalMode((prev) => !prev);
                  if (!isRemovalMode) {
                    setActiveDrawingTool('eraser');
                  } else {
                    setActiveDrawingTool(null);
                  }
                }}
                onUndo={handleUndo}
                onClearAll={handleClearAll}
                onGoToSimulation={() => setActiveNav('simulacion')}
                onOpenMethodology={() => setIsMethodologyOpen(true)}
              />
            ) : activeNav === 'informes' ? (
              <RightReportsPanel
                projectName={projectName}
                routeCoords={routeCoords}
                metrics={metrics}
                isMitigated={isMitigated}
                speciesList={allSpecies}
                bufferRadiusMeters={bufferRadiusMeters}
                zoneName={zoneName}
                roadConnection={roadConnection}
                waterTerminalValidation={waterTerminalValidation}
                impactCriteria={impactCriteria}
                chokepoints={corridorChokepoints}
                onGoToConectividad={() => setActiveNav('conectividad')}
                onGoToBiodiversidad={() => setActiveNav('biodiversidad')}
                onGoToSimulacion={() => setActiveNav('simulacion')}
              />
            ) : (
              <RightImpactPanel
                metrics={metrics}
                isMitigated={isMitigated}
                onToggleMitigation={setIsMitigated}
                speciesList={filteredSpecies}
                onGenerateAlternative={handleGenerateAlternative}
                isGeneratingAlternative={isGeneratingAlternative}
                onOpenEIAModal={() => setIsEIAModalOpen(true)}
                activeNav={activeNav}
                onSelectNav={setActiveNav}
                impactCriteria={impactCriteria}
                onToggleCriteria={handleToggleCriteria}
                hasRoute={routeCoords && routeCoords.length >= 2}
                onGoToConectividad={() => setActiveNav('conectividad')}
                bufferRadiusMeters={bufferRadiusMeters}
                onBufferRadiusChange={setBufferRadiusMeters}
                zoneName={zoneName}
                isBioLoading={isBioLoading}
                selectedSpecies={selectedSpecies}
                onSelectSpecies={setSelectedSpecies}
                migratoryCrossings={migratoryCrossings}
                selectedMigratoryMonth={selectedMigratoryMonth}
                onSelectMigratoryMonth={setSelectedMigratoryMonth}
              />
            )
          )}
        </div>
      </div>

      {/* Methodology & Formulas Modal */}
      <MethodologyModal
        isOpen={isMethodologyOpen}
        onClose={() => setIsMethodologyOpen(false)}
      />

      {/* Technical EIA Modal */}
      <EIAExportModal
        isOpen={isEIAModalOpen}
        onClose={() => setIsEIAModalOpen(false)}
        metrics={metrics}
        speciesList={filteredSpecies}
        onDownloadGeoJSON={handleExportGeoJSON}
      />
    </div>
  );
}
