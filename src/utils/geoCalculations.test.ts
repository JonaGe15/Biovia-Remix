import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateLineLengthKm,
  generateBufferPolygon,
  calculateVegetationLossHa,
  calculateFragmentation,
  calculateCO2Avoided,
  computeImpactScore,
  calculateCandidateEcoducts,
  generateEcoOptimizedRoute,
} from './geoCalculations';

test('calculateLineLengthKm returns 0 for empty or single coordinates', () => {
  assert.equal(calculateLineLengthKm([]), 0);
  assert.equal(calculateLineLengthKm([[4.6, -75.5]]), 0);
});

test('calculateLineLengthKm calculates positive distance for realistic coordinates', () => {
  const coords: [number, number][] = [
    [4.6097, -75.5500],
    [4.6500, -75.5200],
    [4.7000, -75.4800],
  ];
  const distance = calculateLineLengthKm(coords);
  assert.ok(distance > 5 && distance < 25, `Expected between 5 and 25 km, got ${distance}`);
});

test('generateBufferPolygon creates valid GeoJSON polygon feature', () => {
  const coords: [number, number][] = [
    [4.6097, -75.5500],
    [4.6500, -75.5200],
  ];
  const buffer = generateBufferPolygon(coords, 500);
  assert.ok(buffer !== null);
  assert.equal(buffer?.type, 'Feature');
  assert.ok(buffer?.geometry?.type === 'Polygon' || buffer?.geometry?.type === 'MultiPolygon');
});

test('calculateVegetationLossHa scales with length and buffer', () => {
  const small = calculateVegetationLossHa(5, 200);
  const large = calculateVegetationLossHa(20, 1000);
  assert.ok(large > small);
});

test('calculateFragmentation drops significantly when mitigated', () => {
  const unmitigated = calculateFragmentation(15, 2, false);
  const mitigated = calculateFragmentation(15, 2, true);
  assert.ok(mitigated < unmitigated);
  assert.ok(unmitigated > 30);
});

test('computeImpactScore reflects severity and mitigation reduction', () => {
  const scoreUnmitigated = computeImpactScore(34, 28.4, 2, false);
  const scoreMitigated = computeImpactScore(34, 28.4, 2, true);
  assert.ok(scoreUnmitigated >= 60, `Score unmitigated should be >= 60, got ${scoreUnmitigated}`);
  assert.ok(scoreMitigated < scoreUnmitigated, `Score mitigated (${scoreMitigated}) must be lower than unmitigated (${scoreUnmitigated})`);
});

test('computeImpactScore returns 0 when no infrastructure exists', () => {
  const score = computeImpactScore(0, 0, 0, false);
  assert.equal(score, 0);
});

test('computeImpactScore scales with user selected criteria', () => {
  const allCriteria = { flora: true, fauna: true, corridors: true, protectedAreas: true, waterways: true, urbanZones: true };
  const partialCriteria = { flora: true, fauna: false, corridors: false, protectedAreas: false, waterways: false, urbanZones: false };
  const scoreAll = computeImpactScore(34, 28.4, 2, false, allCriteria);
  const scorePartial = computeImpactScore(34, 28.4, 2, false, partialCriteria);
  assert.ok(scorePartial < scoreAll);
});

test('calculateCandidateEcoducts generates recommended crossings', () => {
  const coords: [number, number][] = [
    [4.6097, -75.5500],
    [4.6300, -75.5350],
    [4.6500, -75.5200],
    [4.6800, -75.5000],
    [4.7000, -75.4800],
  ];
  const ecoducts = calculateCandidateEcoducts(coords, 14.8);
  assert.ok(ecoducts.length >= 1);
  assert.ok(ecoducts[0].name.includes('ECODUCTO'));
});

test('generateEcoOptimizedRoute preserves start and end endpoints', () => {
  const start: [number, number] = [4.60, -75.55];
  const end: [number, number] = [4.70, -75.48];
  const original: [number, number][] = [start, [4.65, -75.52], end];
  const alt = generateEcoOptimizedRoute(original);

  assert.equal(alt[0][0], start[0]);
  assert.equal(alt[0][1], start[1]);
  assert.equal(alt[alt.length - 1][0], end[0]);
  assert.equal(alt[alt.length - 1][1], end[1]);
  assert.ok(alt.length >= 3);
});

test('generateBufferPolygon handles max 5000 meters buffer correctly', () => {
  const coords: [number, number][] = [
    [40.4168, -3.7038], // Madrid
    [40.4500, -3.6800],
  ];
  const buffer5000 = generateBufferPolygon(coords, 5000);
  assert.ok(buffer5000 !== null);
  assert.equal(buffer5000?.type, 'Feature');

  const loss5000 = calculateVegetationLossHa(10, 5000);
  const loss500 = calculateVegetationLossHa(10, 500);
  assert.ok(loss5000 > loss500);
  assert.ok(Math.abs(loss5000 - loss500 * 10) < 0.2);
});

