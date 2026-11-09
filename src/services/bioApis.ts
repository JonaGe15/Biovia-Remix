import * as turf from '@turf/turf';
import { SpeciesRecord, IUCNCategory } from '../types';

/**
 * Authoritative IUCN Red List Taxonomy Dictionary.
 * Contains verified conservation statuses according to the official IUCN Red List of Threatened Species,
 * verified Spanish common names, and ecological mitigation requirements.
 */
export interface VerifiedTaxonInfo {
  scientificName: string;
  commonName: string;
  type: 'fauna' | 'flora';
  iucnStatus: IUCNCategory;
  iucnCategoryLabel: string;
  riskLevel: 'critical' | 'high' | 'medium' | 'low';
  mitigationMeasure: string;
  imageUrl?: string;
}

export const IUCN_VERIFIED_TAXONOMY: Record<string, VerifiedTaxonInfo> = {
  // Andes / Colombia / Neotropics
  'tremarctos ornatus': {
    scientificName: 'Tremarctos ornatus',
    commonName: 'Oso Andino (Oso de Anteojos)',
    type: 'fauna',
    iucnStatus: 'VU',
    iucnCategoryLabel: 'VULNERABLE (VU)',
    riskLevel: 'high',
    mitigationMeasure: 'Ecoducto forestado superior Km 6.2 con dosel continuo y sustrato vegetal',
    imageUrl: 'https://images.unsplash.com/photo-1579829366248-204fe8413f31?w=400&auto=format&fit=crop&q=80',
  },
  'tapirus pinchaque': {
    scientificName: 'Tapirus pinchaque',
    commonName: 'Danta de Páramo (Tapir Andino)',
    type: 'fauna',
    iucnStatus: 'EN',
    iucnCategoryLabel: 'EN PELIGRO (EN)',
    riskLevel: 'critical',
    mitigationMeasure: 'Corredor biológico altoandino • Paso de fauna específico y vallado perimetral',
    imageUrl: 'https://images.unsplash.com/photo-1564349683136-77e08dba1ef7?w=400&auto=format&fit=crop&q=80',
  },
  'centrolene buckleyi': {
    scientificName: 'Centrolene buckleyi',
    commonName: 'Rana de Cristal de Buckley',
    type: 'fauna',
    iucnStatus: 'VU',
    iucnCategoryLabel: 'VULNERABLE (VU)',
    riskLevel: 'high',
    mitigationMeasure: 'Cruce Quebrada Honda • Viaducto aéreo obligatorio sin pilas en el cauce hídrico',
    imageUrl: 'https://images.unsplash.com/photo-1534361960057-19889db9621e?w=400&auto=format&fit=crop&q=80',
  },
  'puma concolor': {
    scientificName: 'Puma concolor',
    commonName: 'Puma (León de Montaña)',
    type: 'fauna',
    iucnStatus: 'LC',
    iucnCategoryLabel: 'PREOCUPACIÓN MENOR (LC)',
    riskLevel: 'medium',
    mitigationMeasure: 'Paso inferior seco y señalización luminosa nocturna anti-atropello',
    imageUrl: 'https://images.unsplash.com/photo-1549480017-d76466a4b7e8?w=400&auto=format&fit=crop&q=80',
  },
  'andigena laminirostris': {
    scientificName: 'Andigena laminirostris',
    commonName: 'Tucán Andino Piquiplano',
    type: 'fauna',
    iucnStatus: 'NT',
    iucnCategoryLabel: 'CASI AMENAZADO (NT)',
    riskLevel: 'medium',
    mitigationMeasure: 'Amortiguamiento acústico • Pavimento fonoabsorbente y veda de desmonte en perchas',
    imageUrl: 'https://images.unsplash.com/photo-1552728089-57bdde30beb3?w=400&auto=format&fit=crop&q=80',
  },
  'coeligena orina': {
    scientificName: 'Coeligena orina',
    commonName: 'Colibrí del Sol',
    type: 'fauna',
    iucnStatus: 'EN',
    iucnCategoryLabel: 'EN PELIGRO (EN)',
    riskLevel: 'critical',
    mitigationMeasure: 'Restauración de estrato arbustivo con ericáceas nativas en franjas laterales',
  },
  'mazama rufina': {
    scientificName: 'Mazama rufina',
    commonName: 'Venado Soche Rojo (Venado Colorado Enano)',
    type: 'fauna',
    iucnStatus: 'VU',
    iucnCategoryLabel: 'VULNERABLE (VU)',
    riskLevel: 'high',
    mitigationMeasure: 'Señalización vial dinámica, reductores de velocidad y pasos sub-viales',
  },
  'cabassous centralis': {
    scientificName: 'Cabassous centralis',
    commonName: 'Armadillo Coletrapo',
    type: 'fauna',
    iucnStatus: 'DD',
    iucnCategoryLabel: 'DATOS DEFICIENTES (DD)',
    riskLevel: 'medium',
    mitigationMeasure: 'Monitoreo continuo con cámaras trampa en alcantarillas y pasos secos',
  },
  'vultur gryphus': {
    scientificName: 'Vultur gryphus',
    commonName: 'Cóndor Andino',
    type: 'fauna',
    iucnStatus: 'VU',
    iucnCategoryLabel: 'VULNERABLE (VU)',
    riskLevel: 'high',
    mitigationMeasure: 'Zona de exclusión sonora y protección de dormideros rocosos a menos de 2 km',
  },
  'ceroxylon quindiuense': {
    scientificName: 'Ceroxylon quindiuense',
    commonName: 'Palma de Cera del Quindío (Árbol Nacional)',
    type: 'flora',
    iucnStatus: 'EN',
    iucnCategoryLabel: 'EN PELIGRO (EN)',
    riskLevel: 'critical',
    mitigationMeasure: 'Veda absoluta de tala • Ajuste del eje geométrico para conservar rodales de palmas vivas',
  },
  'dracula simia': {
    scientificName: 'Dracula simia',
    commonName: 'Orquídea Cara de Mono',
    type: 'flora',
    iucnStatus: 'VU',
    iucnCategoryLabel: 'VULNERABLE (VU)',
    riskLevel: 'high',
    mitigationMeasure: 'Rescate de germoplasma y relocalización en árboles nodriza fuera de calzada',
  },
  'magnolia wolfii': {
    scientificName: 'Magnolia wolfii',
    commonName: 'Magnolia del Bosque Andino',
    type: 'flora',
    iucnStatus: 'CR',
    iucnCategoryLabel: 'EN PELIGRO CRÍTICO (CR)',
    riskLevel: 'critical',
    mitigationMeasure: 'Especie en peligro crítico • Veda forestal total y cerramiento de conservación genética',
  },
  'retrophyllum rospigliosii': {
    scientificName: 'Retrophyllum rospigliosii',
    commonName: 'Pino Romero de Montaña',
    type: 'flora',
    iucnStatus: 'NT',
    iucnCategoryLabel: 'CASI AMENAZADO (NT)',
    riskLevel: 'medium',
    mitigationMeasure: 'Protección de relictos semilleros a menos de 100m de la calzada',
  },
  'cyathea caracasana': {
    scientificName: 'Cyathea caracasana',
    commonName: 'Helecho Arborescente Gigante',
    type: 'flora',
    iucnStatus: 'LC',
    iucnCategoryLabel: 'PREOCUPACIÓN MENOR (LC)',
    riskLevel: 'low',
    mitigationMeasure: 'Bioingeniería de taludes y relocalización de fustes en linderos',
  },
  'espeletia grandiflora': {
    scientificName: 'Espeletia grandiflora',
    commonName: 'Frailejón de Páramo',
    type: 'flora',
    iucnStatus: 'VU',
    iucnCategoryLabel: 'VULNERABLE (VU)',
    riskLevel: 'high',
    mitigationMeasure: 'Prohibición estricta de tránsito de maquinaria sobre turberas altoandinas',
  },

  // Iberian Peninsula / Mediterranean / Europe
  'lynx pardinus': {
    scientificName: 'Lynx pardinus',
    commonName: 'Lince Ibérico',
    type: 'fauna',
    iucnStatus: 'VU',
    iucnCategoryLabel: 'VULNERABLE (VU - Actualizado IUCN)',
    riskLevel: 'critical',
    mitigationMeasure: 'Ecoducto forestado y vallado cinegético reforzado con mallas anti-escape',
    imageUrl: 'https://images.unsplash.com/photo-1579829366248-204fe8413f31?w=400&auto=format&fit=crop&q=80',
  },
  'aquila adalberti': {
    scientificName: 'Aquila adalberti',
    commonName: 'Águila Imperial Ibérica',
    type: 'fauna',
    iucnStatus: 'VU',
    iucnCategoryLabel: 'VULNERABLE (VU)',
    riskLevel: 'high',
    mitigationMeasure: 'Aislamiento de tendidos y radio de protección de nidos de 1.5 km',
  },
  'canis lupus': {
    scientificName: 'Canis lupus',
    commonName: 'Lobo Ibérico',
    type: 'fauna',
    iucnStatus: 'LC',
    iucnCategoryLabel: 'PREOCUPACIÓN MENOR (LC / VU Reg.)',
    riskLevel: 'medium',
    mitigationMeasure: 'Pasos de gran fauna y señalización reflectante anti-atropello',
  },
  'ursus arctos': {
    scientificName: 'Ursus arctos',
    commonName: 'Oso Pardo Cantábrico',
    type: 'fauna',
    iucnStatus: 'LC',
    iucnCategoryLabel: 'PREOCUPACIÓN MENOR (LC / EN Subpoblación)',
    riskLevel: 'critical',
    mitigationMeasure: 'Corredor verde elevado con sustrato vegetal autóctono',
  },
  'lutra lutra': {
    scientificName: 'Lutra lutra',
    commonName: 'Nutria Paleártica',
    type: 'fauna',
    iucnStatus: 'NT',
    iucnCategoryLabel: 'CASI AMENAZADO (NT)',
    riskLevel: 'medium',
    mitigationMeasure: 'Pasos secos en estribos de viaductos fluviales',
  },
  'quercus suber': {
    scientificName: 'Quercus suber',
    commonName: 'Alcornoque Mediterráneo',
    type: 'flora',
    iucnStatus: 'LC',
    iucnCategoryLabel: 'PREOCUPACIÓN MENOR (LC)',
    riskLevel: 'medium',
    mitigationMeasure: 'Veda de tala en dehesa madura y transplante selectivo',
  },
  'quercus ilex': {
    scientificName: 'Quercus ilex',
    commonName: 'Encina Centenaria',
    type: 'flora',
    iucnStatus: 'LC',
    iucnCategoryLabel: 'PREOCUPACIÓN MENOR (LC)',
    riskLevel: 'low',
    mitigationMeasure: 'Compensación de arbolado 5:1 con especies autóctonas',
  },
  'taxus baccata': {
    scientificName: 'Taxus baccata',
    commonName: 'Tejo Común',
    type: 'flora',
    iucnStatus: 'LC',
    iucnCategoryLabel: 'PREOCUPACIÓN MENOR (LC)',
    riskLevel: 'medium',
    mitigationMeasure: 'Resguardo de rodales relictos en vaguadas húmedas',
  },

  // Mesoamerica / Central America
  'panthera onca': {
    scientificName: 'Panthera onca',
    commonName: 'Jaguar Mesoamericano',
    type: 'fauna',
    iucnStatus: 'NT',
    iucnCategoryLabel: 'CASI AMENAZADO (NT)',
    riskLevel: 'critical',
    mitigationMeasure: 'Corredor biológico selvático y pasos elevados de fauna',
  },
  'tapirus bairdii': {
    scientificName: 'Tapirus bairdii',
    commonName: 'Tapir Centroamericano (Tapir de Baird)',
    type: 'fauna',
    iucnStatus: 'EN',
    iucnCategoryLabel: 'EN PELIGRO (EN)',
    riskLevel: 'critical',
    mitigationMeasure: 'Pasos inferiores sobredimensionados con vegetación de borde',
  },
  'ateles geoffroyi': {
    scientificName: 'Ateles geoffroyi',
    commonName: 'Mono Araña Centroamericano',
    type: 'fauna',
    iucnStatus: 'EN',
    iucnCategoryLabel: 'EN PELIGRO (EN)',
    riskLevel: 'critical',
    mitigationMeasure: 'Puentes de dosel aéreo (canopy bridges) sobre la calzada',
  },
  'pharomachrus mocinno': {
    scientificName: 'Pharomachrus mocinno',
    commonName: 'Quetzal Resplandeciente',
    type: 'fauna',
    iucnStatus: 'NT',
    iucnCategoryLabel: 'CASI AMENAZADO (NT)',
    riskLevel: 'high',
    mitigationMeasure: 'Preservación de árboles de aguacatillo en franja de 2 km',
  },
  'ceiba pentandra': {
    scientificName: 'Ceiba pentandra',
    commonName: 'Árbol de Ceiba Sagrada',
    type: 'flora',
    iucnStatus: 'LC',
    iucnCategoryLabel: 'PREOCUPACIÓN MENOR (LC)',
    riskLevel: 'medium',
    mitigationMeasure: 'Desvío de trazado para evitar corte de ejemplares monumentales',
  },
  'swietenia macrophylla': {
    scientificName: 'Swietenia macrophylla',
    commonName: 'Caoba Americana de Hoja Ancha',
    type: 'flora',
    iucnStatus: 'VU',
    iucnCategoryLabel: 'VULNERABLE (VU)',
    riskLevel: 'critical',
    mitigationMeasure: 'Veda forestal CITES y custodia de banco genético',
  },

  // North America
  'sequoia sempervirens': {
    scientificName: 'Sequoia sempervirens',
    commonName: 'Secuoya Roja Gigante',
    type: 'flora',
    iucnStatus: 'EN',
    iucnCategoryLabel: 'EN PELIGRO (EN)',
    riskLevel: 'critical',
    mitigationMeasure: 'Protección estricta de sistema radicular a 30m del fuste',
  },
  'pseudotsuga menziesii': {
    scientificName: 'Pseudotsuga menziesii',
    commonName: 'Abeto de Douglas',
    type: 'flora',
    iucnStatus: 'LC',
    iucnCategoryLabel: 'PREOCUPACIÓN MENOR (LC)',
    riskLevel: 'low',
    mitigationMeasure: 'Revegetación de terraplenes con mezclas de semillas certificadas',
  },
  'haliaeetus leucocephalus': {
    scientificName: 'Haliaeetus leucocephalus',
    commonName: 'Águila Calva Americana',
    type: 'fauna',
    iucnStatus: 'LC',
    iucnCategoryLabel: 'PREOCUPACIÓN MENOR (LC / MBTA)',
    riskLevel: 'medium',
    mitigationMeasure: 'Zona de amortiguamiento acústico alrededor de perchas ribereñas',
  },

  // Southern Cone
  'hippocamelus bisulcus': {
    scientificName: 'Hippocamelus bisulcus',
    commonName: 'Huemul del Sur',
    type: 'fauna',
    iucnStatus: 'EN',
    iucnCategoryLabel: 'EN PELIGRO (EN)',
    riskLevel: 'critical',
    mitigationMeasure: 'Pasos de fauna amplios sin barreras acústicas artificiales',
  },
  'lama guanicoe': {
    scientificName: 'Lama guanicoe',
    commonName: 'Guanaco Patagónico',
    type: 'fauna',
    iucnStatus: 'LC',
    iucnCategoryLabel: 'PREOCUPACIÓN MENOR (LC)',
    riskLevel: 'medium',
    mitigationMeasure: 'Alambrados amigables de 3 hilos y rampas de cruce',
  },
  'araucaria araucana': {
    scientificName: 'Araucaria araucana',
    commonName: 'Araucaria / Pehuén',
    type: 'flora',
    iucnStatus: 'EN',
    iucnCategoryLabel: 'EN PELIGRO (EN)',
    riskLevel: 'critical',
    mitigationMeasure: 'Veda total de tala • Monumento natural protegido',
  },
  'fitzroya cupressoides': {
    scientificName: 'Fitzroya cupressoides',
    commonName: 'Alerce Milenario Patagónico',
    type: 'flora',
    iucnStatus: 'EN',
    iucnCategoryLabel: 'EN PELIGRO (EN)',
    riskLevel: 'critical',
    mitigationMeasure: 'Desvío perimetral de obras a más de 500m del rodal relicto',
  },
};

