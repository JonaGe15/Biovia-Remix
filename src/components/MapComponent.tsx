import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import '@geoman-io/leaflet-geoman-free';
import {
  calculateLineLengthKm,
  generateBufferPolygon,
  calculateCandidateEcoducts,
} from '../utils/geoCalculations';
import {
  LayerVisibility,
  DrawingToolType,
  RoadConnectionInfo,
  WaterTerminalValidation,
} from '../types';

interface MapComponentProps {
  routeCoords: [number, number][];
  onRouteCoordsChange: (coords: [number, number][]) => void;
  bufferRadiusMeters: number;
  onBufferRadiusChange: (radius: number) => void;
  isMitigated: boolean;
  layers: LayerVisibility;
  activeBaseMap: 'positron' | 'satellite';
  setActiveBaseMap: (base: 'positron' | 'satellite') => void;
  is3DActive: boolean;
  onCursorMove: (coords: { lat: number; lng: number }) => void;
  activeNav: string;
  onSelectNav?: (nav: string) => void;
  activeDrawingTool?: DrawingToolType | null;
  onSelectDrawingTool?: (tool: DrawingToolType) => void;
  isRemovalMode?: boolean;
  onToggleRemovalMode?: () => void;
  speciesList?: import('../types').SpeciesRecord[];
  onUserLocationFound?: (coords: { lat: number; lng: number }) => void;
  roadConnection?: RoadConnectionInfo;
  waterTerminalValidation?: WaterTerminalValidation;
  selectedSpecies?: import('../types').SpeciesRecord | null;
  onSelectSpecies?: (sp: import('../types').SpeciesRecord | null) => void;
  migratoryCrossings?: import('../types').MigratoryCrossing[];
  selectedMigratoryMonth?: number | null;
  chokepoints?: import('../types').CorridorChokepoint[];
}

