export type IUCNCategory = 'CR' | 'EN' | 'VU' | 'NT' | 'LC' | 'DD';

export interface SpeciesRecord {
  id: string;
  commonName: string;
  scientificName: string;
  type: 'fauna' | 'flora';
  iucnStatus: IUCNCategory;
  iucnCategoryLabel: string;
  overlapKm?: number;
  lostAreaHa?: number;
  mitigationMeasure?: string;
  riskLevel: 'critical' | 'high' | 'medium' | 'low';
  source: 'GBIF' | 'iNaturalist' | 'IUCN';
  imageUrl?: string;
  coordinates?: [number, number];
  distanceToLineMeters?: number;
  isInBuffer?: boolean;
  observationCount?: number;
  inaturalistUrl?: string;
}

export interface RoadConnectionInfo {
  isConnected: boolean;
  node: 'start' | 'end' | 'both' | 'none';
  roadName?: string;
  roadType?: string;
  details?: string;
  startConnectedRoad?: string;
  endConnectedRoad?: string;
}

export interface WaterTerminalValidation {
  hasWaterTerminal: boolean;
  invalidNode?: 'start' | 'end' | 'both';
  waterBodyName?: string;
  message?: string;
  invalidCoordinates?: [number, number];
}

export interface ImpactMetrics {
  score: number; // 0-100
  mitigatedScore: number;
  isMitigated: boolean;
  fragmentationPercent: number; // e.g. +34% or +12%
  vegetationLossHa: number; // ha
  co2AvoidedTonsPerYear: number; // t/year
  connectivityIndex: number; // e.g. 7.2 -> 4.8 or 6.5
  lengthKm: number;
  avgSlopePercent: number;
  criticalZonesCount: number;
  suggestedEcoductsCount: number;
  speciesImpactedCount: number;
  roadConnection?: RoadConnectionInfo;
  waterTerminalValidation?: WaterTerminalValidation;
}

export interface EcoductPoint {
  id: string;
  name: string;
  kmMarker: number;
  coordinates: [number, number]; // [lat, lng]
  targetSpecies: string[];
  type: 'overpass' | 'underpass' | 'canopy_bridge';
}

export interface MigratoryCrossing {
  id: string;
  name: string;
  kmMarker: number;
  coordinates: [number, number]; // [lat, lng] on the road
  corridorLine: [[number, number], [number, number]]; // vector crossing the road
  sensitivityLevel: 'critical' | 'high' | 'medium';
  targetSpecies: string[];
  peakMonths: number[]; // 1 to 12 (Jan = 1, Dec = 12)
  peakMonthsLabels: string; // e.g. "Sep - Nov"
  peakSeasonLabel: string; // e.g. "Migración Estacional Otoñal"
  ecologicalRiskDescription: string;
  recommendedMitigation: string;
}

export interface CorridorChokepoint {
  id: string;
  name: string;
  kmMarker: number;
  coordinates: [number, number]; // [lat, lng]
  severity: 'critical' | 'high' | 'medium';
  slopePercent: number; // e.g. 18.5%
  elevationMeters: number; // e.g. 540 m s.n.m.
  vegetationCoverPercent: number; // e.g. 85%
  vegetationType: string; // e.g. 'Bosque Andino Húmedo / Galería Ribereña'
  corridorWidthMeters: number; // remaining width e.g. 95m (bottleneck)
  topographicConstraint: string; // e.g. 'Garganta fluvial entre laderas escarpadas (>18% pendiente)'
  ecologicalRisk: string; // e.g. 'Ruptura inminente de flujo biológico y alto riesgo de atropellamiento'
  recommendedMitigation: string; // e.g. 'Viaducto de rasante alta o Ecoducto mixto sobreelevado de 45 m'
}

export interface LayerVisibility {
  protectedAreas: boolean;
  corridors: boolean;
  waterways: boolean;
  urbanZones: boolean;
  sensitivityHeatmap: boolean;
  bufferZone: boolean;
  migratoryRoutes: boolean;
  chokepoints: boolean;
}

export interface ImpactCriteria {
  flora: boolean;
  fauna: boolean;
  corridors: boolean;
  protectedAreas: boolean;
  waterways: boolean;
  urbanZones: boolean;
}

export interface GeoLocationCoords {
  lat: number;
  lng: number;
}

export type DrawingToolType =
  | 'line-road'
  | 'line-secondary'
  | 'line-pipe'
  | 'line-free'
  | 'circle-roundabout'
  | 'box-infra'
  | 'polygon-urban'
  | 'eraser';