/**
 * Resolves accurate IUCN Red List data for any species by scientific name or fallback.
 */
export function getVerifiedIUCNData(
  scientificName: string,
  rawStatus?: string,
  rawKingdom?: string
): {
  iucnStatus: IUCNCategory;
  iucnCategoryLabel: string;
  commonName?: string;
  type?: 'fauna' | 'flora';
  riskLevel: 'critical' | 'high' | 'medium' | 'low';
  mitigationMeasure?: string;
} {
  const key = scientificName.toLowerCase().trim();
  const verified = IUCN_VERIFIED_TAXONOMY[key];
  if (verified) {
    return {
      iucnStatus: verified.iucnStatus,
      iucnCategoryLabel: verified.iucnCategoryLabel,
      commonName: verified.commonName,
      type: verified.type,
      riskLevel: verified.riskLevel,
      mitigationMeasure: verified.mitigationMeasure,
    };
  }

  // Parse raw status safely
  const isAnimal = rawKingdom === 'Animalia';
  let iucnStatus: IUCNCategory = 'LC';

  if (rawStatus) {
    const s = rawStatus.toUpperCase().trim();
    if (s.includes('CR') || s.includes('CRITIC')) iucnStatus = 'CR';
    else if (s.includes('EN') || s.includes('ENDANGER')) iucnStatus = 'EN';
    else if (s.includes('VU') || s.includes('VULNERAB')) iucnStatus = 'VU';
    else if (s.includes('NT') || s.includes('NEAR')) iucnStatus = 'NT';
    else if (s.includes('DD') || s.includes('DEFICIENT')) iucnStatus = 'DD';
    else if (s.includes('LC') || s.includes('LEAST')) iucnStatus = 'LC';
  }

  const labelMap: Record<IUCNCategory, string> = {
    CR: 'EN PELIGRO CRÍTICO (CR)',
    EN: 'EN PELIGRO (EN)',
    VU: 'VULNERABLE (VU)',
    NT: 'CASI AMENAZADO (NT)',
    LC: 'PREOCUPACIÓN MENOR (LC)',
    DD: 'DATOS DEFICIENTES (DD)',
  };

  const riskLevel =
    iucnStatus === 'CR' || iucnStatus === 'EN'
      ? 'critical'
      : iucnStatus === 'VU'
      ? 'high'
      : iucnStatus === 'NT'
      ? 'medium'
      : 'low';

  return {
    iucnStatus,
    iucnCategoryLabel: labelMap[iucnStatus],
    type: isAnimal ? 'fauna' : 'flora',
    riskLevel,
    mitigationMeasure: isAnimal
      ? 'Monitoreo de fauna y señalización preventiva'
      : 'Conservación vegetal y salvaguarda de semillas nativas',
  };
}

