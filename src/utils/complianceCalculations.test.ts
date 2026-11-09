import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateAllStandards, ComplianceInputParams } from './complianceCalculations';
import { SpeciesRecord, ImpactMetrics } from '../types';

const mockMetrics: ImpactMetrics = {
  score: 62,
  mitigatedScore: 36,
  isMitigated: false,
  fragmentationPercent: 28,
  vegetationLossHa: 4.5,
  co2AvoidedTonsPerYear: 180,
  connectivityIndex: 5.2,
  lengthKm: 6.2,
  avgSlopePercent: 7.5,
  criticalZonesCount: 3,
  suggestedEcoductsCount: 4,
  speciesImpactedCount: 12,
};

const mockSpecies: SpeciesRecord[] = [
  {
    id: 'sp-1',
    commonName: 'Tapir de Montaña',
    scientificName: 'Tapirus pinchaque',
    type: 'fauna',
    iucnStatus: 'EN',
    iucnCategoryLabel: 'En Peligro',
    riskLevel: 'critical',
    source: 'iNaturalist',
    isInBuffer: true,
    observationCount: 3,
  },
  {
    id: 'sp-2',
    commonName: 'Cedro Negro',
    scientificName: 'Juglans neotropica',
    type: 'flora',
    iucnStatus: 'CR',
    iucnCategoryLabel: 'Peligro Crítico',
    riskLevel: 'critical',
    source: 'GBIF',
    isInBuffer: true,
    observationCount: 1,
  },
  {
    id: 'sp-3',
    commonName: 'Frailejón de Páramo',
    scientificName: 'Espeletia grandiflora',
    type: 'flora',
    iucnStatus: 'VU',
    iucnCategoryLabel: 'Vulnerable',
    riskLevel: 'high',
    source: 'iNaturalist',
    isInBuffer: true,
    observationCount: 8,
  },
  {
    id: 'sp-4',
    commonName: 'Mirlo Grande',
    scientificName: 'Turdus fuscater',
    type: 'fauna',
    iucnStatus: 'LC',
    iucnCategoryLabel: 'Preocupación Menor',
    riskLevel: 'low',
    source: 'GBIF',
    isInBuffer: true,
    observationCount: 14,
  },
];

test('evaluateAllStandards evaluates exactly 16 international standards', () => {
  const params: ComplianceInputParams = {
    projectName: 'Corredor Vial Ecológico',
    zoneName: 'Cordillera Oriental',
    lengthKm: 6.2,
    bufferRadiusMeters: 500,
    metrics: mockMetrics,
    isMitigated: false,
    speciesList: mockSpecies,
  };

  const result = evaluateAllStandards(params);
  assert.equal(result.standards.length, 16);
  assert.equal(result.counts.total, 16);

  // Check expected standard codes
  const codes = result.standards.map((s) => s.code);
  assert.ok(codes.includes('IFC PS6'));
  assert.ok(codes.includes('World Bank ESS6'));
  assert.ok(codes.includes('CBD / GBF'));
  assert.ok(codes.includes('Ramsar'));
  assert.ok(codes.includes('CMS (Bonn)'));
  assert.ok(codes.includes('UNESCO WHC'));
  assert.ok(codes.includes('CITES'));
  assert.ok(codes.includes('Espoo (UNECE)'));
  assert.ok(codes.includes('IFC PS1'));
  assert.ok(codes.includes('World Bank ESS1'));
  assert.ok(codes.includes('EBRD PR6'));
  assert.ok(codes.includes('Equator Principles IV'));
  assert.ok(codes.includes('IUCN Red List v3.1'));
  assert.ok(codes.includes('IAIA Guidelines'));
  assert.ok(codes.includes('ISO 14001:2015'));
  assert.ok(codes.includes('Road Ecology'));
});

test('Ramsar standard triggers ALERTA_ACCION_REQUERIDA when waterTerminalValidation is invalid', () => {
  const params: ComplianceInputParams = {
    projectName: 'Acceso Costero',
    zoneName: 'Cuenca Río Magdalena',
    lengthKm: 3.5,
    bufferRadiusMeters: 300,
    metrics: mockMetrics,
    isMitigated: false,
    speciesList: mockSpecies,
    waterTerminalValidation: {
      hasWaterTerminal: true,
      invalidNode: 'end',
      waterBodyName: 'Laguna de la Cocha',
      message: 'El trazado termina dentro del cuerpo de agua',
    },
  };

  const result = evaluateAllStandards(params);
  const ramsarStd = result.standards.find((s) => s.id === 'ramsar');
  assert.ok(ramsarStd);
  assert.equal(ramsarStd.status, 'ALERTA_ACCION_REQUERIDA');
  assert.ok(ramsarStd.technicalJustification.includes('ALERTA GRAVE'));
  assert.equal(result.overallStatus, 'ALERTA_ACCION_REQUERIDA');
});

test('Mitigation Hierarchy correctly calculates avoidance, minimization, offsets and net gain', () => {
  const params: ComplianceInputParams = {
    projectName: 'Autopista Verde',
    zoneName: 'Valle del Cauca',
    lengthKm: 8.0,
    bufferRadiusMeters: 500,
    metrics: { ...mockMetrics, vegetationLossHa: 10.0 },
    isMitigated: true,
    speciesList: mockSpecies,
  };

  const result = evaluateAllStandards(params);
  const mh = result.mitigationHierarchy;
  assert.equal(mh.grossImpactHa, 10.0);
  assert.ok(mh.avoidanceHa > 0);
  assert.ok(mh.minimizationHa > 0);
  assert.ok(mh.restorationHa > 0);
  assert.ok(mh.offsetHa > 0);
  assert.ok(mh.netGainHa > 0);
  assert.equal(mh.status, 'GANANCIA_NETA');
});

test('IUCN Nature-based Solutions (NbS) scores all 8 criteria and outputs actionable recommendations', () => {
  const params: ComplianceInputParams = {
    projectName: 'Vía Bosque de Niebla',
    zoneName: 'Antioquia',
    lengthKm: 5.0,
    bufferRadiusMeters: 400,
    metrics: mockMetrics,
    isMitigated: true,
    speciesList: mockSpecies,
  };

  const result = evaluateAllStandards(params);
  const nbs = result.iucnNbs;
  assert.equal(nbs.criteria.length, 8);
  assert.ok(nbs.overallScore > 75);
  assert.ok(nbs.recommendedNbsInterventions.length >= 4);
});

test('Road Ecology guidelines calculate road-effect zone and crossing density', () => {
  const params: ComplianceInputParams = {
    projectName: 'Variante Serranía',
    zoneName: 'Santander',
    lengthKm: 10.0,
    bufferRadiusMeters: 500,
    metrics: mockMetrics,
    isMitigated: true,
    speciesList: mockSpecies,
  };

  const result = evaluateAllStandards(params);
  const re = result.roadEcology;
  assert.equal(re.roadEffectZoneWidthMeters, 1000);
  assert.ok(re.roadEffectZoneTotalHa > 0);
  assert.ok(re.faunaCrossingsRequired >= 5);
  assert.equal(re.barrierSeverity, 'Bajo');
});