test('checkRoadConnection detects connections and handles open alignments', async () => {
  const { checkRoadConnection } = await import('./geoCalculations');

  // Empty coordinates
  const empty = await checkRoadConnection([]);
  assert.equal(empty.isConnected, false);

  // Default regional corridor coordinates near Ruta 29
  const demoCoords: [number, number][] = [
    [4.609, -75.561],
    [4.637, -75.534],
    [4.665, -75.510],
    [4.706, -75.470],
  ];
  const conn = await checkRoadConnection(demoCoords);
  assert.ok(conn.isConnected);
  assert.ok(conn.roadName);
  assert.ok(conn.details?.includes('Empalme'));
});

test('checkWaterTerminalValidation detects when endpoint terminates inside water body', async () => {
  const { checkWaterTerminalValidation } = await import('./geoCalculations');

  // Point terminating right in the Humedal de Rivera Quebrada Honda [4.651, -75.518]
  const waterEndingCoords: [number, number][] = [
    [4.620, -75.540], // land
    [4.651, -75.518], // inside wetland pod
  ];
  const validation = await checkWaterTerminalValidation(waterEndingCoords);
  assert.equal(validation.hasWaterTerminal, true);
  assert.equal(validation.invalidNode, 'end');
  assert.ok(validation.waterBodyName?.includes('Humedal'));

  // Route starting and ending on dry land
  const dryLandCoords: [number, number][] = [
    [4.609, -75.561],
    [4.637, -75.534],
  ];
  const dryValidation = await checkWaterTerminalValidation(dryLandCoords);
  assert.equal(dryValidation.hasWaterTerminal, false);
});

test('getVerifiedIUCNData guarantees 100% accurate IUCN categories and Spanish names', async () => {
  const { getVerifiedIUCNData } = await import('../services/bioApis');

  // Tremarctos ornatus is VU (Vulnerable) on official IUCN Red List
  const oso = getVerifiedIUCNData('Tremarctos ornatus');
  assert.equal(oso.iucnStatus, 'VU');
  assert.equal(oso.commonName, 'Oso Andino (Oso de Anteojos)');

  // Tapirus pinchaque is EN (Endangered)
  const tapir = getVerifiedIUCNData('Tapirus pinchaque');
  assert.equal(tapir.iucnStatus, 'EN');

  // Puma concolor is LC (Least Concern)
  const puma = getVerifiedIUCNData('Puma concolor');
  assert.equal(puma.iucnStatus, 'LC');

  // Centrolene buckleyi is VU (Vulnerable)
  const rana = getVerifiedIUCNData('Centrolene buckleyi');
  assert.equal(rana.iucnStatus, 'VU');

  // Ceroxylon quindiuense is EN (Endangered)
  const palma = getVerifiedIUCNData('Ceroxylon quindiuense');
  assert.equal(palma.iucnStatus, 'EN');

  // Magnolia wolfii is CR (Critically Endangered)
  const magnolia = getVerifiedIUCNData('Magnolia wolfii');
  assert.equal(magnolia.iucnStatus, 'CR');
});

test('fetchZoneSpeciesWithBuffer returns empty when no route is drawn', async () => {
  const { fetchZoneSpeciesWithBuffer } = await import('../services/bioApis');
  const resEmpty = await fetchZoneSpeciesWithBuffer([], 1000);
  assert.equal(resEmpty.species.length, 0);
  assert.equal(resEmpty.totalIntercepted, 0);

  const resSingle = await fetchZoneSpeciesWithBuffer([[4.6, -75.5]], 1000);
  assert.equal(resSingle.species.length, 0);
});

test('calculateCorridorChokepoints identifies biological corridor pinch points based on altimetry and vegetation', async () => {
  const { calculateCorridorChokepoints } = await import('./geoCalculations');

  // Test empty route
  const emptyChokes = calculateCorridorChokepoints([]);
  assert.equal(emptyChokes.length, 0);

  // Realistic mountain alignment
  const mountainRoute: [number, number][] = [
    [4.600, -75.560],
    [4.625, -75.535],
    [4.650, -75.510],
    [4.680, -75.480],
  ];

  const chokepoints = calculateCorridorChokepoints(mountainRoute, 500, [], 10.5);
  assert.ok(chokepoints.length >= 2);

  // Verify altimetry and vegetation properties
  const first = chokepoints[0];
  assert.ok(first.slopePercent > 10, 'Slope should be significant');
  assert.ok(first.elevationMeters > 300, 'Elevation should be calculated');
  assert.ok(first.vegetationCoverPercent >= 60, 'Vegetation cover should be present');
  assert.ok(first.corridorWidthMeters > 0, 'Corridor width constriction should be calculated');
  assert.ok(first.severity === 'critical' || first.severity === 'high' || first.severity === 'medium');
  assert.ok(first.topographicConstraint.length > 10);
  assert.ok(first.recommendedMitigation.length > 10);
});