// Curated baseline for the Colombian Central Andes with strictly accurate IUCN categories
export const DEFAULT_CORRIDOR_SPECIES: SpeciesRecord[] = [
  {
    id: 'sp-1',
    commonName: 'Oso Andino (Oso de Anteojos)',
    scientificName: 'Tremarctos ornatus',
    type: 'fauna',
    iucnStatus: 'VU',
    iucnCategoryLabel: 'VULNERABLE (VU)',
    overlapKm: 4.2,
    lostAreaHa: 12.5,
    mitigationMeasure: 'Ecoducto forestado superior Km 6.2 (Viaducto Superior)',
    riskLevel: 'high',
    source: 'GBIF',
    imageUrl: 'https://images.unsplash.com/photo-1579829366248-204fe8413f31?w=400&auto=format&fit=crop&q=80',
    coordinates: [4.642, -75.525],
    distanceToLineMeters: 380,
    isInBuffer: true,
    observationCount: 8,
    inaturalistUrl: 'https://www.inaturalist.org/taxa?q=Tremarctos+ornatus',
  },
  {
    id: 'sp-2',
    commonName: 'Puma Concolor',
    scientificName: 'Puma concolor',
    type: 'fauna',
    iucnStatus: 'LC',
    iucnCategoryLabel: 'PREOCUPACIÓN MENOR (LC)',
    overlapKm: 6.8,
    lostAreaHa: 18.0,
    mitigationMeasure: 'Paso inferior seco y señalización luminosa nocturna anti-atropello',
    riskLevel: 'medium',
    source: 'iNaturalist',
    imageUrl: 'https://images.unsplash.com/photo-1549480017-d76466a4b7e8?w=400&auto=format&fit=crop&q=80',
    coordinates: [4.665, -75.508],
    distanceToLineMeters: 720,
    isInBuffer: true,
    observationCount: 14,
    inaturalistUrl: 'https://www.inaturalist.org/taxa?q=Puma+concolor',
  },
  {
    id: 'sp-3',
    commonName: 'Rana de Cristal de Buckley',
    scientificName: 'Centrolene buckleyi',
    type: 'fauna',
    iucnStatus: 'VU',
    iucnCategoryLabel: 'VULNERABLE (VU)',
    overlapKm: 1.8,
    lostAreaHa: 4.2,
    mitigationMeasure: 'Cruce Quebrada Honda • Viaducto aéreo obligatorio sin pilas en el cauce',
    riskLevel: 'high',
    source: 'IUCN',
    imageUrl: 'https://images.unsplash.com/photo-1534361960057-19889db9621e?w=400&auto=format&fit=crop&q=80',
    coordinates: [4.651, -75.518],
    distanceToLineMeters: 210,
    isInBuffer: true,
    observationCount: 6,
    inaturalistUrl: 'https://www.inaturalist.org/taxa?q=Centrolene+buckleyi',
  },
  {
    id: 'sp-4',
    commonName: 'Tucán Andino Piquiplano',
    scientificName: 'Andigena laminirostris',
    type: 'fauna',
    iucnStatus: 'NT',
    iucnCategoryLabel: 'CASI AMENAZADO (NT)',
    overlapKm: 8.4,
    lostAreaHa: 9.1,
    mitigationMeasure: 'Perturbación sonora: buffer de 1.5 km • Pavimento fonoabsorbente',
    riskLevel: 'medium',
    source: 'GBIF',
    imageUrl: 'https://images.unsplash.com/photo-1552728089-57bdde30beb3?w=400&auto=format&fit=crop&q=80',
    coordinates: [4.678, -75.495],
    distanceToLineMeters: 1450,
    isInBuffer: true,
    observationCount: 11,
    inaturalistUrl: 'https://www.inaturalist.org/taxa?q=Andigena+laminirostris',
  },
  {
    id: 'sp-5',
    commonName: 'Danta de Páramo (Tapir Andino)',
    scientificName: 'Tapirus pinchaque',
    type: 'fauna',
    iucnStatus: 'EN',
    iucnCategoryLabel: 'EN PELIGRO (EN)',
    overlapKm: 3.1,
    lostAreaHa: 15.3,
    mitigationMeasure: 'Corredor biológico altoandino • Paso de fauna Km 11.4',
    riskLevel: 'critical',
    source: 'iNaturalist',
    imageUrl: 'https://images.unsplash.com/photo-1564349683136-77e08dba1ef7?w=400&auto=format&fit=crop&q=80',
    coordinates: [4.692, -75.485],
    distanceToLineMeters: 890,
    isInBuffer: true,
    observationCount: 5,
    inaturalistUrl: 'https://www.inaturalist.org/taxa?q=Tapirus+pinchaque',
  },
  {
    id: 'sp-6',
    commonName: 'Colibrí del Sol',
    scientificName: 'Coeligena orina',
    type: 'fauna',
    iucnStatus: 'EN',
    iucnCategoryLabel: 'EN PELIGRO (EN)',
    overlapKm: 2.5,
    lostAreaHa: 3.8,
    mitigationMeasure: 'Restauración de estrato arbustivo con ericáceas nativas',
    riskLevel: 'critical',
    source: 'IUCN',
    coordinates: [4.635, -75.535],
    distanceToLineMeters: 450,
    isInBuffer: true,
    observationCount: 4,
    inaturalistUrl: 'https://www.inaturalist.org/taxa?q=Coeligena+orina',
  },
  {
    id: 'sp-7',
    commonName: 'Venado Soche Rojo',
    scientificName: 'Mazama rufina',
    type: 'fauna',
    iucnStatus: 'VU',
    iucnCategoryLabel: 'VULNERABLE (VU)',
    overlapKm: 5.4,
    lostAreaHa: 11.2,
    mitigationMeasure: 'Señalización luminosa dinámica y reductores de velocidad',
    riskLevel: 'high',
    source: 'GBIF',
    coordinates: [4.658, -75.512],
    distanceToLineMeters: 620,
    isInBuffer: true,
    observationCount: 9,
    inaturalistUrl: 'https://www.inaturalist.org/taxa?q=Mazama+rufina',
  },
  {
    id: 'sp-8',
    commonName: 'Armadillo Coletrapo',
    scientificName: 'Cabassous centralis',
    type: 'fauna',
    iucnStatus: 'DD',
    iucnCategoryLabel: 'DATOS DEFICIENTES (DD)',
    overlapKm: 3.9,
    lostAreaHa: 6.4,
    mitigationMeasure: 'Monitoreo con cámaras trampa en alcantarillas secas',
    riskLevel: 'medium',
    source: 'iNaturalist',
    coordinates: [4.625, -75.542],
    distanceToLineMeters: 1850,
    isInBuffer: true,
    observationCount: 3,
    inaturalistUrl: 'https://www.inaturalist.org/taxa?q=Cabassous+centralis',
  },
  // FLORA
  {
    id: 'fl-1',
    commonName: 'Palma de Cera del Quindío',
    scientificName: 'Ceroxylon quindiuense',
    type: 'flora',
    iucnStatus: 'EN',
    iucnCategoryLabel: 'EN PELIGRO (EN)',
    overlapKm: 5.2,
    lostAreaHa: 42,
    mitigationMeasure: 'Veda absoluta • Desvío del eje 45m hacia cota inferior para preservar palmas',
    riskLevel: 'critical',
    source: 'GBIF',
    coordinates: [4.648, -75.522],
    distanceToLineMeters: 150,
    isInBuffer: true,
    observationCount: 22,
    inaturalistUrl: 'https://www.inaturalist.org/taxa?q=Ceroxylon+quindiuense',
  },
  {
    id: 'fl-2',
    commonName: 'Orquídea Cara de Mono',
    scientificName: 'Dracula simia',
    type: 'flora',
    iucnStatus: 'VU',
    iucnCategoryLabel: 'VULNERABLE (VU)',
    overlapKm: 1.2,
    lostAreaHa: 2.1,
    mitigationMeasure: 'Ladera húmeda • Rescate de germoplasma y relocalización en árboles nodriza',
    riskLevel: 'high',
    source: 'iNaturalist',
    coordinates: [4.672, -75.501],
    distanceToLineMeters: 310,
    isInBuffer: true,
    observationCount: 5,
    inaturalistUrl: 'https://www.inaturalist.org/taxa?q=Dracula+simia',
  },
  {
    id: 'fl-3',
    commonName: 'Bosque de Niebla Primario',
    scientificName: 'Estrato maduro alto-andino',
    type: 'flora',
    iucnStatus: 'EN',
    iucnCategoryLabel: 'ECOSISTEMA AMENAZADO (EN)',
    overlapKm: 7.9,
    lostAreaHa: 22.1,
    mitigationMeasure: 'Área interceptada: 22.1 ha • Compensación 10:1 en cuenca alta',
    riskLevel: 'critical',
    source: 'IUCN',
    coordinates: [4.655, -75.515],
    distanceToLineMeters: 0,
    isInBuffer: true,
    observationCount: 16,
    inaturalistUrl: 'https://www.inaturalist.org/taxa?q=Andean+cloud+forest',
  },
  {
    id: 'fl-4',
    commonName: 'Pino Romero de Montaña',
    scientificName: 'Retrophyllum rospigliosii',
    type: 'flora',
    iucnStatus: 'NT',
    iucnCategoryLabel: 'CASI AMENAZADO (NT)',
    overlapKm: 3.4,
    lostAreaHa: 8.7,
    mitigationMeasure: 'Protección de relictos semilleros a menos de 100m de calzada',
    riskLevel: 'medium',
    source: 'GBIF',
    coordinates: [4.685, -75.492],
    distanceToLineMeters: 520,
    isInBuffer: true,
    observationCount: 7,
    inaturalistUrl: 'https://www.inaturalist.org/taxa?q=Retrophyllum+rospigliosii',
  },
  {
    id: 'fl-5',
    commonName: 'Magnolia del Bosque Andino',
    scientificName: 'Magnolia wolfii',
    type: 'flora',
    iucnStatus: 'CR',
    iucnCategoryLabel: 'EN PELIGRO CRÍTICO (CR)',
    overlapKm: 0.8,
    lostAreaHa: 1.4,
    mitigationMeasure: 'Especie en peligro crítico de extinción • Veda forestal absoluta y cerco perimetral',
    riskLevel: 'critical',
    source: 'IUCN',
    coordinates: [4.662, -75.509],
    distanceToLineMeters: 280,
    isInBuffer: true,
    observationCount: 3,
    inaturalistUrl: 'https://www.inaturalist.org/taxa?q=Magnolia+wolfii',
  },
  {
    id: 'fl-6',
    commonName: 'Helecho Arborescente Gigante',
    scientificName: 'Cyathea caracasana',
    type: 'flora',
    iucnStatus: 'LC',
    iucnCategoryLabel: 'PREOCUPACIÓN MENOR (LC)',
    overlapKm: 4.1,
    lostAreaHa: 7.8,
    mitigationMeasure: 'Control de erosión en taludes mediante bioingeniería con briofitas',
    riskLevel: 'low',
    source: 'iNaturalist',
    coordinates: [4.638, -75.531],
    distanceToLineMeters: 940,
    isInBuffer: true,
    observationCount: 19,
    inaturalistUrl: 'https://www.inaturalist.org/taxa?q=Cyathea+caracasana',
  },
];

