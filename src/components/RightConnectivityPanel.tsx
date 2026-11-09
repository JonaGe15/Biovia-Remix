import React from 'react';
import { ImpactMetrics, DrawingToolType } from '../types';

interface RightConnectivityPanelProps {
  metrics: ImpactMetrics;
  routeCoords: [number, number][];
  bufferRadiusMeters: number;
  onBufferRadiusChange: (radius: number) => void;
  activeDrawingTool: DrawingToolType | null;
  onSelectDrawingTool: (tool: DrawingToolType) => void;
  isRemovalMode: boolean;
  onToggleRemovalMode: () => void;
  onUndo: () => void;
  onClearAll: () => void;
  onGoToSimulation: () => void;
  onOpenMethodology: () => void;
}

export const RightConnectivityPanel: React.FC<RightConnectivityPanelProps> = ({
  metrics,
  routeCoords,
  bufferRadiusMeters,
  onBufferRadiusChange,
  activeDrawingTool,
  onSelectDrawingTool,
  isRemovalMode,
  onToggleRemovalMode,
  onUndo,
  onClearAll,
  onGoToSimulation,
  onOpenMethodology,
}) => {
  const hasRoute = routeCoords && routeCoords.length >= 2;

  const toolCategories = [
    {
      title: 'Trazados Lineales',
      items: [
        {
          id: 'line-road' as DrawingToolType,
          label: 'Línea de Carretera Principal',
          description: 'Autovía de alta capacidad (doble calzada / troncal)',
          icon: 'conversion_path',
          color: '#2E6F40',
        },
        {
          id: 'line-secondary' as DrawingToolType,
          label: 'Vía Secundaria / Ramal',
          description: 'Carretera secundaria o camino rural de interconexión',
          icon: 'alt_route',
          color: '#4D7C5F',
        },
        {
          id: 'line-pipe' as DrawingToolType,
          label: 'Tuberías & Oleoductos',
          description: 'Redes de servicios, oleoductos y acueductos lineales',
          icon: 'swap_calls',
          color: '#3B82A6',
        },
        {
          id: 'line-free' as DrawingToolType,
          label: 'Trazado Libre',
          description: 'Polilínea continua de libre alineamiento en el mapa',
          icon: 'draw',
          color: '#6366F1',
        },
      ],
    },
    {
      title: 'Nodos & Áreas de Infraestructura',
      items: [
        {
          id: 'circle-roundabout' as DrawingToolType,
          label: 'Círculos (Glorietas / Nodos)',
          description: 'Intercambiadores rotatorios, distribuidores y glorietas viales',
          icon: 'radio_button_unchecked',
          color: '#E06D28',
        },
        {
          id: 'box-infra' as DrawingToolType,
          label: 'Cuadros de Infraestructura',
          description: 'Estaciones de peaje, centros logísticos y terminales',
          icon: 'crop_square',
          color: '#8A5D3B',
        },
        {
          id: 'polygon-urban' as DrawingToolType,
          label: 'Ciudades & Zonas Urbanas',
          description: 'Polígonos de expansión urbana, polos residenciales o industriales',
          icon: 'apartment',
          color: '#475569',
        },
      ],
    },
  ];

  return (
    <aside className="relative w-[420px] h-full flex flex-col bg-[#FAF8F5]/90 backdrop-blur-2xl shadow-[-4px_0_30px_rgba(26,35,30,0.06)] border-l border-white/80 z-40 overflow-hidden">
      {/* Panel Header */}
      <div className="p-4 pb-3 bg-gradient-to-b from-white/90 to-transparent border-b border-[#D8D2C7]/50">
        <div className="flex items-center justify-between mb-1.5">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#2E6F40]/10 text-[#2E6F40] border border-[#2E6F40]/20 font-['Space_Grotesk'] text-[11px] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2E6F40]"></span>
            Módulo de Diseño & Trazado
          </span>
          <button
            onClick={onOpenMethodology}
            className="text-[11px] font-['Space_Grotesk'] text-[#2E6F40] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
            title="Ver metodología de cálculo"
          >
            <span className="material-symbols-outlined text-[14px]">help</span>
            Metodología
          </button>
        </div>
        <h2 className="font-['Space_Grotesk'] text-[20px] text-[#1A231E] font-semibold tracking-tight">
          Conectividad Vial
        </h2>
        <p className="text-[12px] text-[#4A5D52] mt-0.5">
          Selecciona una herramienta para modelar carreteras, glorietas, infraestructuras y ciudades.
        </p>
      </div>

      {/* Scrollable Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* ESC Key Instruction Card */}
        <div className="p-3.5 rounded-2xl bg-[#2E6F40]/10 border border-[#2E6F40]/30 shadow-xs flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#2E6F40] text-white flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[18px]">keyboard</span>
          </div>
          <div className="text-[12px] text-[#2E4F36]">
            <strong className="font-['Space_Grotesk'] text-[13px] block text-[#2E6F40] font-bold">
              Finalizar trazado con la tecla ESC
            </strong>
            Al trazar de punto a punto, presiona la tecla <strong className="font-mono bg-white/70 px-1 py-0.5 rounded text-[11px] border border-[#2E6F40]/30">ESC</strong> para fijar los puntos trazados y volver automáticamente al cursor normal.
          </div>
        </div>

        {/* ROAD CONNECTION & OPEN ALIGNMENT DETECTION CARD */}
        {hasRoute && (
          <div className={`p-3.5 rounded-2xl border shadow-xs space-y-2 transition-all ${
            metrics.roadConnection?.isConnected
              ? 'bg-[#EBF7EE] border-[#2E6F40]/40'
              : 'bg-white border-[#D8D2C7]/70'
          }`}>
            <div className="flex items-center justify-between">
              <span className={`text-[11px] font-['Space_Grotesk'] font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                metrics.roadConnection?.isConnected ? 'text-[#2E6F40]' : 'text-[#4A5D52]'
              }`}>
                <span className="material-symbols-outlined text-[17px]">
                  {metrics.roadConnection?.isConnected ? 'add_road' : 'alt_route'}
                </span>
                Conexión a Red Vial Existente
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                metrics.roadConnection?.isConnected
                  ? 'bg-[#2E6F40] text-white'
                  : 'bg-[#EAE6DE] text-[#4A5D52]'
              }`}>
                {metrics.roadConnection?.isConnected ? 'Empalme Activo' : 'Traza Abierta'}
              </span>
            </div>

            {metrics.roadConnection?.isConnected ? (
              <div className="space-y-1">
                <div className="font-['Space_Grotesk'] text-[13px] font-bold text-[#1A231E]">
                  {metrics.roadConnection.roadName}
                </div>
                <p className="text-[11px] text-[#2E4F36] leading-relaxed">
                  {metrics.roadConnection.details || 'Empalme detectado con éxito a la infraestructura vial existente.'}
                </p>
                <div className="text-[10px] text-[#2E6F40] font-medium pt-1 border-t border-[#2E6F40]/20 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">check_circle</span>
                  <span>Alineamiento abierto: no requiere cerrarse en bucle con otro trazo.</span>
                </div>
              </div>
            ) : (
              <p className="text-[11px] text-[#4A5D52] leading-snug">
                El trazado es un alineamiento abierto (no requiere cerrarse a otro trazo). Puedes conectarlo a calles o carreteras existentes acercando cualquiera de sus extremos a una vía en el mapa.
              </p>
            )}
          </div>
        )}

        {/* WATER TERMINAL VALIDATION CARD (Constraint enforcement) */}
        {hasRoute && (
          <div className={`p-3.5 rounded-2xl border shadow-xs space-y-1.5 transition-all ${
            metrics.waterTerminalValidation?.hasWaterTerminal
              ? 'bg-[#FEF2F2] border-[#D33F36] text-[#991B1B]'
              : 'bg-white border-[#D8D2C7]/70 text-[#1A231E]'
          }`}>
            <div className="flex items-center justify-between">
              <span className={`text-[11px] font-['Space_Grotesk'] font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                metrics.waterTerminalValidation?.hasWaterTerminal ? 'text-[#D33F36]' : 'text-[#2E6F40]'
              }`}>
                <span className="material-symbols-outlined text-[17px]">
                  {metrics.waterTerminalValidation?.hasWaterTerminal ? 'water_drop' : 'verified_user'}
                </span>
                Restricción en Cuerpos de Agua
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                metrics.waterTerminalValidation?.hasWaterTerminal
                  ? 'bg-[#D33F36] text-white animate-pulse'
                  : 'bg-[#2E6F40]/10 text-[#2E6F40]'
              }`}>
                {metrics.waterTerminalValidation?.hasWaterTerminal ? 'Extremo en Agua' : 'Tierra Firme OK'}
              </span>
            </div>

            {metrics.waterTerminalValidation?.hasWaterTerminal ? (
              <div className="space-y-1">
                <div className="font-['Space_Grotesk'] text-[12px] font-bold text-[#B91C1C]">
                  {metrics.waterTerminalValidation.waterBodyName || 'Cuerpo Hídrico / Océano'}
                </div>
                <p className="text-[11px] text-[#7F1D1D] leading-tight">
                  {metrics.waterTerminalValidation.message || 'Los trazos pueden cruzar masas de agua mediante puentes, pero sus extremos no pueden terminar en ellas.'}
                </p>
                <div className="text-[10px] bg-red-100/80 p-1.5 rounded-lg border border-red-200 text-[#991B1B] font-medium mt-1">
                  💡 Arrastra el marcador terminal hacia tierra firme para cumplir la normativa.
                </div>
              </div>
            ) : (
              <p className="text-[11px] text-[#4A5D52] leading-snug">
                Los extremos del trazado se apoyan sobre tierra firme. Se autoriza el cruce sobre cuencas hídricas mediante viaductos ecológicos.
              </p>
            )}
          </div>
        )}

        {/* Global Action Bar (Borrar, Deshacer, Limpiar) */}
        <div className="p-3 rounded-2xl bg-white border border-[#D8D2C7]/70 shadow-xs space-y-2.5">
          <div className="text-[11px] font-['Space_Grotesk'] font-bold uppercase tracking-wider text-[#4A5D52]">
            Acciones de Edición
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={onToggleRemovalMode}
              className={`flex flex-col items-center justify-center p-2 rounded-xl border text-[11px] font-['Space_Grotesk'] font-semibold transition-all cursor-pointer ${
                isRemovalMode
                  ? 'bg-[#D33F36] text-white border-[#D33F36] shadow-sm animate-pulse'
                  : 'bg-[#FAF8F5] text-[#D33F36] border-[#D8D2C7]/70 hover:bg-[#FDEAE8]'
              }`}
              title="Haz clic para borrar elementos en el mapa"
            >
              <span className="material-symbols-outlined text-[20px] mb-0.5">delete</span>
              <span>{isRemovalMode ? 'Borrando...' : 'Borrar'}</span>
            </button>

            <button
              onClick={onUndo}
              disabled={!hasRoute}
              className={`flex flex-col items-center justify-center p-2 rounded-xl border text-[11px] font-['Space_Grotesk'] font-semibold transition-all ${
                hasRoute
                  ? 'bg-[#FAF8F5] text-[#1A231E] border-[#D8D2C7]/70 hover:bg-[#EAE6DE] cursor-pointer'
                  : 'bg-[#FAF8F5]/50 text-[#8C968E] border-transparent cursor-not-allowed opacity-60'
              }`}
              title="Deshacer último punto"
            >
              <span className="material-symbols-outlined text-[20px] mb-0.5">undo</span>
              <span>Deshacer</span>
            </button>

            <button
              onClick={onClearAll}
              disabled={!hasRoute}
              className={`flex flex-col items-center justify-center p-2 rounded-xl border text-[11px] font-['Space_Grotesk'] font-semibold transition-all ${
                hasRoute
                  ? 'bg-[#FAF8F5] text-[#D33F36] border-[#D8D2C7]/70 hover:bg-[#FDEAE8] cursor-pointer'
                  : 'bg-[#FAF8F5]/50 text-[#8C968E] border-transparent cursor-not-allowed opacity-60'
              }`}
              title="Limpiar todos los trazos"
            >
              <span className="material-symbols-outlined text-[20px] mb-0.5">delete_sweep</span>
              <span>Limpiar</span>
            </button>
          </div>

          {/* Buffer Radius Slider */}
          <div className="pt-2 border-t border-[#D8D2C7]/50 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-['Space_Grotesk']">
              <span className="text-[#4A5D52] font-semibold flex items-center gap-1">
                <span className="material-symbols-outlined text-[15px] text-[#2E6F40]">radar</span>
                Franja de Influencia (Buffer)
              </span>
              <span className="font-bold text-[#2E6F40] bg-[#2E6F40]/10 px-2.5 py-0.5 rounded-full text-[12px]">
                {bufferRadiusMeters >= 1000 ? `${(bufferRadiusMeters / 1000).toFixed(1)} km (${bufferRadiusMeters} m)` : `${bufferRadiusMeters} m`}
              </span>
            </div>
            <input
              type="range"
              min={100}
              max={5000}
              step={100}
              value={bufferRadiusMeters}
              onChange={(e) => onBufferRadiusChange(Number(e.target.value))}
              className="w-full accent-[#2E6F40] cursor-pointer h-1.5 bg-[#EAE6DE] rounded-lg"
              aria-label="Franja de Influencia (Buffer) en metros"
            />
            <div className="flex justify-between text-[10px] text-[#8C968E]">
              <span>100 m</span>
              <span>1,000 m</span>
              <span>2,500 m</span>
              <span className="font-semibold text-[#2E6F40]">5,000 m (Máx)</span>
            </div>
          </div>
        </div>

        {/* Drawing Tools Categories */}
        {toolCategories.map((cat, catIdx) => (
          <div key={catIdx} className="space-y-2">
            <h3 className="font-['Space_Grotesk'] text-[12px] font-bold text-[#4A5D52] uppercase tracking-wider px-1">
              {cat.title}
            </h3>
            <div className="space-y-2">
              {cat.items.map((tool) => {
                const isSelected = activeDrawingTool === tool.id && !isRemovalMode;
                return (
                  <button
                    key={tool.id}
                    onClick={() => onSelectDrawingTool(tool.id)}
                    className={`w-full text-left p-3 rounded-2xl border transition-all flex items-start gap-3 cursor-pointer ${
                      isSelected
                        ? 'bg-white border-[#2E6F40] shadow-md ring-2 ring-[#2E6F40]/20'
                        : 'bg-white/80 border-[#D8D2C7]/70 hover:bg-white hover:border-[#2E6F40]/50 shadow-xs'
                    }`}
                  >
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm"
                      style={{ backgroundColor: tool.color }}
                    >
                      <span className="material-symbols-outlined text-[20px]">{tool.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-['Space_Grotesk'] text-[13px] font-bold text-[#1A231E]">
                          {tool.label}
                        </span>
                        {isSelected && (
                          <span className="text-[10px] bg-[#2E6F40] text-white px-2 py-0.5 rounded-full font-['Space_Grotesk'] font-semibold">
                            Trazando
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#4A5D52] mt-0.5 leading-snug">
                        {tool.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {/* Stats card of current drawing */}
        <div className="p-3.5 rounded-2xl bg-white border border-[#D8D2C7]/70 shadow-xs space-y-2">
          <span className="font-['Space_Grotesk'] text-[11px] font-bold uppercase tracking-wider text-[#4A5D52]">
            Resumen del Trazado Actual
          </span>
          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="p-2 bg-[#F7F5F0] rounded-xl border border-[#E0DBCF]">
              <div className="text-[10px] text-[#8C968E] font-medium">Longitud Vía</div>
              <div className="font-['Space_Grotesk'] text-[16px] font-bold text-[#2E6F40]">
                {hasRoute ? `${metrics.lengthKm} km` : '0.0 km'}
              </div>
            </div>
            <div className="p-2 bg-[#F7F5F0] rounded-xl border border-[#E0DBCF]">
              <div className="text-[10px] text-[#8C968E] font-medium">Nodos / Puntos</div>
              <div className="font-['Space_Grotesk'] text-[16px] font-bold text-[#1A231E]">
                {routeCoords ? routeCoords.length : 0}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer: Jump to Simulation */}
      <div className="p-4 bg-white/95 border-t border-[#D8D2C7]/70 shadow-lg">
        <button
          onClick={onGoToSimulation}
          className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#2E6F40] to-[#3E8552] hover:from-[#255A34] hover:to-[#326D43] text-white font-['Space_Grotesk'] text-[13px] font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[20px]">vital_signs</span>
          <span>Simular Impacto Ambiental de estos Trazos →</span>
        </button>
      </div>
    </aside>
  );
};
