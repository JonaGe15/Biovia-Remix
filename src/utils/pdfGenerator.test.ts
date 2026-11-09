import test from 'node:test';
import assert from 'node:assert/strict';
import { generateComplianceReportPDF, generateMasterTechnicalReportPDF } from './pdfGenerator';
import { SpeciesRecord, ImpactMetrics } from '../types';

const mockMetrics: ImpactMetrics = {
  score: 55,
  mitigatedScore: 32,
  isMitigated: true,
  fragmentationPercent: 24,
  vegetationLossHa: 3.8,
  co2AvoidedTonsPerYear: 210,
  connectivityIndex: 6.8,
  lengthKm: 5.4,
  avgSlopePercent: 6.2,
  criticalZonesCount: 2,
  suggestedEcoductsCount: 3,
  speciesImpactedCount: 15,
};

const mockSpecies: SpeciesRecord[] = [
  {
    id: 'sp-1',
    commonName: 'Tapir Andino',
    scientificName: 'Tapirus pinchaque',
    type: 'fauna',
    iucnStatus: 'EN',
    iucnCategoryLabel: 'En Peligro',
    riskLevel: 'critical',
    source: 'iNaturalist',
    isInBuffer: true,
    observationCount: 4,
    distanceToLineMeters: 120,
    mitigationMeasure: 'Ecoducto forestado y cerramiento perimetral guiador',
  },
  {
    id: 'sp-2',
    commonName: 'Cedro de Montaña',
    scientificName: 'Cedrela montana',
    type: 'flora',
    iucnStatus: 'VU',
    iucnCategoryLabel: 'Vulnerable',
    riskLevel: 'high',
    source: 'GBIF',
    isInBuffer: true,
    observationCount: 2,
    distanceToLineMeters: 45,
    mitigationMeasure: 'Veda de tala y rescate de germoplasma',
  },
];

test('generateComplianceReportPDF compiles and creates valid PDF filename', () => {
  const filename = generateComplianceReportPDF({
    projectName: 'Corredor Ecológico Andes',
    zoneName: 'Cordillera Central',
    bufferRadiusMeters: 500,
    routeCoords: [
      [4.6097, -74.0817],
      [4.6150, -74.0750],
      [4.6220, -74.0680],
    ],
    metrics: mockMetrics,
    isMitigated: true,
    speciesList: mockSpecies,
  });

  assert.ok(filename.startsWith('Reporte_Cumplimiento_Normativo_'));
  assert.ok(filename.endsWith('.pdf'));
});

test('generateMasterTechnicalReportPDF consolidates all reports into a unified 5-page master document', () => {
  const masterFilename = generateMasterTechnicalReportPDF({
    projectName: 'Troncal Bio-Sostenible de Montaña',
    zoneName: 'Eje Cafetero / Cordillera Central',
    bufferRadiusMeters: 500,
    routeCoords: [
      [4.6097, -74.0817],
      [4.6150, -74.0750],
      [4.6220, -74.0680],
      [4.6310, -74.0590],
    ],
    metrics: mockMetrics,
    isMitigated: true,
    speciesList: mockSpecies,
    roadConnection: {
      isConnected: true,
      node: 'start',
      roadName: 'Ruta Nacional 29',
    },
    waterTerminalValidation: {
      hasWaterTerminal: false,
    },
  });

  assert.ok(masterFilename.startsWith('Reporte_Tecnico_Integral_Master_'));
  assert.ok(masterFilename.endsWith('.pdf'));
});