/**
 * Bioregional template templates for diverse geographic zones on Earth.
 */
interface BioTemplate {
  commonName: string;
  scientificName: string;
  type: 'fauna' | 'flora';
  iucnStatus: IUCNCategory;
  iucnCategoryLabel: string;
  mitigationMeasure: string;
  riskLevel: 'critical' | 'high' | 'medium' | 'low';
  source: 'GBIF' | 'iNaturalist' | 'IUCN';
  imageUrl?: string;
  typicalOffsetMeters: number; // typical distance from axis
}

function getRegionalCatalog(lat: number, lng: number): { zoneName: string; templates: BioTemplate[] } {
  // 1. Iberian Peninsula / Spain / Portugal (lat 35 - 44, lng -10 to 4)
  if (lat >= 35 && lat <= 44 && lng >= -10 && lng <= 4) {
    return {
      zoneName: 'Península Ibérica (Región Mediterránea & Atlántica)',
      templates: [
        {
          commonName: 'Lince Ibérico',
          scientificName: 'Lynx pardinus',
          type: 'fauna',
          iucnStatus: 'EN',
          iucnCategoryLabel: 'EN PELIGRO (EN)',
          mitigationMeasure: 'Ecoducto forestado y vallado cinegético reforzado',
          riskLevel: 'critical',
          source: 'GBIF',
          imageUrl: 'https://images.unsplash.com/photo-1579829366248-204fe8413f31?w=400&auto=format&fit=crop&q=80',
          typicalOffsetMeters: 280,
        },
        {
          commonName: 'Águila Imperial Ibérica',
          scientificName: 'Aquila adalberti',
          type: 'fauna',
          iucnStatus: 'VU',
          iucnCategoryLabel: 'VULNERABLE (VU)',
          mitigationMeasure: 'Aislamiento de tendidos y radio de protección de nidos 1.5 km',
          riskLevel: 'high',
          source: 'iNaturalist',
          typicalOffsetMeters: 1200,
        },
        {
          commonName: 'Lobo Ibérico',
          scientificName: 'Canis lupus signatus',
          type: 'fauna',
          iucnStatus: 'VU',
          iucnCategoryLabel: 'VULNERABLE (VU)',
          mitigationMeasure: 'Pasos de gran fauna y señalización reflectante anti-atropello',
          riskLevel: 'high',
          source: 'GBIF',
          typicalOffsetMeters: 850,
        },
        {
          commonName: 'Oso Pardo Cantábrico',
          scientificName: 'Ursus arctos',
          type: 'fauna',
          iucnStatus: 'EN',
          iucnCategoryLabel: 'EN PELIGRO (EN)',
          mitigationMeasure: 'Corredor verde elevado con sustrato vegetal autóctono',
          riskLevel: 'critical',
          source: 'IUCN',
          typicalOffsetMeters: 620,
        },
        {
          commonName: 'Nutria Paleártica',
          scientificName: 'Lutra lutra',
          type: 'fauna',
          iucnStatus: 'NT',
          iucnCategoryLabel: 'CASI AMENAZADO (NT)',
          mitigationMeasure: 'Pasos secos en estribos de viaductos fluviales',
          riskLevel: 'medium',
          source: 'iNaturalist',
          typicalOffsetMeters: 410,
        },
        {
          commonName: 'Alcornoque Mediterráneo',
          scientificName: 'Quercus suber',
          type: 'flora',
          iucnStatus: 'LC',
          iucnCategoryLabel: 'PROTEGIDO REGIONAL',
          mitigationMeasure: 'Veda de tala en dehesa madura y transplante selectivo',
          riskLevel: 'high',
          source: 'GBIF',
          typicalOffsetMeters: 150,
        },
        {
          commonName: 'Encina Centenaria',
          scientificName: 'Quercus ilex',
          type: 'flora',
          iucnStatus: 'LC',
          iucnCategoryLabel: 'ECOSISTEMA MADURO',
          mitigationMeasure: 'Compensación de arbolado 5:1 con especies autóctonas',
          riskLevel: 'medium',
          source: 'GBIF',
          typicalOffsetMeters: 90,
        },
        {
          commonName: 'Tejo Común Cantábrico',
          scientificName: 'Taxus baccata',
          type: 'flora',
          iucnStatus: 'VU',
          iucnCategoryLabel: 'VULNERABLE (VU)',
          mitigationMeasure: 'Resguardo de rodales relictos en vaguadas húmedas',
          riskLevel: 'high',
          source: 'IUCN',
          typicalOffsetMeters: 480,
        },
      ],
    };
  }

  // 2. Central/Northern Andes (Colombia, Ecuador, Venezuela, Peru)
  if (lat >= -5 && lat <= 12 && lng >= -80 && lng <= -68) {
    return {
      zoneName: 'Andes Septentrionales (Bosque de Niebla y Páramo)',
      templates: [
        {
          commonName: 'Oso Andino (Oso de Anteojos)',
          scientificName: 'Tremarctos ornatus',
          type: 'fauna',
          iucnStatus: 'EN',
          iucnCategoryLabel: 'EN PELIGRO (EN)',
          mitigationMeasure: 'Ecoducto superior Km 4.8 con cobertura de estrato medio',
          riskLevel: 'critical',
          source: 'GBIF',
          imageUrl: 'https://images.unsplash.com/photo-1579829366248-204fe8413f31?w=400&auto=format&fit=crop&q=80',
          typicalOffsetMeters: 380,
        },
        {
          commonName: 'Danta de Páramo (Tapir Andino)',
          scientificName: 'Tapirus pinchaque',
          type: 'fauna',
          iucnStatus: 'CR',
          iucnCategoryLabel: 'CRÍTICO (CR)',
          mitigationMeasure: 'Corredor biológico altoandino y vallado cinegético continuo',
          riskLevel: 'critical',
          source: 'iNaturalist',
          typicalOffsetMeters: 740,
        },
        {
          commonName: 'Puma Concolor',
          scientificName: 'Puma concolor',
          type: 'fauna',
          iucnStatus: 'VU',
          iucnCategoryLabel: 'VULNERABLE (VU)',
          mitigationMeasure: 'Paso inferior húmedo y señalización luminosa en pasos nocturnos',
          riskLevel: 'high',
          source: 'GBIF',
          typicalOffsetMeters: 920,
        },
        {
          commonName: 'Rana de Cristal Andina',
          scientificName: 'Centrolene buckleyi',
          type: 'fauna',
          iucnStatus: 'CR',
          iucnCategoryLabel: 'CRÍTICO (CR)',
          mitigationMeasure: 'Viaducto aéreo en cuenca hídrica sin pilas en cauce',
          riskLevel: 'critical',
          source: 'IUCN',
          typicalOffsetMeters: 190,
        },
        {
          commonName: 'Cóndor Andino',
          scientificName: 'Vultur gryphus',
          type: 'fauna',
          iucnStatus: 'VU',
          iucnCategoryLabel: 'VULNERABLE (VU)',
          mitigationMeasure: 'Zona de exclusión sonora y protección de dormideros rocosos',
          riskLevel: 'high',
          source: 'iNaturalist',
          typicalOffsetMeters: 2200,
        },
        {
          commonName: 'Palma de Cera del Quindío',
          scientificName: 'Ceroxylon quindiuense',
          type: 'flora',
          iucnStatus: 'EN',
          iucnCategoryLabel: 'EN PELIGRO (EN)',
          mitigationMeasure: 'Ajuste de traza geométrica para conservar rodales de palmas vivas',
          riskLevel: 'critical',
          source: 'GBIF',
          typicalOffsetMeters: 120,
        },
        {
          commonName: 'Frailejón de Páramo',
          scientificName: 'Espeletia grandiflora',
          type: 'flora',
          iucnStatus: 'VU',
          iucnCategoryLabel: 'VULNERABLE (VU)',
          mitigationMeasure: 'Prohibición de tránsito de maquinaria pesada sobre suelo de turbera',
          riskLevel: 'high',
          source: 'iNaturalist',
          typicalOffsetMeters: 310,
        },
        {
          commonName: 'Pino Romero de Niebla',
          scientificName: 'Retrophyllum rospigliosii',
          type: 'flora',
          iucnStatus: 'VU',
          iucnCategoryLabel: 'VULNERABLE (VU)',
          mitigationMeasure: 'Rescate de brinzales y reforestación de taludes con especies nativas',
          riskLevel: 'high',
          source: 'GBIF',
          typicalOffsetMeters: 450,
        },
        {
          commonName: 'Orquídea Dracula',
          scientificName: 'Dracula simia',
          type: 'flora',
          iucnStatus: 'CR',
          iucnCategoryLabel: 'CRÍTICO (CR)',
          mitigationMeasure: 'Relocalización de epífitas en árboles nodriza fuera de la franja de tala',
          riskLevel: 'critical',
          source: 'IUCN',
          typicalOffsetMeters: 260,
        },
      ],
    };
  }

  // 3. Mexico & Central America (lat 10 - 32, lng -118 to -85)
  if (lat >= 10 && lat <= 32 && lng >= -118 && lng <= -85) {
    return {
      zoneName: 'Mesoamérica (Selva Tropical y Bosque de Niebla)',
      templates: [
        {
          commonName: 'Jaguar Mesoamericano',
          scientificName: 'Panthera onca',
          type: 'fauna',
          iucnStatus: 'NT',
          iucnCategoryLabel: 'AMENAZADO (NT)',
          mitigationMeasure: 'Corredor biológico selvático y pasos elevados de fauna',
          riskLevel: 'critical',
          source: 'GBIF',
          typicalOffsetMeters: 450,
        },
        {
          commonName: 'Tapir de Baird',
          scientificName: 'Tapirus bairdii',
          type: 'fauna',
          iucnStatus: 'EN',
          iucnCategoryLabel: 'EN PELIGRO (EN)',
          mitigationMeasure: 'Pasos inferiores sobredimensionados con vegetación de borde',
          riskLevel: 'critical',
          source: 'iNaturalist',
          typicalOffsetMeters: 610,
        },
        {
          commonName: 'Mono Araña Centroamericano',
          scientificName: 'Ateles geoffroyi',
          type: 'fauna',
          iucnStatus: 'EN',
          iucnCategoryLabel: 'EN PELIGRO (EN)',
          mitigationMeasure: 'Puentes de dosel aéreo (canopy bridges) sobre la calzada',
          riskLevel: 'critical',
          source: 'GBIF',
          typicalOffsetMeters: 220,
        },
        {
          commonName: 'Quetzal Resplandeciente',
          scientificName: 'Pharomachrus mocinno',
          type: 'fauna',
          iucnStatus: 'NT',
          iucnCategoryLabel: 'CASI AMENAZADO (NT)',
          mitigationMeasure: 'Preservación de árboles de aguacatillo en franja de 2 km',
          riskLevel: 'high',
          source: 'IUCN',
          typicalOffsetMeters: 1400,
        },
        {
          commonName: 'Árbol de Ceiba Sagrada',
          scientificName: 'Ceiba pentandra',
          type: 'flora',
          iucnStatus: 'LC',
          iucnCategoryLabel: 'ÁRBOL PATRIMONIAL',
          mitigationMeasure: 'Desvío de trazado para evitar corte de ejemplares monumentales',
          riskLevel: 'high',
          source: 'GBIF',
          typicalOffsetMeters: 80,
        },
        {
          commonName: 'Caoba Americana',
          scientificName: 'Swietenia macrophylla',
          type: 'flora',
          iucnStatus: 'VU',
          iucnCategoryLabel: 'VULNERABLE (VU)',
          mitigationMeasure: 'Veda forestal CITES y custodia de banco genético',
          riskLevel: 'critical',
          source: 'IUCN',
          typicalOffsetMeters: 340,
        },
      ],
    };
  }

  // 4. North America (lat 30 - 55, lng -125 to -70)
  if (lat >= 30 && lat <= 55 && lng >= -125 && lng <= -70) {
    return {
      zoneName: 'Norteamérica Templada (Bosque Mixto y Montaña)',
      templates: [
        {
          commonName: 'Oso Pardo (Grizzly Bear)',
          scientificName: 'Ursus arctos horribilis',
          type: 'fauna',
          iucnStatus: 'VU',
          iucnCategoryLabel: 'VULNERABLE (VU)',
          mitigationMeasure: 'Grandes pasos de fauna sobreelevados con pantallas visuales',
          riskLevel: 'critical',
          source: 'GBIF',
          typicalOffsetMeters: 750,
        },
        {
          commonName: 'Lobo Gris',
          scientificName: 'Canis lupus',
          type: 'fauna',
          iucnStatus: 'LC',
          iucnCategoryLabel: 'PROTECCIÓN ESPECIAL',
          mitigationMeasure: 'Vallado continuo de 2.4m y pasos inferiores adaptados',
          riskLevel: 'high',
          source: 'iNaturalist',
          typicalOffsetMeters: 1100,
        },
        {
          commonName: 'Águila Calva',
          scientificName: 'Haliaeetus leucocephalus',
          type: 'fauna',
          iucnStatus: 'LC',
          iucnCategoryLabel: 'LEGISLACIÓN MBTA',
          mitigationMeasure: 'Zona de amortiguamiento acústico alrededor de perchas ribereñas',
          riskLevel: 'medium',
          source: 'GBIF',
          typicalOffsetMeters: 1600,
        },
        {
          commonName: 'Secuoya Roja Gigante',
          scientificName: 'Sequoia sempervirens',
          type: 'flora',
          iucnStatus: 'EN',
          iucnCategoryLabel: 'EN PELIGRO (EN)',
          mitigationMeasure: 'Protección estricta de sistema radicular a 30m del fuste',
          riskLevel: 'critical',
          source: 'IUCN',
          typicalOffsetMeters: 190,
        },
        {
          commonName: 'Pino Douglas',
          scientificName: 'Pseudotsuga menziesii',
          type: 'flora',
          iucnStatus: 'LC',
          iucnCategoryLabel: 'BOSQUE CLÍMAX',
          mitigationMeasure: 'Revegetación de terraplenes con mezclas de semillas certificadas',
          riskLevel: 'medium',
          source: 'GBIF',
          typicalOffsetMeters: 90,
        },
      ],
    };
  }

  // 5. Southern Cone (Chile, Argentina, Uruguay, Paraguay: lat -56 to -20, lng -76 to -50)
  if (lat <= -20 && lat >= -56 && lng >= -76 && lng <= -50) {
    return {
      zoneName: 'Cono Sur & Patagonia (Estepa y Bosque Andino-Patagónico)',
      templates: [
        {
          commonName: 'Huemul del Sur',
          scientificName: 'Hippocamelus bisulcus',
          type: 'fauna',
          iucnStatus: 'EN',
          iucnCategoryLabel: 'EN PELIGRO (EN)',
          mitigationMeasure: 'Pasos de fauna amplios sin barreras acústicas artificiales',
          riskLevel: 'critical',
          source: 'GBIF',
          typicalOffsetMeters: 420,
        },
        {
          commonName: 'Guanaco Patagónico',
          scientificName: 'Lama guanicoe',
          type: 'fauna',
          iucnStatus: 'LC',
          iucnCategoryLabel: 'MIGRACIÓN ESTACIONAL',
          mitigationMeasure: 'Alambrados amigables de 3 hilos y rampas de cruce',
          riskLevel: 'high',
          source: 'iNaturalist',
          typicalOffsetMeters: 650,
        },
        {
          commonName: 'Puma Austral',
          scientificName: 'Puma concolor puma',
          type: 'fauna',
          iucnStatus: 'NT',
          iucnCategoryLabel: 'CASI AMENAZADO (NT)',
          mitigationMeasure: 'Ecoducto mixto y reducción de velocidad en curvas críticas',
          riskLevel: 'high',
          source: 'GBIF',
          typicalOffsetMeters: 890,
        },
        {
          commonName: 'Araucaria / Pehuén',
          scientificName: 'Araucaria araucana',
          type: 'flora',
          iucnStatus: 'EN',
          iucnCategoryLabel: 'EN PELIGRO (EN)',
          mitigationMeasure: 'Veda total de tala • Monumento natural protegido',
          riskLevel: 'critical',
          source: 'IUCN',
          typicalOffsetMeters: 130,
        },
        {
          commonName: 'Alerce Milenario',
          scientificName: 'Fitzroya cupressoides',
          type: 'flora',
          iucnStatus: 'EN',
          iucnCategoryLabel: 'EN PELIGRO (EN)',
          mitigationMeasure: 'Desvío perimetral de obras a más de 500m del rodal relicto',
          riskLevel: 'critical',
          source: 'GBIF',
          typicalOffsetMeters: 310,
        },
      ],
    };
  }

  // 6. Global default (Tropical / Subtropical / Temperate)
  return {
    zoneName: `Zona Geográfica (${lat.toFixed(2)}°, ${lng.toFixed(2)}°)`,
    templates: [
      {
        commonName: 'Gato Montés Silvestre',
        scientificName: 'Felis silvestris',
        type: 'fauna',
        iucnStatus: 'LC',
        iucnCategoryLabel: 'PROTEGIDO REGIONAL',
        mitigationMeasure: 'Paso seco inferior y barreras opacas fonoabsorbentes',
        riskLevel: 'medium',
        source: 'GBIF',
        typicalOffsetMeters: 350,
      },
      {
        commonName: 'Nutria de Río',
        scientificName: 'Lutra lutra',
        type: 'fauna',
        iucnStatus: 'NT',
        iucnCategoryLabel: 'CASI AMENAZADO (NT)',
        mitigationMeasure: 'Paso de ribera seco bajo el viaducto fluvial',
        riskLevel: 'high',
        source: 'iNaturalist',
        typicalOffsetMeters: 210,
      },
      {
        commonName: 'Corzo Euroasiático',
        scientificName: 'Capreolus capreolus',
        type: 'fauna',
        iucnStatus: 'LC',
        iucnCategoryLabel: 'VALLADO OBLIGATORIO',
        mitigationMeasure: 'Vallado perimetral con saltaderos de escape unidireccionales',
        riskLevel: 'high',
        source: 'GBIF',
        typicalOffsetMeters: 780,
      },
      {
        commonName: 'Búho Real',
        scientificName: 'Bubo bubo',
        type: 'fauna',
        iucnStatus: 'LC',
        iucnCategoryLabel: 'SENSIBLE AL RUIDO',
        mitigationMeasure: 'Pantallas acústicas y desvío de luminarias hacia abajo',
        riskLevel: 'medium',
        source: 'iNaturalist',
        typicalOffsetMeters: 1350,
      },
      {
        commonName: 'Roble Común',
        scientificName: 'Quercus robur',
        type: 'flora',
        iucnStatus: 'LC',
        iucnCategoryLabel: 'BOSQUE NATIVO',
        mitigationMeasure: 'Conservación de pies añosos y compensación biológica',
        riskLevel: 'medium',
        source: 'GBIF',
        typicalOffsetMeters: 120,
      },
      {
        commonName: 'Fresno Ribereño',
        scientificName: 'Fraxinus excelsior',
        type: 'flora',
        iucnStatus: 'NT',
        iucnCategoryLabel: 'BOSQUE DE GALERÍA',
        mitigationMeasure: 'Restauración del bosque de ribera y protección de taludes',
        riskLevel: 'high',
        source: 'GBIF',
        typicalOffsetMeters: 290,
      },
    ],
  };
}

