import React from 'react';

interface MethodologyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MethodologyModal: React.FC<MethodologyModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[2500] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-4xl max-h-[90vh] bg-[#FAF8F5] rounded-3xl shadow-2xl border border-white/80 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-white/90 border-b border-[#D8D2C7]/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#2E6F40] to-[#4D7C5F] text-white flex items-center justify-center shadow-sm">
              <span className="material-symbols-outlined text-[24px]">functions</span>
            </div>
            <div>
              <h2 className="font-['Space_Grotesk'] text-[20px] font-bold text-[#1A231E]">
                Metodología y Fórmulas de Cálculo Geoespacial
              </h2>
              <p className="text-[12px] text-[#4A5D52]">
                BioVía Analytics Engine • Diagnóstico multicriterio en tiempo real
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-[#EFECE6] hover:bg-[#D8D2C7] text-[#1A231E] flex items-center justify-center cursor-pointer transition-colors"
            title="Cerrar ventana"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-[#1A231E] text-[13px] leading-relaxed">
          {/* Overview Banner */}
          <div className="bg-[#2E6F40]/10 border border-[#2E6F40]/30 rounded-2xl p-4 flex items-start gap-3">
            <span className="material-symbols-outlined text-[#2E6F40] text-[24px] shrink-0 mt-0.5">
              verified
            </span>
            <div>
              <h3 className="font-['Space_Grotesk'] text-[15px] font-bold text-[#2E6F40]">
                Transparencia de Datos y Modelado en Tiempo Real
              </h3>
              <p className="text-[12px] text-[#2E4F36] mt-1">
                Todas las métricas de BioVía son calculadas mediante análisis vectorial en el navegador usando <strong>Turf.js</strong>, integrando polígonos de amortiguamiento (buffer), cruces de capas territoriales y consultas a las APIs globales de <strong>GBIF</strong>, <strong>iNaturalist</strong> y la <strong>Lista Roja de la UICN</strong>.
              </p>
            </div>
          </div>

          {/* Grid of Formulas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 1. Indice Global de Afectacion */}
            <div className="bg-white rounded-2xl p-4 border border-[#D8D2C7]/70 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-['Space_Grotesk'] font-bold text-[14px] text-[#1A231E] flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[#D33F36] text-[18px]">emergency</span>
                    1. Índice Global de Afectación (0 a 100)
                  </span>
                  <span className="text-[10px] font-mono bg-[#EAE6DE] px-2 py-0.5 rounded font-bold">
                    Escala 0 - 100
                  </span>
                </div>
                <div className="bg-[#F7F5F0] rounded-xl p-3 font-mono text-[11px] text-[#2E6F40] border border-[#E0DBCF] my-2">
                  Score = Base × (Criterios_Activos / 6)
                </div>
                <p className="text-[12px] text-[#4A5D52]">
                  Donde <strong>Base = 68</strong> para traza convencional sin mitigar, y <strong>Base = 38</strong> cuando se habilitan ecoductos de fauna.
                </p>
                <div className="mt-2 text-[11px] text-[#8C968E] space-y-0.5">
                  <div>• 0 a 25: Impacto Bajo / Sostenible</div>
                  <div>• 26 a 50: Impacto Moderado (requiere mitigación)</div>
                  <div>• 51 a 75: Impacto Alto (fragmentación severa)</div>
                  <div>• 76 a 100: Impacto Crítico Severo</div>
                </div>
              </div>
            </div>

            {/* 2. Fragmentacion del Territorio */}
            <div className="bg-white rounded-2xl p-4 border border-[#D8D2C7]/70 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-['Space_Grotesk'] font-bold text-[14px] text-[#1A231E] flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[#E06D28] text-[18px]">broken_image</span>
                    2. Fragmentación Territorial (%)
                  </span>
                  <span className="text-[10px] font-mono bg-[#EAE6DE] px-2 py-0.5 rounded font-bold">
                    Porcentaje
                  </span>
                </div>
                <div className="bg-[#F7F5F0] rounded-xl p-3 font-mono text-[11px] text-[#2E6F40] border border-[#E0DBCF] my-2">
                  {`Sin Mitigar: Frag% = min(95, 34 × (L_km / 14.8))\nMitigado:    Frag% = max(4, 12 × (L_km / 14.8))`}
                </div>
                <p className="text-[12px] text-[#4A5D52]">
                  Mide el efecto barrera sobre el corredor biológico. Los pasos de fauna (ecoductos elevados y túneles húmedos) reducen la fragmentación un <strong>65%</strong> al restaurar la conectividad estructural.
                </p>
              </div>
            </div>

            {/* 3. Perdida Vegetal y Desmonte */}
            <div className="bg-white rounded-2xl p-4 border border-[#D8D2C7]/70 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-['Space_Grotesk'] font-bold text-[14px] text-[#1A231E] flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[#2E6F40] text-[18px]">forest</span>
                    3. Pérdida Vegetal y Desmonte (ha)
                  </span>
                  <span className="text-[10px] font-mono bg-[#EAE6DE] px-2 py-0.5 rounded font-bold">
                    Hectáreas
                  </span>
                </div>
                <div className="bg-[#F7F5F0] rounded-xl p-3 font-mono text-[11px] text-[#2E6F40] border border-[#E0DBCF] my-2">
                  Área (ha) = 28.4 × (Radio_Buffer / 500m) × (L_km / 14.8)
                </div>
                <p className="text-[12px] text-[#4A5D52]">
                  Calculado a partir del polígono geodésico de amortiguamiento generado por <strong>Turf.js buffer</strong>. Para el corredor base estándar de 14.8 km con buffer de 500m equivale exactamente a <strong>28.4 hectáreas</strong> de desmonte directo.
                </p>
              </div>
            </div>

            {/* 4. Emisiones de CO2 Evitado */}
            <div className="bg-white rounded-2xl p-4 border border-[#D8D2C7]/70 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-['Space_Grotesk'] font-bold text-[14px] text-[#1A231E] flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[#3B82A6] text-[18px]">energy_savings_leaf</span>
                    4. Emisiones de CO₂ Evitado (t/año)
                  </span>
                  <span className="text-[10px] font-mono bg-[#EAE6DE] px-2 py-0.5 rounded font-bold">
                    t / año
                  </span>
                </div>
                <div className="bg-[#F7F5F0] rounded-xl p-3 font-mono text-[11px] text-[#2E6F40] border border-[#E0DBCF] my-2">
                  CO₂ Evitado = 420 × (L_km / 14.8)
                </div>
                <p className="text-[12px] text-[#4A5D52]">
                  Basado en la optimización del trazado respecto a rutas de montaña sinuosas preexistentes, disminuyendo la distancia recorrida, las pendientes críticas y el consumo de combustible diésel del transporte de carga.
                </p>
              </div>
            </div>

            {/* 5. Indice de Conectividad */}
            <div className="bg-white rounded-2xl p-4 border border-[#D8D2C7]/70 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-['Space_Grotesk'] font-bold text-[14px] text-[#1A231E] flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[#2E6F40] text-[18px]">hub</span>
                    5. Índice de Conectividad Transversal
                  </span>
                  <span className="text-[10px] font-mono bg-[#EAE6DE] px-2 py-0.5 rounded font-bold">
                    Escala 1 al 10
                  </span>
                </div>
                <div className="bg-[#F7F5F0] rounded-xl p-3 font-mono text-[11px] text-[#2E6F40] border border-[#E0DBCF] my-2">
                  Inicial = 10.0 | Sin Mitigar = 4.8 | Con Ecoductos = 6.8
                </div>
                <p className="text-[12px] text-[#4A5D52]">
                  Califica la permeabilidad del hábitat para el flujo génico y desplazamiento de mamíferos grandes (como el Oso de Anteojos <em>Tremarctos ornatus</em> y el Puma <em>Puma concolor</em>).
                </p>
              </div>
            </div>

            {/* 6. Ponderacion Multicriterio */}
            <div className="bg-white rounded-2xl p-4 border border-[#D8D2C7]/70 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-['Space_Grotesk'] font-bold text-[14px] text-[#1A231E] flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[#4D7C5F] text-[18px]">checklist</span>
                    6. Criterios de Selección Multicriterio
                  </span>
                  <span className="text-[10px] font-mono bg-[#EAE6DE] px-2 py-0.5 rounded font-bold">
                    6 Capas
                  </span>
                </div>
                <div className="space-y-1.5 text-[11px] text-[#4A5D52] my-2">
                  <div>• <strong>Flora & Bosques:</strong> Biomasa y cobertura arbórea madura.</div>
                  <div>• <strong>Fauna Silvestre:</strong> Rutas de forrajeo y riesgo de atropellamiento.</div>
                  <div>• <strong>Corredores Biológicos:</strong> Conexión entre parches aislados.</div>
                  <div>• <strong>Áreas Protegidas:</strong> Reservas de la sociedad civil y parques.</div>
                  <div>• <strong>Cuencas Hidrográficas:</strong> Afluentes, rondas hídricas y nacimientos.</div>
                  <div>• <strong>Zonas Urbanas:</strong> Coeficiente de cercanía y perturbación antrópica.</div>
                </div>
              </div>
            </div>
          </div>

          {/* Sources and Scientific Attribution */}
          <div className="bg-[#FAF8F5] border border-[#D8D2C7] rounded-2xl p-4">
            <h4 className="font-['Space_Grotesk'] font-bold text-[13px] text-[#1A231E] mb-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-[#2E6F40]">public</span>
              Integración de APIs y Fuentes Científicas Oficiales
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[12px]">
              <div className="p-2.5 rounded-xl bg-white border border-[#E0DBCF]">
                <div className="font-bold text-[#2E6F40]">GBIF API</div>
                <div className="text-[#4A5D52] mt-0.5">
                  Global Biodiversity Information Facility: Registros taxonómicos georreferenciados.
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-white border border-[#E0DBCF]">
                <div className="font-bold text-[#4D7C5F]">iNaturalist API</div>
                <div className="text-[#4A5D52] mt-0.5">
                  Ciencia ciudadana y observaciones de campo con grado de investigación validado.
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-white border border-[#E0DBCF]">
                <div className="font-bold text-[#D33F36]">IUCN Red List API</div>
                <div className="text-[#4A5D52] mt-0.5">
                  Categorías oficiales de amenaza de la Unión Internacional para la Conservación de la Naturaleza (CR, EN, VU, NT, LC).
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-white/90 border-t border-[#D8D2C7]/70 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-full bg-[#2E6F40] hover:bg-[#255A34] text-white font-['Space_Grotesk'] text-[13px] font-semibold cursor-pointer shadow-md transition-all"
          >
            Entendido, Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
