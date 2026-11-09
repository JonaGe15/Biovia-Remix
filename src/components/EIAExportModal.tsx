import React from 'react';
import { ImpactMetrics, SpeciesRecord } from '../types';

interface EIAExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  metrics: ImpactMetrics;
  speciesList: SpeciesRecord[];
  onDownloadGeoJSON: () => void;
}

export const EIAExportModal: React.FC<EIAExportModalProps> = ({
  isOpen,
  onClose,
  metrics,
  speciesList,
  onDownloadGeoJSON,
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-[#FAF8F5] w-full max-w-2xl rounded-2xl shadow-2xl border border-white/90 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-white/90 border-b border-[#D8D2C7]/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#2E6F40]/10 flex items-center justify-center text-[#2E6F40]">
              <span className="material-symbols-outlined text-[20px]">description</span>
            </div>
            <div>
              <h3 className="font-['Space_Grotesk'] text-[16px] font-bold text-[#1A231E]">
                Dictamen Técnico de Impacto Ambiental (EIA)
              </h3>
              <p className="text-[11px] text-[#4A5D52]">
                Corredor BioVía Andino - Tramo N-14 • Certificación Geoespacial
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#8C968E] hover:text-[#1A231E] hover:bg-[#EAE6DE] transition-colors cursor-pointer"
            aria-label="Cerrar modal"
          >
            ✕
          </button>
        </div>

        {/* Report Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-[13px] text-[#1A231E]">
          {/* Executive Summary */}
          <div className="p-4 rounded-xl bg-white border border-[#D8D2C7]/60 shadow-xs">
            <h4 className="font-['Space_Grotesk'] text-[13px] font-bold text-[#2E6F40] uppercase tracking-wider mb-2">
              Resumen Ejecutivo de Afectación
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-2 bg-[#FAF8F5] rounded-lg">
                <span className="text-[10px] text-[#4A5D52] block">Longitud Traza</span>
                <span className="font-['Space_Grotesk'] text-[15px] font-bold text-[#1A231E]">
                  {metrics.lengthKm} km
                </span>
              </div>
              <div className="p-2 bg-[#FAF8F5] rounded-lg">
                <span className="text-[10px] text-[#4A5D52] block">Desmonte Forestal</span>
                <span className="font-['Space_Grotesk'] text-[15px] font-bold text-[#D33F36]">
                  {metrics.vegetationLossHa} ha
                </span>
              </div>
              <div className="p-2 bg-[#FAF8F5] rounded-lg">
                <span className="text-[10px] text-[#4A5D52] block">Índice Afectación</span>
                <span className="font-['Space_Grotesk'] text-[15px] font-bold text-[#2E6F40]">
                  {metrics.isMitigated ? metrics.mitigatedScore : metrics.score} / 100
                </span>
              </div>
              <div className="p-2 bg-[#FAF8F5] rounded-lg">
                <span className="text-[10px] text-[#4A5D52] block">Especies Sensibles</span>
                <span className="font-['Space_Grotesk'] text-[15px] font-bold text-[#1A231E]">
                  {speciesList.length}
                </span>
              </div>
            </div>
          </div>

          {/* Environmental Compliance */}
          <div className="p-4 rounded-xl bg-white border border-[#D8D2C7]/60 shadow-xs space-y-2">
            <h4 className="font-['Space_Grotesk'] text-[13px] font-bold text-[#1A231E]">
              Evaluación Normativa y Criterios IUCN / GBIF
            </h4>
            <p className="text-[#4A5D52] text-[12px] leading-relaxed">
              El trazado propuesto intersecta un corredor ecológico de alta montaña calificado como hábitat
              crítico para <em>Tremarctos ornatus</em> y <em>Centrolene buckleyi</em>. Se condiciona la
              aprobación ambiental a la construcción obligatoria de al menos 2 pasos faunísticos (Ecoductos Km
              6.2 y Km 11.4) y a una compensación biótica de 10 hectáreas por cada hectárea de bosque de niebla
              desbrozada.
            </p>
          </div>

          {/* List of critical species */}
          <div className="space-y-2">
            <h4 className="font-['Space_Grotesk'] text-[13px] font-bold text-[#1A231E]">
              Censo de Especies Prioritarias Interceptadas
            </h4>
            <div className="border border-[#D8D2C7]/60 rounded-xl overflow-hidden bg-white text-[12px] max-h-72 overflow-y-auto">
              <table className="w-full text-left">
                <thead className="bg-[#FAF8F5] border-b border-[#D8D2C7]/60 text-[#4A5D52] font-['Space_Grotesk'] text-[11px] sticky top-0 z-10">
                  <tr>
                    <th className="p-2.5">Especie</th>
                    <th className="p-2.5">Tipo</th>
                    <th className="p-2.5">Estatus UICN</th>
                    <th className="p-2.5">Dist. / Obs.</th>
                    <th className="p-2.5">Medida de Mitigación</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D8D2C7]/40">
                  {speciesList.map((sp) => (
                    <tr key={sp.id} className="hover:bg-[#FAF8F5]/60">
                      <td className="p-2.5">
                        <span className="font-semibold block">{sp.commonName}</span>
                        <span className="text-[11px] italic text-[#4A5D52]">{sp.scientificName}</span>
                      </td>
                      <td className="p-2.5">
                        <span className={`text-[10px] font-bold ${sp.type === 'fauna' ? 'text-[#2E6F40]' : 'text-[#4D7C5F]'}`}>
                          {sp.type === 'fauna' ? 'Fauna' : 'Flora'}
                        </span>
                      </td>
                      <td className="p-2.5">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          sp.iucnStatus === 'CR' || sp.iucnStatus === 'EN'
                            ? 'bg-[#FDEAE8] text-[#D33F36]'
                            : sp.iucnStatus === 'VU'
                            ? 'bg-[#FEF3C7] text-[#B45309]'
                            : 'bg-[#EBF7EE] text-[#2E6F40]'
                        }`}>
                          {sp.iucnStatus}
                        </span>
                      </td>
                      <td className="p-2.5 text-[#4A5D52] text-[11px]">
                        <div>{sp.distanceToLineMeters !== undefined ? `${sp.distanceToLineMeters} m` : 'En franja'}</div>
                        <div className="text-[10px] text-[#8C968E]">{sp.observationCount || 1} obs.</div>
                      </td>
                      <td className="p-2.5 text-[11px] text-[#2E6F40] font-medium">{sp.mitigationMeasure || 'Monitoreo preventivo'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-white/90 border-t border-[#D8D2C7]/60 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-full text-[12px] font-['Space_Grotesk'] text-[#4A5D52] hover:bg-[#EAE6DE] transition-colors cursor-pointer"
          >
            Cerrar
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-[#D8D2C7] text-[12px] font-['Space_Grotesk'] font-medium text-[#1A231E] hover:bg-[#FAF8F5] transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">print</span>
              <span>Imprimir / Guardar PDF</span>
            </button>
            <button
              onClick={onDownloadGeoJSON}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#2E6F40] text-white text-[12px] font-['Space_Grotesk'] font-semibold hover:bg-[#245833] transition-all shadow-sm cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">download</span>
              <span>Descargar .GeoJSON</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