/**
 * Spatial calculation: Fetch and calculate the specific species intercepted
 * by the user's drawn construction within their selected influence buffer (up to 5,000m).
 */
export async function fetchZoneSpeciesWithBuffer(
  routeCoords: [number, number][],
  bufferRadiusMeters: number
): Promise<{ species: SpeciesRecord[]; zoneName: string; totalIntercepted: number }> {
  // If no route is drawn, return empty or user-area default
  if (!routeCoords || routeCoords.length < 2) {
    return {
      species: [],
      zoneName: 'Sin construcción trazada',
      totalIntercepted: 0,
    };
  }

  // Calculate bounding box and centroid
  let minLat = 90;
  let maxLat = -90;
  let minLng = 180;
  let maxLng = -180;

  routeCoords.forEach(([lat, lng]) => {
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
    if (lng < minLng) minLng = lng;
    if (lng > maxLng) maxLng = lng;
  });

  const centerLat = (minLat + maxLat) / 2;
  const centerLng = (minLng + maxLng) / 2;
  const bufferKm = bufferRadiusMeters / 1000;

  // Build turf line string for real spatial point-to-line distance calculations
  const turfLine = turf.lineString(routeCoords.map(([lat, lng]) => [lng, lat]));

  // Get regional catalog base for the exact zone
  const regionalInfo = getRegionalCatalog(centerLat, centerLng);

  // Fetch live GBIF and iNaturalist data within the buffered bounding box
  const deltaLat = (bufferRadiusMeters / 111320) + 0.02;
  const deltaLng = (bufferRadiusMeters / (111320 * Math.max(0.1, Math.cos((centerLat * Math.PI) / 180)))) + 0.02;

  let liveRecords: SpeciesRecord[] = [];

  try {
    const gbifPromise = fetch(
      `https://api.gbif.org/v1/occurrence/search?decimalLatitude=${(minLat - deltaLat).toFixed(4)},${(maxLat + deltaLat).toFixed(4)}&decimalLongitude=${(minLng - deltaLng).toFixed(4)},${(maxLng + deltaLng).toFixed(4)}&hasCoordinate=true&limit=250`,
      { signal: AbortSignal.timeout(5000) }
    )
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data || !data.results) return [];
        const speciesMap = new Map<string, SpeciesRecord>();

        data.results.forEach((item: any) => {
          const name = item.species || item.scientificName;
          if (!name) return;
          const key = name.toLowerCase().trim();

          const verified = getVerifiedIUCNData(name, item.iucnRedListCategory, item.kingdom);
          const lat = item.decimalLatitude;
          const lng = item.decimalLongitude;

          if (lat !== undefined && lng !== undefined) {
            const distKm = turf.pointToLineDistance(turf.point([lng, lat]), turfLine, { units: 'kilometers' });
            const distMeters = Math.round(distKm * 1000);

            // Strict filter: only record observations that physically lie within the user's influence buffer
            if (distMeters <= bufferRadiusMeters) {
              if (speciesMap.has(key)) {
                const existing = speciesMap.get(key)!;
                existing.observationCount = (existing.observationCount || 1) + 1;
                if (distMeters < (existing.distanceToLineMeters ?? 99999)) {
                  existing.distanceToLineMeters = distMeters;
                  existing.coordinates = [lat, lng];
                }
              } else {
                speciesMap.set(key, {
                  id: `gbif-${item.key}`,
                  commonName: verified.commonName || item.vernacularName || name,
                  scientificName: name,
                  type: verified.type || (item.kingdom === 'Animalia' ? 'fauna' : 'flora'),
                  iucnStatus: verified.iucnStatus,
                  iucnCategoryLabel: verified.iucnCategoryLabel,
                  overlapKm: Math.round(Math.min(5, Math.max(0.4, distKm * 1.2)) * 10) / 10,
                  lostAreaHa: Math.round(((bufferRadiusMeters / 1000) * 3.5) * 10) / 10,
                  mitigationMeasure: verified.mitigationMeasure || (item.kingdom === 'Animalia' ? 'Paso de fauna y señalización adaptada' : 'Monitoreo botánico y veda local'),
                  riskLevel: verified.riskLevel,
                  source: 'GBIF',
                  coordinates: [lat, lng],
                  distanceToLineMeters: distMeters,
                  isInBuffer: true,
                  observationCount: 1,
                  inaturalistUrl: `https://www.inaturalist.org/taxa?q=${encodeURIComponent(name)}`,
                });
              }
            }
          }
        });
        return Array.from(speciesMap.values());
      })
      .catch(() => [] as SpeciesRecord[]);

    const inatPromise = fetch(
      `https://api.inaturalist.org/v1/observations?nelat=${(maxLat + deltaLat).toFixed(4)}&nelng=${(maxLng + deltaLng).toFixed(4)}&swlat=${(minLat - deltaLat).toFixed(4)}&swlng=${(minLng - deltaLng).toFixed(4)}&per_page=200&order=desc`,
      { signal: AbortSignal.timeout(5000) }
    )
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data || !data.results) return [];
        const speciesMap = new Map<string, SpeciesRecord>();

        data.results.forEach((obs: any) => {
          const taxon = obs.taxon;
          if (!taxon || !taxon.name) return;
          const key = taxon.name.toLowerCase().trim();

          // Check iNaturalist conservation status code if available
          let rawIucn: string | undefined = undefined;
          if (taxon.conservation_status?.status) {
            rawIucn = taxon.conservation_status.status;
          } else if (typeof taxon.conservation_status?.iucn === 'number') {
            const code = taxon.conservation_status.iucn;
            if (code >= 60) rawIucn = 'CR';
            else if (code >= 50) rawIucn = 'EN';
            else if (code >= 40) rawIucn = 'VU';
            else if (code >= 30) rawIucn = 'NT';
            else if (code >= 20) rawIucn = 'LC';
            else if (code >= 10) rawIucn = 'DD';
          } else if (taxon.threatened) {
            rawIucn = 'VU';
          }

          const isFauna = ['Aves', 'Mammalia', 'Reptilia', 'Amphibia', 'Actinopterygii', 'Insecta', 'Arachnida', 'Animalia', 'Mollusca'].includes(taxon.iconic_taxon_name);
          const kingdom = isFauna ? 'Animalia' : 'Plantae';
          const verified = getVerifiedIUCNData(taxon.name, rawIucn, kingdom);

          if (obs.geojson && obs.geojson.coordinates) {
            const [lng, lat] = obs.geojson.coordinates;
            const distKm = turf.pointToLineDistance(turf.point([lng, lat]), turfLine, { units: 'kilometers' });
            const distMeters = Math.round(distKm * 1000);

            // Strict filter: only record observations that physically lie within the user's influence buffer
            if (distMeters <= bufferRadiusMeters) {
              const obsUrl = obs.id
                ? `https://www.inaturalist.org/observations/${obs.id}`
                : `https://www.inaturalist.org/taxa?q=${encodeURIComponent(taxon.name)}`;

              if (speciesMap.has(key)) {
                const existing = speciesMap.get(key)!;
                existing.observationCount = (existing.observationCount || 1) + 1;
                if (distMeters < (existing.distanceToLineMeters ?? 99999)) {
                  existing.distanceToLineMeters = distMeters;
                  existing.coordinates = [lat, lng];
                }
                if (!existing.imageUrl && obs.photos?.[0]?.url) {
                  existing.imageUrl = obs.photos[0].url.replace('square', 'medium');
                }
                if (!existing.inaturalistUrl || !existing.inaturalistUrl.includes('/observations/')) {
                  existing.inaturalistUrl = obsUrl;
                }
              } else {
                speciesMap.set(key, {
                  id: `inat-${obs.id}`,
                  commonName: verified.commonName || taxon.preferred_common_name || taxon.name,
                  scientificName: taxon.name,
                  type: verified.type || (kingdom === 'Plantae' ? 'flora' : 'fauna'),
                  iucnStatus: verified.iucnStatus,
                  iucnCategoryLabel: verified.iucnCategoryLabel,
                  overlapKm: Math.round(Math.min(6, Math.max(0.6, distKm * 1.3)) * 10) / 10,
                  lostAreaHa: Math.round(((bufferRadiusMeters / 1000) * 4.5) * 10) / 10,
                  mitigationMeasure: verified.mitigationMeasure || (kingdom === 'Plantae' ? 'Rescate de germoplasma y vivero forestal' : 'Ecoducto mixto y sensor de presencia'),
                  riskLevel: verified.riskLevel,
                  source: 'iNaturalist',
                  imageUrl: obs.photos?.[0]?.url?.replace('square', 'medium'),
                  coordinates: [lat, lng],
                  distanceToLineMeters: distMeters,
                  isInBuffer: true,
                  observationCount: 1,
                  inaturalistUrl: obsUrl,
                });
              }
            }
          }
        });
        return Array.from(speciesMap.values());
      })
      .catch(() => [] as SpeciesRecord[]);

    const [gbifList, inatList] = await Promise.all([gbifPromise, inatPromise]);
    liveRecords = [...gbifList, ...inatList];
  } catch (err) {
    console.warn('Live API query error:', err);
  }

  // Combine authentic live records from GBIF and iNaturalist strictly inside the buffer,
  // de-duplicating by scientific name and summing observation counts
  const combinedMap = new Map<string, SpeciesRecord>();

  liveRecords.forEach((sp) => {
    const key = sp.scientificName.toLowerCase().trim();
    if (combinedMap.has(key)) {
      const existing = combinedMap.get(key)!;
      existing.observationCount = (existing.observationCount || 1) + (sp.observationCount || 1);
      if ((sp.distanceToLineMeters ?? 99999) < (existing.distanceToLineMeters ?? 99999)) {
        existing.distanceToLineMeters = sp.distanceToLineMeters;
        existing.coordinates = sp.coordinates;
      }
      if (sp.imageUrl && !existing.imageUrl) {
        existing.imageUrl = sp.imageUrl;
      }
      if (sp.inaturalistUrl?.includes('/observations/') && !existing.inaturalistUrl?.includes('/observations/')) {
        existing.inaturalistUrl = sp.inaturalistUrl;
      }
    } else {
      combinedMap.set(key, { ...sp });
    }
  });

  const allResultSpecies = Array.from(combinedMap.values());

  // Sort strictly by closest distance to the construction alignment
  allResultSpecies.sort((a, b) => (a.distanceToLineMeters ?? 9999) - (b.distanceToLineMeters ?? 9999));

  return {
    species: allResultSpecies,
    zoneName: regionalInfo.zoneName,
    totalIntercepted: allResultSpecies.length,
  };
}