export const MapComponent: React.FC<MapComponentProps> = ({
  routeCoords,
  onRouteCoordsChange,
  bufferRadiusMeters,
  onBufferRadiusChange,
  isMitigated,
  layers,
  activeBaseMap,
  setActiveBaseMap,
  is3DActive,
  onCursorMove,
  activeNav,
  onSelectNav,
  activeDrawingTool,
  onSelectDrawingTool,
  isRemovalMode: externalRemovalMode,
  onToggleRemovalMode: externalToggleRemovalMode,
  speciesList,
  onUserLocationFound,
  roadConnection,
  waterTerminalValidation,
  selectedSpecies,
  onSelectSpecies,
  migratoryCrossings,
  selectedMigratoryMonth,
  chokepoints,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  const baseLayerPositronRef = useRef<L.TileLayer | null>(null);
  const baseLayerSatelliteRef = useRef<L.TileLayer | null>(null);

  const routePolylineRef = useRef<L.Polyline | null>(null);
  const routeInnerLineRef = useRef<L.Polyline | null>(null);
  const bufferGeoJsonRef = useRef<L.GeoJSON | null>(null);
  const waypointMarkersRef = useRef<L.Marker[]>([]);
  const ecoductMarkersRef = useRef<L.Marker[]>([]);
  const speciesMarkersRef = useRef<L.Marker[]>([]);
  const roadConnectionMarkersRef = useRef<L.Marker[]>([]);
  const waterWarningMarkerRef = useRef<L.Marker | null>(null);
  const userLocationMarkerRef = useRef<L.Marker | null>(null);
  const migratoryLayerRef = useRef<L.LayerGroup | null>(null);
  const selectedSightingMarkerRef = useRef<L.Marker | null>(null);
  const chokepointsLayerRef = useRef<L.LayerGroup | null>(null);

  // Territorial layers refs
  const protectedLayerRef = useRef<L.LayerGroup | null>(null);
  const corridorLayerRef = useRef<L.LayerGroup | null>(null);
  const riverLayerRef = useRef<L.LayerGroup | null>(null);
  const urbanLayerRef = useRef<L.LayerGroup | null>(null);
  const drawnItemsGroupRef = useRef<L.FeatureGroup | null>(null);

  const [activeTool, setActiveTool] = useState<'pan' | 'draw' | 'node' | 'eraser'>('pan');
  const [internalRemovalMode, setInternalRemovalMode] = useState(false);

  const isRemovalMode = externalRemovalMode !== undefined ? externalRemovalMode : internalRemovalMode;
  const setIsRemovalMode = (val: boolean) => setInternalRemovalMode(val);

  // Map Search / Geocoder state
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Biological Corridor Chokepoints Inspector state
  const [isChokepointsInspectorOpen, setIsChokepointsInspectorOpen] = useState(false);
  const [selectedChokepointId, setSelectedChokepointId] = useState<string | null>(null);

  const canDraw = activeNav === 'conectividad';

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Center on Andean Corridor (Quindío, Colombia) as default
    const map = L.map(mapContainerRef.current, {
      center: [4.655, -75.520],
      zoom: 12,
      zoomControl: false,
    });
    mapInstanceRef.current = map;

    // Clean Topographic / Positron Canvas (Watermark-free)
    baseLayerPositronRef.current = L.tileLayer(
      'https://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}',
      {
        attribution: '&copy; Esri, HERE, Garmin &copy; OpenStreetMap contributors',
        maxZoom: 16,
      }
    ).addTo(map);

    // High-res Satellite base
    baseLayerSatelliteRef.current = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{x}/{y}',
      {
        attribution: '&copy; Esri &copy; Maxar, Earthstar Geographics',
        maxZoom: 18,
      }
    );

    // Feature group for drawn items with Leaflet Geoman
    const drawnItems = new L.FeatureGroup();
    drawnItemsGroupRef.current = drawnItems;
    map.addLayer(drawnItems);

    // Setup Geoman
    if ((map as any).pm) {
      (map as any).pm.setGlobalOptions({
        layerGroup: drawnItems,
        snappable: true,
        snapDistance: 20,
        hintMarkerStyle: {
          color: '#2E6F40',
        },
        pathOptions: {
          color: '#2E6F40',
          fillColor: '#4D7C5F',
          fillOpacity: 0.25,
          weight: 5,
        },
      });

      // Handle shape creation
      map.on('pm:create', (e: any) => {
        if (e.shape === 'Line' && e.layer) {
          const latlngs = e.layer.getLatLngs() as L.LatLng[];
          const newCoords: [number, number][] = latlngs.map((l) => [l.lat, l.lng]);
          if (newCoords.length >= 2) {
            onRouteCoordsChange(newCoords);
          }
          drawnItems.removeLayer(e.layer);
          (map as any).pm.disableDraw();
          setActiveTool('pan');
        } else if (e.layer) {
          let title = 'Elemento de Infraestructura';
          if (e.shape === 'Circle') title = 'Glorieta / Intercambiador';
          else if (e.shape === 'Rectangle') title = 'Cuadro de Infraestructura (Peaje / Terminal)';
          else if (e.shape === 'Polygon') title = 'Zona Urbana / Asentamiento';
          e.layer.bindPopup(`<div class="p-1 font-sans text-xs"><strong class="text-[#2E6F40]">${title}</strong><div class="text-[11px] text-[#4A5D52] mt-0.5">Trazado por usuario en Conectividad Vial</div></div>`);
          drawnItems.addLayer(e.layer);
          (map as any).pm.disableDraw();
          setActiveTool('pan');
        }
      });

      // Handle layer removal
      map.on('pm:remove', () => {
        onRouteCoordsChange([]);
      });
    }

    // Geolocation: locate the map at the exact location of the user
    const placeUserMarker = (lat: number, lng: number, label: string) => {
      if (!mapInstanceRef.current) return;
      onCursorMove({ lat, lng });
      onUserLocationFound?.({ lat, lng });

      if (userLocationMarkerRef.current) {
        userLocationMarkerRef.current.setLatLng([lat, lng]);
      } else {
        const markerHtml = `
          <div class="relative flex items-center justify-center">
            <div class="w-8 h-8 rounded-full bg-blue-500/25 animate-ping absolute -inset-1"></div>
            <div class="w-5 h-5 rounded-full bg-blue-600 border-2 border-white shadow-lg flex items-center justify-center text-white">
              <div class="w-2 h-2 rounded-full bg-white"></div>
            </div>
            <div class="absolute -top-7 whitespace-nowrap bg-white/95 px-2 py-0.5 rounded-full shadow-sm border border-[#D8D2C7] text-[10px] font-bold text-blue-700 pointer-events-none">
              Tu Ubicación
            </div>
          </div>
        `;
        const userIcon = L.divIcon({
          html: markerHtml,
          className: 'custom-user-location-icon',
          iconSize: [20, 20],
          iconAnchor: [10, 10],
        });
        const m = L.marker([lat, lng], { icon: userIcon, zIndexOffset: 1000 }).addTo(mapInstanceRef.current);
        m.bindPopup(`<div class="p-1 text-xs font-semibold text-blue-800">Ubicación exacta del usuario (${label})</div>`);
        userLocationMarkerRef.current = m;
      }
    };

    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          if (mapInstanceRef.current) {
            mapInstanceRef.current.setView([latitude, longitude], 14);
            placeUserMarker(latitude, longitude, 'GPS');
          }
        },
        (err) => {
          console.info('GPS geolocation unavailable, using IP-based location fallback:', err.message);
          fetch('https://ipapi.co/json/')
            .then((r) => r.json())
            .then((data) => {
              if (data && data.latitude && data.longitude && mapInstanceRef.current) {
                mapInstanceRef.current.setView([data.latitude, data.longitude], 13);
                placeUserMarker(data.latitude, data.longitude, data.city || 'IP');
              }
            })
            .catch(() => {});
        },
        { timeout: 7000, enableHighAccuracy: true, maximumAge: 0 }
      );
    } else {
      fetch('https://ipapi.co/json/')
        .then((r) => r.json())
        .then((data) => {
          if (data && data.latitude && data.longitude && mapInstanceRef.current) {
            mapInstanceRef.current.setView([data.latitude, data.longitude], 13);
            placeUserMarker(data.latitude, data.longitude, data.city || 'IP');
          }
        })
        .catch(() => {});
    }

    // Cursor tracking
    map.on('mousemove', (e: L.LeafletMouseEvent) => {
      onCursorMove({ lat: e.latlng.lat, lng: e.latlng.lng });
    });

    // Create Territorial Mock Geometries (Reserva Altoandina, Río Quebrada Honda, etc.)
    initTerritorialLayers(map);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Keyboard ESC listener to finish drawing or cancel deletion mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        const map = mapInstanceRef.current;
        if (!map || !(map as any).pm) return;

        // Check if currently drawing a line
        const pm = (map as any).pm;
        const pmDraw = pm?.Draw;
        if (pmDraw && pmDraw.Line) {
          const isLineActive = typeof pmDraw.Line.enabled === 'function' ? pmDraw.Line.enabled() : pmDraw.Line._enabled;
          if (isLineActive) {
            // Extract vertices placed so far
            const drawnLayer = pmDraw.Line._layer;
            if (drawnLayer && typeof drawnLayer.getLatLngs === 'function') {
              const pts = drawnLayer.getLatLngs() as L.LatLng[];
              if (pts && pts.length >= 2) {
                const coords: [number, number][] = pts.map((p) => [p.lat, p.lng]);
                onRouteCoordsChange(coords);
              }
            }
            pmDraw.Line.disable();
            setActiveTool('pan');
            return;
          }
        }
        if (isRemovalMode) {
          (map as any).pm?.disableGlobalRemovalMode();
          setIsRemovalMode(false);
          setActiveTool('pan');
        } else {
          (map as any).pm?.disableDraw();
          setActiveTool('pan');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRemovalMode, onRouteCoordsChange]);

  // Turn off drawing if user leaves 'conectividad' tab
  useEffect(() => {
    if (!canDraw) {
      const map = mapInstanceRef.current;
      if (map && (map as any).pm) {
        (map as any).pm.disableDraw();
      }
      if (activeTool === 'draw' || activeTool === 'node') {
        setActiveTool('pan');
      }
    }
  }, [canDraw, activeTool]);

  // Handle active drawing tool from RightConnectivityPanel or local tools
  useEffect(() => {
    if (!activeDrawingTool) return;
    if (!canDraw) return;
    const map = mapInstanceRef.current;
    if (!map || !(map as any).pm) return;

    if (activeDrawingTool === 'eraser') {
      (map as any).pm.disableDraw();
      (map as any).pm.enableGlobalRemovalMode();
      setInternalRemovalMode(true);
      setActiveTool('eraser');
      return;
    }

    (map as any).pm.disableGlobalRemovalMode();
    setInternalRemovalMode(false);
    setActiveTool('draw');

    switch (activeDrawingTool) {
      case 'line-road':
        (map as any).pm.enableDraw('Line', {
          snappable: true,
          finishOn: 'dblclick',
          pathOptions: { color: '#2E6F40', weight: 6 },
        });
        break;
      case 'line-secondary':
        (map as any).pm.enableDraw('Line', {
          snappable: true,
          finishOn: 'dblclick',
          pathOptions: { color: '#4D7C5F', weight: 4 },
        });
        break;
      case 'line-pipe':
        (map as any).pm.enableDraw('Line', {
          snappable: true,
          finishOn: 'dblclick',
          pathOptions: { color: '#3B82A6', weight: 4, dashArray: '6, 6' },
        });
        break;
      case 'line-free':
        (map as any).pm.enableDraw('Line', {
          snappable: true,
          finishOn: 'dblclick',
          pathOptions: { color: '#6366F1', weight: 4 },
        });
        break;
      case 'circle-roundabout':
        (map as any).pm.enableDraw('Circle', {
          snappable: true,
          pathOptions: { color: '#E06D28', fillColor: '#E06D28', fillOpacity: 0.25 },
        });
        break;
      case 'box-infra':
        (map as any).pm.enableDraw('Rectangle', {
          snappable: true,
          pathOptions: { color: '#8A5D3B', fillColor: '#8A5D3B', fillOpacity: 0.3 },
        });
        break;
      case 'polygon-urban':
        (map as any).pm.enableDraw('Polygon', {
          snappable: true,
          finishOn: 'dblclick',
          pathOptions: { color: '#475569', fillColor: '#475569', fillOpacity: 0.35 },
        });
        break;
    }
  }, [activeDrawingTool, canDraw]);

  // Update base map layer when toggle changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (activeBaseMap === 'satellite') {
      if (baseLayerPositronRef.current && map.hasLayer(baseLayerPositronRef.current)) {
        map.removeLayer(baseLayerPositronRef.current);
      }
      if (baseLayerSatelliteRef.current && !map.hasLayer(baseLayerSatelliteRef.current)) {
        baseLayerSatelliteRef.current.addTo(map);
      }
    } else {
      if (baseLayerSatelliteRef.current && map.hasLayer(baseLayerSatelliteRef.current)) {
        map.removeLayer(baseLayerSatelliteRef.current);
      }
      if (baseLayerPositronRef.current && !map.hasLayer(baseLayerPositronRef.current)) {
        baseLayerPositronRef.current.addTo(map);
      }
    }
  }, [activeBaseMap]);

  // Territorial layers init
  const initTerritorialLayers = (map: L.Map) => {
    // 1. Protected Areas: Reserva Forestal Central & Santuario de Fauna
    const protectedGroup = L.layerGroup();
    const protectedPolygon1 = L.polygon(
      [
        [4.675, -75.545],
        [4.698, -75.535],
        [4.690, -75.505],
        [4.665, -75.515],
      ],
      {
        color: '#2E6F40',
        weight: 1.5,
        dashArray: '5, 4',
        fillColor: '#4D7C5F',
        fillOpacity: 0.18,
      }
    ).bindTooltip('Reserva Forestal Central (Protección Estricta)', {
      sticky: true,
      className: 'bg-white/90 text-[#1A231E] font-medium text-xs rounded-lg px-2 py-1 shadow-sm',
    });
    protectedGroup.addLayer(protectedPolygon1);
    protectedLayerRef.current = protectedGroup;
    if (layers.protectedAreas) protectedGroup.addTo(map);

    // 2. Corredores Biológicos: Corredor Biológico del Oso Andino
    const corridorGroup = L.layerGroup();
    const corridorPolygon = L.polygon(
      [
        [4.630, -75.560],
        [4.655, -75.530],
        [4.670, -75.490],
        [4.650, -75.480],
        [4.620, -75.520],
      ],
      {
        color: '#4D7C5F',
        weight: 1.5,
        dashArray: '3, 4',
        fillColor: '#2E6F40',
        fillOpacity: 0.12,
      }
    ).bindTooltip('Corredor Biológico del Oso Andino (Tremarctos)', {
      sticky: true,
      className: 'bg-white/90 text-[#1A231E] font-medium text-xs rounded-lg px-2 py-1 shadow-sm',
    });
    corridorGroup.addLayer(corridorPolygon);
    corridorLayerRef.current = corridorGroup;
    if (layers.corridors) corridorGroup.addTo(map);

    // 3. Cuencas Hidrográficas: Río Quebrada Honda & humedales
    const riverGroup = L.layerGroup();
    const riverLine = L.polyline(
      [
        [4.685, -75.550],
        [4.660, -75.525],
        [4.640, -75.510],
        [4.620, -75.495],
      ],
      {
        color: '#3B82A6',
        weight: 4,
        opacity: 0.85,
        lineCap: 'round',
      }
    ).bindTooltip('Río Quebrada Honda • Cuenca de Alta Sensibilidad', {
      sticky: true,
      className: 'bg-white/90 text-[#1A231E] font-medium text-xs rounded-lg px-2 py-1 shadow-sm',
    });
    riverGroup.addLayer(riverLine);

    // Wetland pod
    const wetland = L.circle([4.651, -75.518], {
      radius: 350,
      color: '#3B82A6',
      fillColor: '#3B82A6',
      fillOpacity: 0.25,
      weight: 1.5,
    }).bindTooltip('Humedal de Rivera Quebrada Honda (Rana de Cristal)', {
      sticky: true,
      className: 'bg-white/90 text-[#1A231E] font-medium text-xs rounded-lg px-2 py-1 shadow-sm',
    });
    riverGroup.addLayer(wetland);
    riverLayerRef.current = riverGroup;
    if (layers.waterways) riverGroup.addTo(map);

    // 4. Zonas Urbanas
    const urbanGroup = L.layerGroup();
    const urbanPoly = L.polygon(
      [
        [4.615, -75.565],
        [4.630, -75.550],
        [4.625, -75.535],
        [4.610, -75.550],
      ],
      {
        color: '#8C968E',
        weight: 1.5,
        fillColor: '#DDD8CE',
        fillOpacity: 0.25,
      }
    ).bindTooltip('Centro Poblado El Porvenir • Límite Urbano', {
      sticky: true,
      className: 'bg-white/90 text-[#1A231E] font-medium text-xs rounded-lg px-2 py-1 shadow-sm',
    });
    urbanGroup.addLayer(urbanPoly);
    urbanLayerRef.current = urbanGroup;
    if (layers.urbanZones) urbanGroup.addTo(map);
  };

  // Sync Layer Visibility
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (protectedLayerRef.current) {
      if (layers.protectedAreas && !map.hasLayer(protectedLayerRef.current)) {
        protectedLayerRef.current.addTo(map);
      } else if (!layers.protectedAreas && map.hasLayer(protectedLayerRef.current)) {
        map.removeLayer(protectedLayerRef.current);
      }
    }

    if (corridorLayerRef.current) {
      if (layers.corridors && !map.hasLayer(corridorLayerRef.current)) {
        corridorLayerRef.current.addTo(map);
      } else if (!layers.corridors && map.hasLayer(corridorLayerRef.current)) {
        map.removeLayer(corridorLayerRef.current);
      }
    }

    if (riverLayerRef.current) {
      if (layers.waterways && !map.hasLayer(riverLayerRef.current)) {
        riverLayerRef.current.addTo(map);
      } else if (!layers.waterways && map.hasLayer(riverLayerRef.current)) {
        map.removeLayer(riverLayerRef.current);
      }
    }

    if (urbanLayerRef.current) {
      if (layers.urbanZones && !map.hasLayer(urbanLayerRef.current)) {
        urbanLayerRef.current.addTo(map);
      } else if (!layers.urbanZones && map.hasLayer(urbanLayerRef.current)) {
        map.removeLayer(urbanLayerRef.current);
      }
    }
  }, [layers]);

  // Render & Update Route, Buffer Polygon, Waypoint Markers and Ecoducts
  const updateRouteGraphics = useCallback(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clean previous
    if (routePolylineRef.current) {
      map.removeLayer(routePolylineRef.current);
      routePolylineRef.current = null;
    }
    if (routeInnerLineRef.current) {
      map.removeLayer(routeInnerLineRef.current);
      routeInnerLineRef.current = null;
    }
    if (bufferGeoJsonRef.current) {
      map.removeLayer(bufferGeoJsonRef.current);
      bufferGeoJsonRef.current = null;
    }
    waypointMarkersRef.current.forEach((m) => map.removeLayer(m));
    waypointMarkersRef.current = [];
    ecoductMarkersRef.current.forEach((m) => map.removeLayer(m));
    ecoductMarkersRef.current = [];
    roadConnectionMarkersRef.current.forEach((m) => map.removeLayer(m));
    roadConnectionMarkersRef.current = [];
    if (waterWarningMarkerRef.current) {
      map.removeLayer(waterWarningMarkerRef.current);
      waterWarningMarkerRef.current = null;
    }

    // If no route, stop here (map has no markers!)
    if (!routeCoords || routeCoords.length < 2) {
      return;
    }

    // 1. Calculate and render Turf.js Buffer polygon
    const bufferFeature = generateBufferPolygon(routeCoords, bufferRadiusMeters);
    if (bufferFeature) {
      const bufferLayer = L.geoJSON(bufferFeature as any, {
        style: {
          color: '#4D7C5F',
          weight: 1.5,
          dashArray: '6, 6',
          fillColor: '#4D7C5F',
          fillOpacity: 0.16,
        },
      }).addTo(map);
      bufferGeoJsonRef.current = bufferLayer;
    }

    // 2. Render Road Alignment line
    const polyline = L.polyline(routeCoords, {
      color: '#2E6F40',
      weight: 6,
      opacity: 0.95,
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(map);

    // Click handler for route when removal mode is active
    polyline.on('click', () => {
      if (isRemovalMode) {
        onRouteCoordsChange([]);
      }
    });

    const innerLine = L.polyline(routeCoords, {
      color: '#FFFFFF',
      weight: 1.5,
      dashArray: '8, 6',
      opacity: 0.9,
    }).addTo(map);

    routePolylineRef.current = polyline;
    routeInnerLineRef.current = innerLine;

    // 3. Render Waypoint Draggable Markers
    const waypoints = routeCoords.map((coord, idx) => {
      const isStart = idx === 0;
      const isEnd = idx === routeCoords.length - 1;
      const label = isStart
        ? 'Nodo A (Inicio)'
        : isEnd
        ? `Nodo ${String.fromCharCode(65 + idx)} (Destino)`
        : `Nodo ${String.fromCharCode(65 + idx)}`;

      const markerHtml = `
        <div class="relative flex items-center justify-center cursor-move">
          <div class="w-5 h-5 rounded-full bg-[#FAF8F5] border-[3px] border-[#2E6F40] shadow-md flex items-center justify-center">
            <div class="w-2 h-2 rounded-full bg-[#2E6F40]"></div>
          </div>
          <div class="absolute -top-7 whitespace-nowrap bg-white/95 px-2 py-0.5 rounded-full shadow-sm border border-[#D8D2C7] text-[10px] font-bold text-[#1A231E]">
            ${label}
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: markerHtml,
        className: 'custom-waypoint-icon',
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });

      const marker = L.marker(coord, {
        icon: customIcon,
        draggable: true,
      }).addTo(map);

      marker.on('drag', (e: L.LeafletEvent) => {
        const markerPos = (e.target as L.Marker).getLatLng();
        const updated = [...routeCoords];
        updated[idx] = [markerPos.lat, markerPos.lng];
        polyline.setLatLngs(updated);
        innerLine.setLatLngs(updated);
      });

      marker.on('dragend', (e: L.LeafletEvent) => {
        const markerPos = (e.target as L.Marker).getLatLng();
        const updated = [...routeCoords];
        updated[idx] = [markerPos.lat, markerPos.lng];
        onRouteCoordsChange(updated);
      });

      marker.on('click', () => {
        if (isRemovalMode) {
          if (routeCoords.length > 2) {
            const updated = routeCoords.filter((_, i) => i !== idx);
            onRouteCoordsChange(updated);
          } else {
            onRouteCoordsChange([]);
          }
        }
      });

      return marker;
    });
    waypointMarkersRef.current = waypoints;

    // 4. Render Ecoduct Wildlife Crossings
    const lengthKm = calculateLineLengthKm(routeCoords);
    const ecoducts = calculateCandidateEcoducts(routeCoords, lengthKm);

    ecoducts.forEach((eco) => {
      const ecoHtml = `
        <div class="relative group cursor-pointer flex flex-col items-center">
          <div class="w-7 h-7 rounded-full bg-[#2E6F40]/20 flex items-center justify-center animate-ping absolute -inset-0.5"></div>
          <div class="relative w-7 h-7 rounded-lg bg-[#2E6F40] text-white flex items-center justify-center shadow-lg border border-white">
            <span class="material-symbols-outlined text-[16px]">alt_route</span>
          </div>
          <div class="mt-1 bg-white/95 backdrop-blur-sm px-2 py-0.5 rounded-md border border-[#D8D2C7] shadow-sm text-[9px] font-bold text-[#1A231E] whitespace-nowrap">
            ${eco.name}
          </div>
        </div>
      `;

      const ecoIcon = L.divIcon({
        html: ecoHtml,
        className: 'custom-ecoduct-icon',
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const ecoMarker = L.marker(eco.coordinates, { icon: ecoIcon })
        .bindPopup(
          `<div class="p-2 space-y-1">
            <div class="font-bold text-xs text-[#2E6F40]">${eco.name}</div>
            <div class="text-[11px] text-[#4A5D52]">Paso de Fauna Diseñado para:</div>
            <div class="text-[11px] font-semibold text-[#1A231E]">${eco.targetSpecies.join(', ')}</div>
            <div class="text-[10px] text-[#2E6F40] mt-1 font-semibold">Estado: ${isMitigated ? 'Activo en Simulación' : 'Recomendado'}</div>
          </div>`
        )
        .addTo(map);

      ecoductMarkersRef.current.push(ecoMarker);
    });

    // 5. Segment Callout Micro-Tags
    if (routeCoords[1]) {
      const tag1Html = `
        <div class="bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-full border border-[#D8D2C7] shadow-sm text-[10px] font-semibold text-[#2E6F40] whitespace-nowrap pointer-events-none">
          Sec. 1 • L: 4.8 km | Pend: 3.1%
        </div>
      `;
      const tag1Icon = L.divIcon({ html: tag1Html, className: 'segment-tag-icon', iconSize: [140, 24], iconAnchor: [70, 12] });
      const tag1Marker = L.marker([routeCoords[1][0] - 0.008, routeCoords[1][1] - 0.015], { icon: tag1Icon, interactive: false }).addTo(map);
      ecoductMarkersRef.current.push(tag1Marker);
    }

    // 6. Road Connection Junction Markers (when connected to existing highway)
    if (roadConnection?.isConnected) {
      const createJunctionMarker = (coord: [number, number], label: string, name: string) => {
        const juncHtml = `
          <div class="relative group cursor-pointer flex flex-col items-center">
            <div class="w-8 h-8 rounded-full bg-[#2E6F40]/25 animate-ping absolute -inset-1"></div>
            <div class="w-7 h-7 rounded-full bg-[#1A4D2E] border-2 border-white shadow-lg flex items-center justify-center text-white">
              <span class="material-symbols-outlined text-[16px]">add_road</span>
            </div>
            <div class="absolute -top-7 whitespace-nowrap bg-[#1A4D2E] text-white px-2 py-0.5 rounded-full shadow-md text-[10px] font-bold flex items-center gap-1 border border-white/40">
              <span>🔗 Empalme:</span>
              <span class="text-[#84E296] truncate max-w-[140px]">${name}</span>
            </div>
          </div>
        `;
        const juncIcon = L.divIcon({
          html: juncHtml,
          className: 'custom-junction-icon',
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });
        const juncMarker = L.marker(coord, { icon: juncIcon, zIndexOffset: 950 })
          .bindPopup(
            `<div class="p-2 space-y-1">
              <div class="font-bold text-xs text-[#2E6F40] flex items-center gap-1">
                <span class="material-symbols-outlined text-[15px]">add_road</span>
                Empalme Vial Detectado
              </div>
              <div class="text-[12px] font-bold text-[#1A231E]">${name}</div>
              <div class="text-[10px] text-[#4A5D52]">${label}</div>
              <div class="text-[9px] text-[#2E6F40] bg-[#2E6F40]/10 p-1 rounded font-semibold mt-1">
                ✔ Trazado abierto conectado correctamente (no requiere cerrarse en bucle).
              </div>
            </div>`
          )
          .addTo(map);
        roadConnectionMarkersRef.current.push(juncMarker);
      };

      if (roadConnection.node === 'start' || roadConnection.node === 'both') {
        createJunctionMarker(
          routeCoords[0],
          'Nodo Inicial A empalmado a red vial',
          roadConnection.startConnectedRoad || roadConnection.roadName || 'Carretera Existente'
        );
      }
      if (roadConnection.node === 'end' || roadConnection.node === 'both') {
        createJunctionMarker(
          routeCoords[routeCoords.length - 1],
          'Nodo Final B empalmado a red vial',
          roadConnection.endConnectedRoad || roadConnection.roadName || 'Carretera Existente'
        );
      }
    }

    // 7. Water Terminal Warning Marker (when an endpoint terminates inside water/ocean)
    if (waterTerminalValidation?.hasWaterTerminal) {
      const invalidCoord =
        waterTerminalValidation.invalidCoordinates ||
        (waterTerminalValidation.invalidNode === 'start'
          ? routeCoords[0]
          : routeCoords[routeCoords.length - 1]);

      const warnHtml = `
        <div class="relative group cursor-pointer flex flex-col items-center">
          <div class="w-9 h-9 rounded-full bg-[#D33F36]/35 animate-ping absolute -inset-1"></div>
          <div class="w-8 h-8 rounded-full bg-[#D33F36] border-2 border-white shadow-xl flex items-center justify-center text-white">
            <span class="material-symbols-outlined text-[18px]">warning</span>
          </div>
          <div class="absolute -top-8 whitespace-nowrap bg-[#D33F36] text-white px-2 py-0.5 rounded-full shadow-lg text-[10px] font-bold flex items-center gap-1 border border-white/60 animate-bounce">
            <span>⛔ Extremo en Agua</span>
          </div>
        </div>
      `;
      const warnIcon = L.divIcon({
        html: warnHtml,
        className: 'custom-water-warning-icon',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const warnMarker = L.marker(invalidCoord, { icon: warnIcon, zIndexOffset: 1200 })
        .bindPopup(
          `<div class="p-2 space-y-1.5 max-w-[240px]">
            <div class="font-bold text-xs text-[#D33F36] flex items-center gap-1">
              <span class="material-symbols-outlined text-[16px]">warning</span>
              Extremo Terminal en Agua / Océano
            </div>
            <div class="text-[11px] font-semibold text-[#1A231E]">
              ${waterTerminalValidation.waterBodyName || 'Cuerpo Hídrico'}
            </div>
            <div class="text-[10px] text-[#4A5D52] leading-tight">
              ${waterTerminalValidation.message || 'Los trazos pueden cruzar masas de agua mediante puentes o viaductos, pero el punto terminal debe apoyarse en tierra firme.'}
            </div>
            <div class="text-[9px] text-[#B45309] bg-amber-50 p-1 rounded border border-amber-200">
              💡 Arrastra el marcador hacia tierra firme para validar el trazado.
            </div>
          </div>`
        )
        .addTo(map);

      waterWarningMarkerRef.current = warnMarker;
    }
  }, [routeCoords, bufferRadiusMeters, isMitigated, isRemovalMode, onRouteCoordsChange, roadConnection, waterTerminalValidation]);

  useEffect(() => {
    updateRouteGraphics();
  }, [updateRouteGraphics]);

  // Render species markers on the map
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear old markers
    speciesMarkersRef.current.forEach((m) => map.removeLayer(m));
    speciesMarkersRef.current = [];

    if (!speciesList || speciesList.length === 0) return;

    // Render species that have coordinates
    const withCoords = speciesList.filter(
      (sp) => sp.coordinates && (sp.isInBuffer || activeNav === 'biodiversidad')
    );

    withCoords.forEach((sp) => {
      const [lat, lng] = sp.coordinates!;
      const isFauna = sp.type === 'fauna';
      const isCrit = sp.iucnStatus === 'CR' || sp.iucnStatus === 'EN';
      const inBuffer = sp.isInBuffer;

      const markerHtml = `
        <div class="relative group cursor-pointer flex flex-col items-center">
          <div class="w-6 h-6 rounded-full ${
            inBuffer
              ? isCrit
                ? 'bg-[#D33F36]'
                : isFauna
                ? 'bg-[#2E6F40]'
                : 'bg-[#4D7C5F]'
              : 'bg-[#8C968E]'
          } text-white flex items-center justify-center shadow-md border-2 border-white transition-all hover:scale-125">
            <span class="material-symbols-outlined text-[13px]">${isFauna ? 'pets' : 'yard'}</span>
          </div>
          <div class="hidden group-hover:block absolute -top-8 whitespace-nowrap bg-white/95 px-2 py-0.5 rounded-md shadow-md border border-[#D8D2C7] text-[10px] font-bold text-[#1A231E] z-50">
            ${sp.commonName} (${sp.iucnStatus})
          </div>
        </div>
      `;

      const icon = L.divIcon({
        html: markerHtml,
        className: 'custom-species-marker',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      const m = L.marker([lat, lng], { icon })
        .bindPopup(
          `<div class="p-2 space-y-1 max-w-[220px]">
            <div class="font-bold text-xs text-[#2E6F40]">${sp.commonName}</div>
            <div class="text-[10px] italic text-[#4A5D52]">${sp.scientificName}</div>
            <div class="flex items-center gap-1.5 mt-1">
              <span class="text-[9px] font-bold px-1.5 py-0.2 rounded ${
                isCrit ? 'bg-[#FDEAE8] text-[#D33F36]' : 'bg-[#2E6F40]/10 text-[#2E6F40]'
              }">${sp.iucnCategoryLabel}</span>
              <span class="text-[10px] text-[#4A5D52]">${sp.source} API</span>
            </div>
            ${
              sp.distanceToLineMeters !== undefined
                ? `<div class="text-[10px] font-semibold text-[#1A231E] mt-1">Distancia al eje: ${sp.distanceToLineMeters} m ${
                    sp.isInBuffer
                      ? '• <span class="text-[#2E6F40]">Dentro de franja</span>'
                      : '• <span class="text-gray-500">Fuera de franja</span>'
                  }</div>`
                : ''
            }
            ${
              sp.mitigationMeasure
                ? `<div class="text-[9px] text-[#4A5D52] bg-gray-50 p-1 rounded mt-1 border border-gray-200 leading-snug">${sp.mitigationMeasure}</div>`
                : ''
            }
          </div>`
        )
        .addTo(map);

      m.on('click', () => {
        onSelectSpecies?.(sp);
      });

      speciesMarkersRef.current.push(m);
    });
  }, [speciesList, activeNav, bufferRadiusMeters, onSelectSpecies]);

  // Render seasonal migratory routes and critical crossing points on the map
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (migratoryLayerRef.current) {
      map.removeLayer(migratoryLayerRef.current);
      migratoryLayerRef.current = null;
    }

    if (!layers.migratoryRoutes || !migratoryCrossings || migratoryCrossings.length === 0) {
      return;
    }

    const group = L.layerGroup();

    migratoryCrossings.forEach((crossing) => {
      const isFiltered =
        selectedMigratoryMonth !== null &&
        selectedMigratoryMonth !== undefined &&
        !crossing.peakMonths.includes(selectedMigratoryMonth);

      const isCrit = crossing.sensitivityLevel === 'critical';
      const mainColor = isCrit ? '#D97706' : '#F59E0B';
      const opacity = isFiltered ? 0.25 : 0.85;

      // Draw corridor line crossing perpendicular to the road
      L.polyline(crossing.corridorLine, {
        color: mainColor,
        weight: isCrit ? 6 : 5,
        opacity,
        dashArray: '10, 8',
      }).addTo(group);

      // Shaded corridor ribbon
      L.polyline(crossing.corridorLine, {
        color: mainColor,
        weight: 30,
        opacity: isFiltered ? 0.08 : 0.22,
        lineCap: 'round',
      }).addTo(group);

      // Critical Crossing Point marker on the road alignment
      const markerHtml = `
        <div class="relative cursor-pointer flex flex-col items-center group">
          <span class="absolute -inset-1.5 rounded-full ${isCrit ? 'bg-[#D97706]/40 animate-ping' : 'bg-[#F59E0B]/30 animate-pulse'}"></span>
          <div class="relative w-8 h-8 rounded-full ${isCrit ? 'bg-[#D97706]' : 'bg-[#F59E0B]'} text-white flex items-center justify-center shadow-lg border-2 border-white transition-transform hover:scale-125">
            <span class="material-symbols-outlined text-[17px]">flight</span>
          </div>
          <div class="mt-1 whitespace-nowrap bg-[#1A231E]/95 text-white px-2 py-0.5 rounded-full text-[9px] font-bold shadow-md border border-amber-400/40">
            Km ${crossing.kmMarker} • ${crossing.peakMonthsLabels}
          </div>
        </div>
      `;

      const icon = L.divIcon({
        html: markerHtml,
        className: 'migratory-crossing-marker',
        iconSize: [32, 48],
        iconAnchor: [16, 16],
        popupAnchor: [0, -18],
      });

      const popupHtml = `
        <div class="p-3 max-w-[280px] space-y-2 font-sans">
          <div class="flex items-center justify-between">
            <span class="px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider font-mono ${
              isCrit
                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                : 'bg-orange-100 text-orange-900 border border-orange-300'
            }">
              CRUCE MIGRATORIO ${crossing.sensitivityLevel.toUpperCase()}
            </span>
            <span class="text-[10px] font-bold text-[#4A5D52]">Km ${crossing.kmMarker}</span>
          </div>
          <div class="font-bold text-[13px] text-[#1A231E] leading-tight">
            ${crossing.name}
          </div>
          <div class="p-2 rounded-lg bg-amber-50/90 border border-amber-200 text-[11px] text-amber-950 leading-snug">
            <div class="font-bold flex items-center gap-1 mb-0.5 text-[#B45309]">
              <span class="material-symbols-outlined text-[14px]">calendar_month</span>
              Periodo de Mayor Sensibilidad Ecológica:
            </div>
            <div class="font-semibold">${crossing.peakSeasonLabel}</div>
            <div class="text-[10px] text-amber-800 mt-0.5">Meses Pico: <strong>${crossing.peakMonthsLabels}</strong></div>
          </div>
          <div class="text-[10.5px] text-[#4A5D52] leading-snug">
            <strong>Especies en Tránsito:</strong> ${crossing.targetSpecies.join(', ')}
          </div>
          <div class="text-[10px] text-[#78350F] bg-[#FAF8F5] p-2 rounded-lg border border-[#D8D2C7]/60 leading-tight">
            <strong>Riesgo Crítico:</strong> ${crossing.ecologicalRiskDescription}
          </div>
          <div class="text-[10px] text-[#2E6F40] bg-[#EBF7EE] p-2 rounded-lg border border-[#2E6F40]/30 leading-tight">
            <strong>Medida de Mitigación Estacional:</strong> ${crossing.recommendedMitigation}
          </div>
        </div>
      `;

      L.marker(crossing.coordinates, { icon, zIndexOffset: 850 })
        .bindPopup(popupHtml)
        .addTo(group);
    });

    group.addTo(map);
    migratoryLayerRef.current = group;
  }, [layers.migratoryRoutes, migratoryCrossings, selectedMigratoryMonth]);

  // High-visibility pinpointing of the exact sighting location when user selects an impacted species in Biodiversidad & Fauna
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (selectedSightingMarkerRef.current) {
      map.removeLayer(selectedSightingMarkerRef.current);
      selectedSightingMarkerRef.current = null;
    }

    if (!selectedSpecies || !selectedSpecies.coordinates) return;

    const [lat, lng] = selectedSpecies.coordinates;
    const isFauna = selectedSpecies.type === 'fauna';
    const isCrit = selectedSpecies.iucnStatus === 'CR' || selectedSpecies.iucnStatus === 'EN';

    // Fly smoothly to exact observation coordinate
    map.flyTo([lat, lng], 15, { duration: 1.2 });

    const pinHtml = `
      <div class="relative flex flex-col items-center cursor-pointer">
        <!-- Pulsing radar rings -->
        <span class="absolute -top-1 w-10 h-10 rounded-full bg-[#2E6F40]/40 animate-ping"></span>
        <span class="absolute -top-2 w-12 h-12 rounded-full bg-[#2E6F40]/20 animate-pulse"></span>
        <!-- Solid icon pin -->
        <div class="relative w-9 h-9 rounded-full ${
          isCrit ? 'bg-[#D33F36]' : 'bg-[#2E6F40]'
        } text-white flex items-center justify-center shadow-2xl border-2 border-white ring-4 ring-black/15 z-50 transition-transform hover:scale-125">
          <span class="material-symbols-outlined text-[20px]">
            ${isFauna ? 'pets' : 'yard'}
          </span>
        </div>
        <div class="w-2.5 h-2.5 rotate-45 ${isCrit ? 'bg-[#D33F36]' : 'bg-[#2E6F40]'} -mt-1.5 shadow-md"></div>
        <div class="mt-1 whitespace-nowrap bg-[#1A231E]/95 text-white px-2.5 py-0.5 rounded-full text-[10px] font-bold shadow-xl border border-white/20 flex items-center gap-1">
          <span class="w-1.5 h-1.5 rounded-full bg-[#82C341] animate-pulse"></span>
          Avistamiento: ${selectedSpecies.commonName}
        </div>
      </div>
    `;

    const customIcon = L.divIcon({
      html: pinHtml,
      className: 'exact-sighting-pin',
      iconSize: [36, 54],
      iconAnchor: [18, 50],
      popupAnchor: [0, -52],
    });

    const inatUrl =
      selectedSpecies.inaturalistUrl ||
      `https://www.inaturalist.org/taxa?q=${encodeURIComponent(selectedSpecies.scientificName)}`;

    const popupHtml = `
      <div class="p-3 max-w-[270px] space-y-2 font-sans">
        <div class="flex items-center justify-between border-b border-gray-100 pb-1.5">
          <span class="flex items-center gap-1 text-[10px] font-bold text-[#2E6F40] uppercase tracking-wider">
            <span class="material-symbols-outlined text-[14px]">location_on</span>
            Registro Exacto (${selectedSpecies.source})
          </span>
          <span class="text-[9.5px] font-bold px-1.5 py-0.2 rounded ${
            isCrit ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
          }">${selectedSpecies.iucnCategoryLabel}</span>
        </div>
        ${
          selectedSpecies.imageUrl
            ? `<img src="${selectedSpecies.imageUrl}" alt="${selectedSpecies.commonName}" class="w-full h-28 object-cover rounded-lg border border-gray-200" />`
            : ''
        }
        <div>
          <div class="font-bold text-[14px] text-[#1A231E] leading-tight">${selectedSpecies.commonName}</div>
          <div class="text-[11px] italic text-[#4A5D52]">${selectedSpecies.scientificName}</div>
        </div>
        <div class="grid grid-cols-2 gap-1.5 p-2 rounded-lg bg-gray-50 border border-gray-200 text-[10px]">
          <div>
            <span class="block text-gray-500 text-[9px]">Coordenadas del Registro</span>
            <span class="font-mono font-bold text-[#1A231E]">${lat.toFixed(5)}°, ${lng.toFixed(5)}°</span>
          </div>
          <div class="text-right">
            <span class="block text-gray-500 text-[9px]">Distancia al Trazado</span>
            <span class="font-bold text-[#2E6F40]">${selectedSpecies.distanceToLineMeters ?? 0} m</span>
          </div>
        </div>
        <div class="flex items-center justify-between text-[10px] text-gray-600">
          <span>Observaciones en área: <strong>${selectedSpecies.observationCount || 1}</strong></span>
          <span class="text-[#2E6F40] font-semibold">Dentro de franja</span>
        </div>
        ${
          selectedSpecies.mitigationMeasure
            ? `<div class="text-[9.5px] text-[#4A5D52] bg-emerald-50/60 p-1.5 rounded border border-emerald-200/60 leading-tight">
                <strong>Mitigación:</strong> ${selectedSpecies.mitigationMeasure}
              </div>`
            : ''
        }
        <a href="${inatUrl}" target="_blank" rel="noopener noreferrer" class="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-[#2E6F40] hover:bg-[#245833] text-white text-[11px] font-semibold shadow-xs transition-all cursor-pointer">
          <span class="material-symbols-outlined text-[14px]">open_in_new</span>
          Abrir en iNaturalist
        </a>
      </div>
    `;

    const marker = L.marker([lat, lng], { icon: customIcon, zIndexOffset: 1200 })
      .bindPopup(popupHtml, {
        autoClose: false,
        closeOnClick: false,
        autoPan: true,
        autoPanPadding: [60, 60],
      })
      .addTo(map);

    marker.openPopup();
    selectedSightingMarkerRef.current = marker;
  }, [selectedSpecies]);

  // Render visual validation layer for biological corridor chokepoints and pinch points
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (chokepointsLayerRef.current) {
      map.removeLayer(chokepointsLayerRef.current);
      chokepointsLayerRef.current = null;
    }

    if (!layers.chokepoints || !chokepoints || chokepoints.length === 0) {
      return;
    }

    const group = L.layerGroup();

    chokepoints.forEach((choke) => {
      const isCritical = choke.severity === 'critical';
      const isHigh = choke.severity === 'high';
      const color = isCritical ? '#E11D48' : isHigh ? '#D97706' : '#EA580C';

      // 1. Constriction ribbon (translucent narrowing envelope polygon representing terrain constraint)
      const [lat, lng] = choke.coordinates;
      const offsetLat = 0.0035;
      const offsetLng = (choke.corridorWidthMeters / 111320) * 0.7; // scaled by residual corridor width
      const constrictionPolygon = L.polygon(
        [
          [lat + offsetLat, lng - offsetLng],
          [lat + offsetLat * 0.4, lng + offsetLng * 0.5],
          [lat - offsetLat * 0.4, lng + offsetLng * 0.4],
          [lat - offsetLat, lng - offsetLng * 0.8],
        ],
        {
          color,
          weight: 2,
          dashArray: '5, 5',
          fillColor: color,
          fillOpacity: 0.22,
        }
      ).bindTooltip(`Corredor Restringido: ${choke.name} (${choke.corridorWidthMeters}m ancho residual)`, {
        sticky: true,
        className: 'bg-white/95 text-[#1A231E] font-medium text-xs rounded-lg px-2 py-1 shadow-md border border-[#E11D48]/30',
      });
      group.addLayer(constrictionPolygon);

      // 2. Chokepoint marker with pulsing beacon
      const markerHtml = `
        <div class="relative cursor-pointer flex flex-col items-center group">
          <span class="absolute -inset-2 rounded-full ${isCritical ? 'bg-[#E11D48]/35 animate-ping' : 'bg-[#D97706]/30 animate-pulse'}"></span>
          <div class="relative w-8 h-8 rounded-full text-white flex items-center justify-center shadow-xl border-2 border-white transition-transform hover:scale-125" style="background-color: ${color};">
            <span class="material-symbols-outlined text-[17px]">crisis_alert</span>
          </div>
          <div class="mt-1 whitespace-nowrap text-white px-2 py-0.5 rounded-full text-[9px] font-bold shadow-md border border-white/40 flex items-center gap-1" style="background-color: ${color};">
            <span>Km ${choke.kmMarker} • ${choke.corridorWidthMeters}m</span>
          </div>
        </div>
      `;

      const icon = L.divIcon({
        html: markerHtml,
        className: 'corridor-chokepoint-marker',
        iconSize: [32, 48],
        iconAnchor: [16, 16],
        popupAnchor: [0, -18],
      });

      const popupHtml = `
        <div class="p-3 max-w-[285px] space-y-2 font-sans">
          <div class="flex items-center justify-between border-b pb-1.5" style="border-color: ${color}30">
            <span class="px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider font-mono uppercase" style="background-color: ${color}15; color: ${color}; border: 1px solid ${color}40">
              ESTRANGULAMIENTO ${choke.severity.toUpperCase()}
            </span>
            <span class="text-[10px] font-bold text-[#4A5D52]">Km ${choke.kmMarker}</span>
          </div>

          <div>
            <div class="font-bold text-[13px] text-[#1A231E] leading-tight">${choke.name}</div>
          </div>

          <!-- Altimetry & Vegetation Grid -->
          <div class="grid grid-cols-2 gap-1.5 p-2 rounded-lg bg-slate-50 border border-slate-200 text-[10px]">
            <div>
              <span class="block text-slate-500 text-[9px] font-medium">Altimetría / Pendiente:</span>
              <strong class="text-[#1A231E]">${choke.slopePercent}% (${choke.elevationMeters} msnm)</strong>
            </div>
            <div>
              <span class="block text-slate-500 text-[9px] font-medium">Cobertura Vegetal:</span>
              <strong class="text-[#2E6F40]">${choke.vegetationType.split(' ')[0]} (${choke.vegetationCoverPercent}%)</strong>
            </div>
          </div>

          <div class="p-2 rounded-lg bg-amber-50/90 border border-amber-200 text-[10.5px] text-amber-950 leading-snug">
            <div class="font-bold flex items-center gap-1 mb-0.5 text-amber-800 text-[10px]">
              <span class="material-symbols-outlined text-[13px]">terrain</span>
              Restricción Topográfica y Ancho:
            </div>
            <div>${choke.topographicConstraint}</div>
            <div class="mt-1 font-semibold text-amber-900">Ancho residual del corredor: <span class="text-rose-700 underline font-bold">${choke.corridorWidthMeters} metros</span></div>
          </div>

          <div class="text-[10px] text-[#4A5D52] space-y-0.5">
            <div><strong>Riesgo Ecológico:</strong> ${choke.ecologicalRisk}</div>
          </div>

          <div class="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-[10.5px] text-emerald-950 leading-tight">
            <div class="font-bold flex items-center gap-1 text-emerald-800 text-[10px] mb-0.5">
              <span class="material-symbols-outlined text-[13px]">check_circle</span>
              Medida de Mitigación Recomendada:
            </div>
            ${choke.recommendedMitigation}
          </div>
        </div>
      `;

      const marker = L.marker(choke.coordinates, { icon, zIndexOffset: 1100 })
        .bindPopup(popupHtml, { autoPanPadding: [50, 50] });

      marker.on('click', () => {
        setSelectedChokepointId(choke.id);
        setIsChokepointsInspectorOpen(true);
      });

      group.addLayer(marker);
    });

    group.addTo(map);
    chokepointsLayerRef.current = group;
  }, [layers.chokepoints, chokepoints]);

  // Center on user location manually
  const handleLocateUser = () => {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          if (mapInstanceRef.current) {
            mapInstanceRef.current.flyTo([latitude, longitude], 14, { duration: 1.2 });
          }
          if (userLocationMarkerRef.current) {
            userLocationMarkerRef.current.setLatLng([latitude, longitude]);
          }
          onCursorMove({ lat: latitude, lng: longitude });
          onUserLocationFound?.({ lat: latitude, lng: longitude });
        },
        () => {
          fetch('https://ipapi.co/json/')
            .then((r) => r.json())
            .then((data) => {
              if (data && data.latitude && data.longitude && mapInstanceRef.current) {
                mapInstanceRef.current.flyTo([data.latitude, data.longitude], 13, { duration: 1.2 });
                if (userLocationMarkerRef.current) {
                  userLocationMarkerRef.current.setLatLng([data.latitude, data.longitude]);
                }
                onCursorMove({ lat: data.latitude, lng: data.longitude });
                onUserLocationFound?.({ lat: data.latitude, lng: data.longitude });
              }
            })
            .catch(() => {});
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }
  };

  // Geoman Tool Handlers
  const handleEnableDrawLine = () => {
    if (!canDraw) {
      onSelectNav?.('conectividad');
      return;
    }
    setActiveTool('draw');
    setIsRemovalMode(false);
    const map = mapInstanceRef.current;
    if (map && (map as any).pm) {
      (map as any).pm.disableGlobalRemovalMode();
      (map as any).pm.enableDraw('Line', {
        snappable: true,
        finishOn: 'dblclick',
      });
    }
  };

  const handleEnablePan = () => {
    setActiveTool('pan');
    setIsRemovalMode(false);
    const map = mapInstanceRef.current;
    if (map && (map as any).pm) {
      (map as any).pm.disableDraw();
      (map as any).pm.disableGlobalEditMode();
      (map as any).pm.disableGlobalRemovalMode();
    }
  };

  const handleEnableAddNode = () => {
    if (!canDraw) {
      onSelectNav?.('conectividad');
      return;
    }
    setActiveTool('node');
    setIsRemovalMode(false);
    const map = mapInstanceRef.current;
    if (map && (map as any).pm) {
      (map as any).pm.disableGlobalRemovalMode();
      (map as any).pm.enableDraw('Marker');
    }
  };

  // Toggle Removal Mode for Trash Button
  const handleToggleRemovalMode = () => {
    if (externalToggleRemovalMode) {
      externalToggleRemovalMode();
    }
    const map = mapInstanceRef.current;
    if (!map || !(map as any).pm) return;

    if (isRemovalMode) {
      (map as any).pm.disableGlobalRemovalMode();
      setInternalRemovalMode(false);
      setActiveTool('pan');
    } else {
      (map as any).pm.disableDraw();
      (map as any).pm.enableGlobalRemovalMode();
      setInternalRemovalMode(true);
      setActiveTool('eraser');
    }
  };

  const handleClearRoute = () => {
    if (drawnItemsGroupRef.current) {
      drawnItemsGroupRef.current.clearLayers();
    }
    onRouteCoordsChange([]);
  };

  const handleUndo = () => {
    if (routeCoords.length > 2) {
      onRouteCoordsChange(routeCoords.slice(0, -1));
    } else {
      onRouteCoordsChange([]);
    }
  };

  // Geocoder Search Handler
  const handleSearchPlaces = async (val: string) => {
    setSearchQuery(val);
    if (!val.trim() || val.length < 3) {
      setSuggestions([]);
      return;
    }
    setIsSearching(true);
    try {
      const resp = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          val
        )}&limit=5&addressdetails=1`
      );
      if (resp.ok) {
        const data = await resp.json();
        setSuggestions(data);
        setShowSuggestions(true);
      }
    } catch (e) {
      console.warn('Geocoder search error:', e);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectPlace = (item: any) => {
    const map = mapInstanceRef.current;
    if (!map) return;
    const lat = parseFloat(item.lat);
    const lon = parseFloat(item.lon);
    map.flyTo([lat, lon], 12, { animate: true, duration: 1.5 });
    setSearchQuery(item.display_name.split(',')[0]);
    setShowSuggestions(false);
  };

  const routeLength = calculateLineLengthKm(routeCoords);
  const hasRoute = routeCoords && routeCoords.length >= 2;

  return (
    <div className="relative flex-1 h-full bg-[#F4F1EA] overflow-hidden">
      {/* 3D tilt perspective wrapper */}
      <div
        className={`w-full h-full transition-transform duration-700 ease-out ${
          is3DActive ? 'scale-[1.04] [transform:perspective(1100px)_rotateX(22deg)]' : ''
        }`}
      >
        <div ref={mapContainerRef} className="w-full h-full" />
      </div>

      {/* REMOVAL MODE ACTIVE NOTICE */}
      {isRemovalMode && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-[1001] bg-[#D33F36] text-white px-4 py-2 rounded-full shadow-lg border border-white/40 text-[12px] font-['Space_Grotesk'] font-semibold flex items-center gap-2 animate-pulse">
          <span className="material-symbols-outlined text-[18px]">delete_sweep</span>
          <span>Modo Borrar Activo: Haz clic en el trazado o hito para eliminarlo (ESC para salir)</span>
          <button
            onClick={handleToggleRemovalMode}
            className="ml-2 bg-white/20 hover:bg-white/30 px-2 py-0.5 rounded-full text-[10px] cursor-pointer"
          >
            Salir
          </button>
        </div>
      )}

      {/* WATER TERMINAL WARNING BANNER (When road starts or ends in water) */}
      {waterTerminalValidation?.hasWaterTerminal && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-[1002] bg-[#B91C1C] text-white px-4 py-2.5 rounded-2xl shadow-2xl border-2 border-white/50 text-[12px] font-['Space_Grotesk'] flex items-center gap-3 max-w-2xl animate-in fade-in slide-in-from-top-3">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[20px] text-amber-300">water</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-[12px] flex items-center gap-1.5">
              <span>⛔ Restricción Hidrológica: Extremo en {waterTerminalValidation.waterBodyName || 'Cuerpo de Agua / Océano'}</span>
            </div>
            <p className="text-[11px] text-white/95 mt-0.5 leading-snug">
              {waterTerminalValidation.message || 'Los trazos pueden cruzar masas de agua mediante puentes o viaductos, pero no pueden terminar dentro de ellas. Mueve el extremo terminal a tierra firme.'}
            </p>
          </div>
        </div>
      )}

      {/* ROAD CONNECTION DETECTED FLOATING NOTIFICATION */}
      {roadConnection?.isConnected && (
        <div className="absolute top-20 right-4 z-[1000] pointer-events-auto max-w-sm">
          <div className="p-3 rounded-2xl bg-white/95 backdrop-blur-xl shadow-lg border-2 border-[#2E6F40]/30 flex items-start gap-2.5 animate-in fade-in slide-in-from-right-3">
            <div className="w-8 h-8 rounded-xl bg-[#2E6F40] text-white flex items-center justify-center shrink-0 shadow-sm">
              <span className="material-symbols-outlined text-[18px]">add_road</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-['Space_Grotesk'] font-bold text-[#2E6F40] uppercase tracking-wider">
                  🔗 Empalme Vial Detectado
                </span>
                <span className="text-[9px] bg-[#2E6F40]/10 text-[#2E6F40] font-bold px-1.5 py-0.2 rounded">
                  Conectado
                </span>
              </div>
              <div className="font-['Space_Grotesk'] text-[12px] font-bold text-[#1A231E] truncate mt-0.5">
                {roadConnection.roadName}
              </div>
              <p className="text-[10px] text-[#4A5D52] mt-0.5 leading-snug">
                {roadConnection.details || 'Alineamiento abierto empalmado a la red vial existente (no requiere cerrarse en bucle).'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* FLOATING TOP TOOLBAR & GEOCODER */}
      <div className="absolute top-4 left-4 right-4 flex flex-wrap items-center justify-between gap-3 pointer-events-none z-[1000]">
        {/* Left: Tools & Buffer Slider */}
        <div className="pointer-events-auto flex items-center gap-1.5 p-1.5 rounded-full bg-white/90 backdrop-blur-2xl shadow-[0_6px_24px_rgba(26,35,30,0.08)] border border-white/90">
          <button
            onClick={handleEnablePan}
            className={`flex items-center justify-center w-9 h-9 rounded-full transition-all cursor-pointer ${
              activeTool === 'pan'
                ? 'bg-[#2E6F40] text-white shadow-xs'
                : 'text-[#4A5D52] hover:text-[#1A231E] hover:bg-[#EAE6DE]'
            }`}
            title="Mano / Desplazar"
            aria-label="Herramienta Desplazar"
          >
            <span className="material-symbols-outlined text-[19px]">pan_tool</span>
          </button>

          {/* Draw Button with Conectividad Vial check */}
          <button
            onClick={handleEnableDrawLine}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full font-['Space_Grotesk'] text-[12px] font-semibold transition-all cursor-pointer ${
              activeTool === 'draw'
                ? 'bg-[#2E6F40] text-white shadow-[0_2px_12px_rgba(46,111,64,0.3)]'
                : canDraw
                ? 'bg-[#FAF8F5] text-[#2E6F40] hover:bg-[#EAE6DE]'
                : 'bg-[#EAE6DE]/70 text-[#8C968E] cursor-not-allowed'
            }`}
            title={
              canDraw
                ? 'Trazar Carretera (Haz clic para colocar puntos, pulsa ESC para finalizar)'
                : 'Selecciona Conectividad Vial en el menú izquierdo para trazar'
            }
            aria-label="Trazar Eje"
          >
            <span className="material-symbols-outlined text-[18px]">timeline</span>
            <span>Trazar Eje</span>
            {activeTool === 'draw' && (
              <span className="text-[10px] bg-white/20 px-1.5 py-0.2 rounded font-mono">
                ESC p/ terminar
              </span>
            )}
          </button>

          <button
            onClick={handleEnableAddNode}
            disabled={!canDraw}
            className={`flex items-center justify-center w-9 h-9 rounded-full transition-all cursor-pointer ${
              activeTool === 'node'
                ? 'bg-[#2E6F40] text-white shadow-xs'
                : canDraw
                ? 'text-[#4A5D52] hover:text-[#1A231E] hover:bg-[#EAE6DE]'
                : 'text-[#8C968E] opacity-50 cursor-not-allowed'
            }`}
            title="Añadir Punto de Inflexión"
            aria-label="Añadir Punto"
          >
            <span className="material-symbols-outlined text-[19px]">add_location_alt</span>
          </button>

          {/* Locate User Button */}
          <button
            onClick={handleLocateUser}
            className="flex items-center justify-center w-9 h-9 rounded-full text-[#4A5D52] hover:text-[#2E6F40] hover:bg-[#EAE6DE] transition-all cursor-pointer"
            title="Centrar en mi ubicación exacta (GPS)"
            aria-label="Centrar en mi ubicación"
          >
            <span className="material-symbols-outlined text-[19px]">my_location</span>
          </button>

          <div className="h-5 w-px bg-[#D8D2C7] mx-0.5"></div>

          {/* Buffer Slider Pill with max 5000m */}
          <div className="flex items-center gap-2 px-3 py-1 bg-[#EFECE6]/85 rounded-full border border-[#D8D2C7]/70">
            <span className="material-symbols-outlined text-[#2E6F40] text-[17px]">radar</span>
            <span className="font-['Space_Grotesk'] text-[11px] text-[#4A5D52] whitespace-nowrap">
              Buffer: <strong className="text-[#2E6F40] font-semibold">{bufferRadiusMeters >= 1000 ? `${(bufferRadiusMeters / 1000).toFixed(1)}km` : `${bufferRadiusMeters}m`}</strong>
            </span>
            <input
              type="range"
              min="100"
              max="5000"
              step="100"
              value={bufferRadiusMeters}
              onChange={(e) => onBufferRadiusChange(Number(e.target.value))}
              className="w-20 h-1 accent-[#2E6F40] bg-[#D8D2C7] rounded-lg cursor-pointer"
              aria-label="Control de radio de buffer (hasta 5000m)"
            />
          </div>

          <div className="h-5 w-px bg-[#D8D2C7] mx-0.5"></div>

          <button
            onClick={handleUndo}
            disabled={!hasRoute}
            className="flex items-center justify-center w-8 h-8 rounded-full text-[#4A5D52] hover:text-[#1A231E] hover:bg-[#EAE6DE] transition-all cursor-pointer disabled:opacity-40"
            title="Deshacer último punto"
            aria-label="Deshacer trazo"
          >
            <span className="material-symbols-outlined text-[18px]">undo</span>
          </button>

          {/* Trash Button to Delete Selected Trace */}
          <button
            onClick={handleToggleRemovalMode}
            className={`flex items-center justify-center w-8 h-8 rounded-full transition-all cursor-pointer ${
              isRemovalMode
                ? 'bg-[#D33F36] text-white shadow-sm'
                : 'text-[#4A5D52] hover:text-[#D33F36] hover:bg-[#FDEAE8]'
            }`}
            title="Borrar trazos (activa el modo borrar para seleccionar qué eliminar)"
            aria-label="Borrar trazo seleccionado"
          >
            <span className="material-symbols-outlined text-[18px]">delete</span>
          </button>

          {hasRoute && (
            <button
              onClick={handleClearRoute}
              className="flex items-center justify-center w-8 h-8 rounded-full text-[#8C968E] hover:text-[#D33F36] hover:bg-[#FDEAE8] transition-all cursor-pointer"
              title="Limpiar todo el trazado"
              aria-label="Limpiar todo el trazado"
            >
              <span className="material-symbols-outlined text-[17px]">delete_sweep</span>
            </button>
          )}

          {/* Biological Corridor Chokepoints Validation Button */}
          {hasRoute && (
            <>
              <div className="h-5 w-px bg-[#D8D2C7] mx-0.5"></div>
              <button
                onClick={() => setIsChokepointsInspectorOpen((prev) => !prev)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full font-['Space_Grotesk'] text-[11px] font-semibold transition-all cursor-pointer ${
                  isChokepointsInspectorOpen
                    ? 'bg-[#E11D48] text-white shadow-md'
                    : 'bg-[#FAF8F5] text-[#E11D48] hover:bg-[#FFE4E6] border border-[#E11D48]/30'
                }`}
                title="Herramienta de validación visual de puntos de estrangulamiento de corredores biológicos"
              >
                <span className="material-symbols-outlined text-[16px]">crisis_alert</span>
                <span>Validar Estrangulamientos</span>
                {chokepoints && chokepoints.length > 0 && (
                  <span
                    className={`text-[9.5px] px-1.5 py-0.2 rounded-full font-bold ${
                      isChokepointsInspectorOpen ? 'bg-white/20 text-white' : 'bg-[#E11D48] text-white'
                    }`}
                  >
                    {chokepoints.length}
                  </span>
                )}
              </button>
            </>
          )}
        </div>

        {/* Center: OpenStreetMap Geocoder Place Search */}
        <div className="pointer-events-auto relative w-72">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/95 backdrop-blur-2xl shadow-[0_6px_24px_rgba(26,35,30,0.08)] border border-white/90 focus-within:border-[#2E6F40] focus-within:ring-2 focus-within:ring-[#2E6F40]/15 transition-all">
            <span className="material-symbols-outlined text-[#2E6F40] text-[18px]">search</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchPlaces(e.target.value)}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && suggestions.length > 0) {
                  handleSelectPlace(suggestions[0]);
                }
              }}
              placeholder="Buscar ciudad o lugar..."
              className="w-full bg-transparent border-0 text-[12px] text-[#1A231E] placeholder-[#8C968E] focus:outline-none"
              aria-label="Buscar lugar en el mapa"
            />
            {isSearching && (
              <span className="material-symbols-outlined text-[16px] animate-spin text-[#2E6F40]">
                sync
              </span>
            )}
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSuggestions([]);
                  setShowSuggestions(false);
                }}
                className="text-[#8C968E] hover:text-[#1A231E] text-xs cursor-pointer"
                aria-label="Limpiar búsqueda"
              >
                ✕
              </button>
            )}
          </div>

          {/* Autocomplete Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full mt-1.5 left-0 right-0 bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl border border-[#D8D2C7]/80 overflow-hidden py-1 z-[1010]">
              {suggestions.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectPlace(item)}
                  className="w-full px-3 py-2 text-left hover:bg-[#FAF8F5] flex flex-col border-b border-[#D8D2C7]/30 last:border-b-0 cursor-pointer"
                >
                  <span className="font-['Space_Grotesk'] text-[12px] font-semibold text-[#1A231E]">
                    {item.display_name.split(',')[0]}
                  </span>
                  <span className="text-[10px] text-[#4A5D52] truncate">
                    {item.display_name}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: GIS Layer Switcher */}
        <div className="pointer-events-auto flex items-center gap-1 p-1 rounded-full bg-white/90 backdrop-blur-2xl shadow-[0_6px_24px_rgba(26,35,30,0.08)] border border-white/90">
          <button
            onClick={() => setActiveBaseMap('satellite')}
            className={`px-3 py-1 rounded-full font-['Space_Grotesk'] text-[11px] transition-all cursor-pointer ${
              activeBaseMap === 'satellite'
                ? 'bg-[#2E6F40] text-white font-semibold shadow-xs'
                : 'text-[#4A5D52] hover:text-[#1A231E] hover:bg-[#EAE6DE]'
            }`}
          >
            Satélite
          </button>
          <button
            onClick={() => setActiveBaseMap('positron')}
            className={`px-3 py-1 rounded-full font-['Space_Grotesk'] text-[11px] transition-all cursor-pointer ${
              activeBaseMap === 'positron'
                ? 'bg-[#2E6F40] text-white font-semibold shadow-xs'
                : 'text-[#4A5D52] hover:text-[#1A231E] hover:bg-[#EAE6DE]'
            }`}
          >
            Topográfico GIS
          </button>
          <div className="px-3 py-1 rounded-full font-['Space_Grotesk'] text-[11px] text-[#4D7C5F] font-semibold flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#4D7C5F] animate-pulse"></span>
            Bio-Capas ON
          </div>
        </div>
      </div>

      {/* FLOATING ROAD METRIC BANNER */}
      <div className="absolute top-20 left-4 z-[1000] pointer-events-auto">
        <div className="p-3 rounded-xl bg-white/90 backdrop-blur-xl shadow-[0_8px_30px_rgba(26,35,30,0.08)] border border-white/90 flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#2E6F40]/10 flex items-center justify-center text-[#2E6F40]">
              <span className="material-symbols-outlined text-[20px]">conversion_path</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-['Space_Grotesk'] text-[#4A5D52] uppercase tracking-wider font-semibold">
                Traza Activa
              </span>
              <span className="font-['Space_Grotesk'] text-[15px] text-[#1A231E] leading-tight font-semibold">
                {hasRoute ? 'Eje Vial Diseñado' : 'Sin Trazado Inicial'}
              </span>
            </div>
          </div>
          <div className="h-8 w-px bg-[#D8D2C7]"></div>
          <div className="flex items-center gap-4 text-left">
            <div>
              <span className="text-[10px] text-[#4A5D52] block">Longitud</span>
              <span className="font-['Space_Grotesk'] text-[14px] text-[#2E6F40] font-bold">
                {hasRoute ? `${routeLength} km` : '0.0 km'}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-[#4A5D52] block">Pendiente</span>
              <span className="font-['Space_Grotesk'] text-[14px] text-[#1A231E] font-semibold">
                {hasRoute ? '4.2% prom.' : '--'}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-[#4A5D52] block">Desmonte</span>
              <span className="font-['Space_Grotesk'] text-[14px] text-[#D33F36] font-semibold">
                {hasRoute ? '28.4 ha' : '0.0 ha'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* VISUAL VALIDATION TOOL: BIOLOGICAL CORRIDOR CHOKEPOINTS FLOATING INSPECTOR */}
      {isChokepointsInspectorOpen && hasRoute && (
        <div className="absolute top-20 right-4 z-[1005] pointer-events-auto w-[360px] max-h-[82vh] flex flex-col bg-white/95 backdrop-blur-2xl rounded-2xl shadow-2xl border-2 border-[#E11D48]/30 overflow-hidden animate-in fade-in slide-in-from-right-4">
          {/* Header */}
          <div className="p-3.5 bg-gradient-to-r from-[#E11D48] to-[#BE123C] text-white flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">crisis_alert</span>
              </div>
              <div>
                <h4 className="font-['Space_Grotesk'] text-[12.5px] font-bold leading-tight">
                  Validación de Estrangulamientos
                </h4>
                <p className="text-[10px] text-white/90">
                  Topografía, altimetría y cobertura vegetal
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsChokepointsInspectorOpen(false)}
              className="w-6 h-6 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white text-xs cursor-pointer"
            >
              ✕
            </button>
          </div>

          {/* List of Detected Pinch Points */}
          <div className="p-3 space-y-2.5 overflow-y-auto flex-1">
            <div className="text-[11px] text-[#4A5D52] bg-rose-50/70 p-2 rounded-xl border border-rose-200/60 leading-snug">
              Se han detectado <strong>{chokepoints?.length || 0} puntos de estrangulamiento</strong> basados en gradientes de pendiente, altimetría montañosa y cobertura vegetal remanente.
            </div>

            {(!chokepoints || chokepoints.length === 0) ? (
              <div className="text-center py-6 text-[12px] text-[#8C968E]">
                No se detectaron estrangulamientos críticos en este trazado.
              </div>
            ) : (
              chokepoints.map((choke) => {
                const isCrit = choke.severity === 'critical';
                const isSel = selectedChokepointId === choke.id;
                return (
                  <div
                    key={choke.id}
                    className={`p-3 rounded-xl border transition-all space-y-2 ${
                      isSel
                        ? 'bg-rose-50/80 border-[#E11D48] ring-2 ring-[#E11D48]/20 shadow-sm'
                        : 'bg-white border-[#D8D2C7]/70 hover:border-[#E11D48]/50 shadow-xs'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#E11D48] animate-ping"></span>
                        <span className="font-['Space_Grotesk'] text-[12px] font-bold text-[#1A231E]">
                          {choke.name}
                        </span>
                      </div>
                      <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#E11D48]/15 text-[#E11D48]">
                        Km {choke.kmMarker}
                      </span>
                    </div>

                    <p className="text-[10.5px] text-[#4A5D52] leading-tight">
                      {choke.ecologicalRisk}
                    </p>

                    {/* Metrics Badge Grid */}
                    <div className="grid grid-cols-2 gap-1.5 text-[9.5px]">
                      <div className="p-1.5 rounded-lg bg-slate-50 border border-slate-200/70">
                        <span className="text-slate-500 block text-[8.5px]">Pendiente / Cota:</span>
                        <strong className="text-[#1A231E]">{choke.slopePercent}% ({choke.elevationMeters} msnm)</strong>
                      </div>
                      <div className="p-1.5 rounded-lg bg-emerald-50/80 border border-emerald-200/70">
                        <span className="text-emerald-700 block text-[8.5px]">Dosel / Cobertura:</span>
                        <strong className="text-emerald-900">{choke.vegetationCoverPercent}% ({choke.vegetationType.split(' ')[0]})</strong>
                      </div>
                    </div>

                    <div className="p-1.5 rounded-lg bg-amber-50 text-[9.5px] text-amber-900 border border-amber-200">
                      <strong>Ancho residual:</strong> <span className="text-rose-700 font-bold">{choke.corridorWidthMeters} metros</span>
                      <div className="text-[9px] text-[#4A5D52] mt-0.5">{choke.topographicConstraint}</div>
                    </div>

                    <div className="p-1.5 rounded-lg bg-emerald-50 text-[9.5px] text-emerald-900 border border-emerald-200">
                      <strong className="text-emerald-800">Mitigación:</strong> {choke.recommendedMitigation}
                    </div>

                    {/* Action Button: Fly to Chokepoint on Map */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedChokepointId(choke.id);
                        if (mapInstanceRef.current) {
                          mapInstanceRef.current.flyTo(choke.coordinates, 15, { animate: true, duration: 1.2 });
                        }
                      }}
                      className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-[#E11D48] hover:bg-[#BE123C] text-white font-['Space_Grotesk'] text-[11px] font-semibold shadow-xs transition-all cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[15px]">location_searching</span>
                      <span>Localizar e Inspeccionar en Mapa</span>
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* SUGGESTED CROSSINGS VISUAL LEGEND (Bottom Center) */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-auto z-[1000]">
        <div className="flex items-center gap-4 px-4 py-2 rounded-full bg-white/90 backdrop-blur-2xl shadow-[0_6px_20px_rgba(26,35,30,0.08)] border border-white/90 text-[11px] font-['Space_Grotesk']">
          <div className="flex items-center gap-2">
            <span className="w-3 h-2 rounded bg-[#2E6F40]"></span>
            <span className="text-[#1A231E] font-semibold">
              Ecoducto {hasRoute ? '(2)' : '(0)'}
            </span>
          </div>
          <div className="h-3 w-px bg-[#D8D2C7]"></div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#D33F36]"></span>
            <span className="text-[#4A5D52]">Conflicto Alto Impacto</span>
          </div>
          <div className="h-3 w-px bg-[#D8D2C7]"></div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#4D7C5F]"></span>
            <span className="text-[#4A5D52]">Reserva Núcleo</span>
          </div>
        </div>
      </div>
    </div>
  );
};
