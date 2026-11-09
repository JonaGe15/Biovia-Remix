import React from 'react';
import { LayerVisibility } from '../types';

interface LeftSidebarProps {
  activeNav: string;
  setActiveNav: (nav: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  layers: LayerVisibility;
  setLayers: React.Dispatch<React.SetStateAction<LayerVisibility>>;
  fragmentationPercent: number;
  isOpen: boolean;
  onToggle: () => void;
  onOpenMethodology: () => void;
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  activeNav,
  setActiveNav,
  searchQuery,
  setSearchQuery,
  layers,
  setLayers,
  fragmentationPercent,
  isOpen,
  onToggle,
  onOpenMethodology,
}) => {
  const navItems = [
    { id: 'conectividad', label: 'Conectividad Vial', icon: 'hub' },
    { id: 'simulacion', label: 'Simulación de Impacto', icon: 'vital_signs' },
    { id: 'biodiversidad', label: 'Biodiversidad & Fauna', icon: 'forest' },
    { id: 'informes', label: 'Informes & Cumplimiento', icon: 'assessment' },
  ];

  const handleToggleLayer = (key: keyof LayerVisibility) => {
    setLayers((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <aside
      className={`fixed left-0 top-0 h-full w-72 bg-[#FAF8F5]/95 backdrop-blur-2xl z-50 flex flex-col justify-between p-4 shadow-[4px_0_30px_rgba(26,35,30,0.06)] border-r border-white/80 transition-transform duration-300 ${
        isOpen ? 'translate-x-0' : '-translate-x-full pointer-events-none'
      }`}
    >
      <div className="flex flex-col gap-4">
        {/* Brand & Collapse Header */}
        <div className="flex items-center justify-between px-1 py-1">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#2E6F40] to-[#4D7C5F] flex items-center justify-center text-white shadow-sm ring-2 ring-[#2E6F40]/20">
              <span className="material-symbols-outlined text-[22px]">eco</span>
            </div>
            <div className="flex flex-col">
              <span className="font-['Space_Grotesk'] text-[20px] text-[#2E6F40] tracking-tight leading-none font-bold">
                BioVía
              </span>
              <span className="font-['Space_Grotesk'] text-[10px] text-[#4A5D52] tracking-wider uppercase mt-1 font-semibold">
                Impacto Ecológico
              </span>
            </div>
          </div>
          <button
            onClick={onToggle}
            className="w-8 h-8 rounded-lg text-[#8C968E] hover:text-[#1A231E] hover:bg-[#EAE6DE] flex items-center justify-center cursor-pointer transition-colors"
            title="Ocultar panel lateral"
            aria-label="Ocultar panel lateral"
          >
            <span className="material-symbols-outlined text-[18px]">chevron_left</span>
          </button>
        </div>

        {/* Search input */}
        <div className="flex items-center gap-2 bg-[#EFECE6]/80 border border-[#D8D2C7]/70 px-3 py-2 rounded-full shadow-inner focus-within:border-[#2E6F40] focus-within:ring-2 focus-within:ring-[#2E6F40]/15 transition-all">
          <span className="material-symbols-outlined text-[#8C968E] text-[18px]">search</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filtrar tramo, especie o cuenca..."
            className="w-full bg-transparent border-0 text-[13px] text-[#1A231E] placeholder-[#8C968E] focus:outline-none"
            aria-label="Filtrar tramo, especie o cuenca"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-[#8C968E] hover:text-[#1A231E] text-xs cursor-pointer"
              title="Borrar búsqueda"
              aria-label="Borrar búsqueda"
            >
              ×
            </button>
          )}
        </div>

        {/* Navigation list */}
        <nav className="flex flex-col gap-1.5" aria-label="Navegación principal">
          {navItems.map((item) => {
            const isActive = activeNav === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveNav(item.id)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-['Space_Grotesk'] font-medium transition-all text-left cursor-pointer ${
                  isActive
                    ? 'bg-[#2E6F40] text-white shadow-sm font-semibold'
                    : 'text-[#4A5D52] hover:bg-[#EAE6DE] hover:text-[#1A231E]'
                }`}
              >
                <span
                  className={`material-symbols-outlined text-[20px] ${
                    isActive ? 'text-white' : 'text-[#4D7C5F]'
                  }`}
                >
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Territorial Layers Switcher */}
        <div className="flex flex-col gap-2 pt-1">
          <span className="font-['Space_Grotesk'] text-[11px] text-[#4A5D52] uppercase tracking-wider px-1 font-semibold">
            Capas Territoriales
          </span>
          <div className="flex flex-col gap-1.5 bg-[#EFECE6]/70 border border-[#D8D2C7]/70 p-2.5 rounded-xl">
            <label className="flex items-center justify-between px-1 py-1 cursor-pointer group hover:bg-white/40 rounded-lg transition-colors">
              <span className="flex items-center gap-2.5 text-[13px] text-[#1A231E]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#2E6F40] ring-2 ring-[#2E6F40]/25"></span>
                Áreas Protegidas
              </span>
              <input
                type="checkbox"
                checked={layers.protectedAreas}
                onChange={() => handleToggleLayer('protectedAreas')}
                className="accent-[#2E6F40] rounded cursor-pointer w-4 h-4"
              />
            </label>

            <label className="flex items-center justify-between px-1 py-1 cursor-pointer group hover:bg-white/40 rounded-lg transition-colors">
              <span className="flex items-center gap-2.5 text-[13px] text-[#1A231E]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#4D7C5F] ring-2 ring-[#4D7C5F]/25"></span>
                Corredores Biológicos
              </span>
              <input
                type="checkbox"
                checked={layers.corridors}
                onChange={() => handleToggleLayer('corridors')}
                className="accent-[#4D7C5F] rounded cursor-pointer w-4 h-4"
              />
            </label>

            <label className="flex items-center justify-between px-1 py-1 cursor-pointer group hover:bg-white/40 rounded-lg transition-colors">
              <span className="flex items-center gap-2.5 text-[13px] text-[#1A231E]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#3B82A6] ring-2 ring-[#3B82A6]/25"></span>
                Cuencas Hidrográficas
              </span>
              <input
                type="checkbox"
                checked={layers.waterways}
                onChange={() => handleToggleLayer('waterways')}
                className="accent-[#3B82A6] rounded cursor-pointer w-4 h-4"
              />
            </label>

            <label className="flex items-center justify-between px-1 py-1 cursor-pointer group hover:bg-white/40 rounded-lg transition-colors">
              <span className="flex items-center gap-2.5 text-[13px] text-[#1A231E]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#8C968E] ring-2 ring-[#8C968E]/25"></span>
                Zonas Urbanas
              </span>
              <input
                type="checkbox"
                checked={layers.urbanZones}
                onChange={() => handleToggleLayer('urbanZones')}
                className="accent-[#8C968E] rounded cursor-pointer w-4 h-4"
              />
            </label>

            <label className="flex items-center justify-between px-1 py-1 cursor-pointer group hover:bg-white/40 rounded-lg transition-colors">
              <span className="flex items-center gap-2.5 text-[13px] text-[#1A231E]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#D97706] ring-2 ring-[#D97706]/25"></span>
                Rutas Migratorias
              </span>
              <input
                type="checkbox"
                checked={layers.migratoryRoutes}
                onChange={() => handleToggleLayer('migratoryRoutes')}
                className="accent-[#D97706] rounded cursor-pointer w-4 h-4"
              />
            </label>

            <label className="flex items-center justify-between px-1 py-1 cursor-pointer group hover:bg-white/40 rounded-lg transition-colors">
              <span className="flex items-center gap-2.5 text-[13px] text-[#1A231E]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#E11D48] ring-2 ring-[#E11D48]/25 animate-pulse"></span>
                Puntos de Estrangulamiento
              </span>
              <input
                type="checkbox"
                checked={layers.chokepoints}
                onChange={() => handleToggleLayer('chokepoints')}
                className="accent-[#E11D48] rounded cursor-pointer w-4 h-4"
              />
            </label>
          </div>
        </div>
      </div>

      {/* Bottom Cards: Methodology + Fragmentation */}
      <div className="flex flex-col gap-2 pt-2">
        {/* Methodology Link Button */}
        <button
          onClick={onOpenMethodology}
          className="w-full py-2 px-3 rounded-xl bg-white/80 hover:bg-white border border-[#D8D2C7]/70 text-[#2E6F40] font-['Space_Grotesk'] text-[12px] font-semibold flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-all"
        >
          <span className="material-symbols-outlined text-[16px]">menu_book</span>
          <span>Fórmulas y Metodología</span>
        </button>

        {/* Bottom Fragmentation Index Card */}
        <div className="flex flex-col gap-2 bg-[#EFECE6]/80 border border-[#D8D2C7]/70 p-3 rounded-xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-['Space_Grotesk'] text-[#4A5D52] font-semibold">
              Índice Fragmentación
            </span>
            <span className="text-[13px] font-['Space_Grotesk'] text-[#2E6F40] font-bold">
              {fragmentationPercent > 0 ? `+${fragmentationPercent}%` : `${fragmentationPercent}%`}
            </span>
          </div>
          <div className="w-full bg-[#DDD8CE] h-2 rounded-full overflow-hidden shadow-inner">
            <div
              className="bg-[#2E6F40] h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(10, 100 - fragmentationPercent))}%` }}
            ></div>
          </div>
          <span className="text-[10px] text-[#8C968E] text-center">
            Umbral sostenible: &lt; 25% de fragmentación
          </span>
        </div>
      </div>
    </aside>
  );
};