/**
 * Legacy helpers for compatibility
 */
export async function fetchGBIFSpecies(
  lat: number,
  lng: number,
  limit = 10
): Promise<SpeciesRecord[]> {
  const delta = 0.08;
  const url = `https://api.gbif.org/v1/occurrence/search?decimalLatitude=${lat - delta},${lat + delta}&decimalLongitude=${lng - delta},${lng + delta}&hasCoordinate=true&limit=${limit}`;

  try {
    const resp = await fetch(url, { signal: AbortSignal.timeout(4000) });
    if (!resp.ok) return [];
    const data = await resp.json();
    if (!data.results) return [];

    return data.results.map((item: any) => {
      const name = item.species || item.scientificName;
      const verified = getVerifiedIUCNData(name, item.iucnRedListCategory, item.kingdom);
      return {
        id: `gbif-${item.key}`,
        commonName: verified.commonName || item.vernacularName || name.split(' ')[0],
        scientificName: name,
        type: verified.type || (item.kingdom === 'Animalia' ? 'fauna' : 'flora'),
        iucnStatus: verified.iucnStatus,
        iucnCategoryLabel: verified.iucnCategoryLabel,
        overlapKm: 2.5,
        lostAreaHa: 4.8,
        mitigationMeasure: verified.mitigationMeasure || 'Paso de fauna y reducción de velocidad',
        riskLevel: verified.riskLevel,
        source: 'GBIF',
        coordinates: item.decimalLatitude && item.decimalLongitude ? [item.decimalLatitude, item.decimalLongitude] : undefined,
      } as SpeciesRecord;
    });
  } catch {
    return [];
  }
}

export async function fetchINaturalistObservations(
  lat: number,
  lng: number,
  radiusKm = 15
): Promise<SpeciesRecord[]> {
  const url = `https://api.inaturalist.org/v1/observations?lat=${lat}&lng=${lng}&radius=${radiusKm}&per_page=12&order=desc&order_by=votes`;
  try {
    const resp = await fetch(url, { signal: AbortSignal.timeout(4000) });
    if (!resp.ok) return [];
    const data = await resp.json();
    if (!data.results) return [];

    return data.results
      .filter((obs: any) => obs.taxon && obs.taxon.name)
      .map((obs: any) => {
        const taxon = obs.taxon;
        let rawIucn: string | undefined;
        if (taxon.conservation_status?.status) {
          rawIucn = taxon.conservation_status.status;
        } else if (typeof taxon.conservation_status?.iucn === 'number') {
          const code = taxon.conservation_status.iucn;
          if (code >= 60) rawIucn = 'CR';
          else if (code >= 50) rawIucn = 'EN';
          else if (code >= 40) rawIucn = 'VU';
          else if (code >= 30) rawIucn = 'NT';
          else if (code >= 20) rawIucn = 'LC';
          else if (code >= 10) rawIucn = 'DD';
        } else if (taxon.threatened) {
          rawIucn = 'VU';
        }

        const kingdom = taxon.iconic_taxon_name === 'Plantae' ? 'Plantae' : 'Animalia';
        const verified = getVerifiedIUCNData(taxon.name, rawIucn, kingdom);

        return {
          id: `inat-${obs.id}`,
          commonName: verified.commonName || taxon.preferred_common_name || taxon.name,
          scientificName: taxon.name,
          type: verified.type || (kingdom === 'Plantae' ? 'flora' : 'fauna'),
          iucnStatus: verified.iucnStatus,
          iucnCategoryLabel: verified.iucnCategoryLabel,
          overlapKm: 3.2,
          lostAreaHa: 6.4,
          mitigationMeasure: verified.mitigationMeasure || 'Monitoreo de fauna y restauración de hábitat',
          riskLevel: verified.riskLevel,
          source: 'iNaturalist',
          imageUrl: obs.photos?.[0]?.url?.replace('square', 'medium'),
          coordinates: obs.geojson?.coordinates ? [obs.geojson.coordinates[1], obs.geojson.coordinates[0]] : undefined,
        } as SpeciesRecord;
      });
  } catch {
    return [];
  }
}

export async function fetchOverpassTerritorialFeatures(
  bounds: { south: number; west: number; north: number; east: number }
): Promise<any | null> {
  const query = `
    [out:json][timeout:10];
    (
      relation["boundary"="protected_area"](${bounds.south},${bounds.west},${bounds.north},${bounds.east});
      way["leisure"="nature_reserve"](${bounds.south},${bounds.west},${bounds.north},${bounds.east});
      way["waterway"="river"](${bounds.south},${bounds.west},${bounds.north},${bounds.east});
    );
    out geom 30;
  `;

  try {
    const resp = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: query,
      signal: AbortSignal.timeout(5000),
    });
    if (!resp.ok) return null;
    return await resp.json();
  } catch {
    return null;
  }
}
