import React from 'react';

interface HeaderProps {
  projectName: string;
  onProjectNameChange: (name: string) => void;
  onExportGeoJSON: () => void;
  onShare: () => void;
  onOpenSettings: () => void;
  isLeftSidebarOpen: boolean;
  onToggleLeftSidebar: () => void;
  isRightPanelOpen: boolean;
  onToggleRightPanel: () => void;
  onOpenMethodology: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  projectName,
  onProjectNameChange,
  onExportGeoJSON,
  onShare,
  onOpenSettings,
  isLeftSidebarOpen,
  onToggleLeftSidebar,
  isRightPanelOpen,
  onToggleRightPanel,
  onOpenMethodology,
}) => {
  const [isEditingName, setIsEditingName] = React.useState(false);
  const [tempName, setTempName] = React.useState(projectName);

  React.useEffect(() => {
    setTempName(projectName);
  }, [projectName]);

  const handleSaveName = () => {
    setIsEditingName(false);
    if (tempName.trim()) {
      onProjectNameChange(tempName.trim());
    } else {
      setTempName(projectName);
    }
  };

  return (
    <header
      className={`fixed top-0 right-0 h-16 bg-[#FAF8F5]/90 backdrop-blur-2xl z-40 flex items-center justify-between px-4 sm:px-6 shadow-[0_2px_16px_rgba(26,35,30,0.04)] border-b border-white/80 transition-all duration-300 ${
        isLeftSidebarOpen ? 'left-72' : 'left-0'
      }`}
    >
      <div className="flex items-center gap-3">
        {/* Toggle Left Sidebar Button */}
        <button
          onClick={onToggleLeftSidebar}
          className="w-9 h-9 rounded-xl bg-white border border-[#D8D2C7]/80 text-[#2E6F40] hover:bg-[#FAF8F5] flex items-center justify-center cursor-pointer shadow-xs transition-colors"
          title={isLeftSidebarOpen ? 'Ocultar panel lateral izquierdo' : 'Mostrar panel lateral izquierdo'}
          aria-label="Alternar panel izquierdo"
        >
          <span className="material-symbols-outlined text-[20px]">
            {isLeftSidebarOpen ? 'left_panel_close' : 'left_panel_open'}
          </span>
        </button>

        {/* Project Name */}
        <div className="flex items-center gap-2">
          <span className="text-[13px] text-[#4A5D52] hidden sm:inline">Proyecto:</span>
          {isEditingName ? (
            <input
              type="text"
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              onBlur={handleSaveName}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveName();
                if (e.key === 'Escape') {
                  setTempName(projectName);
                  setIsEditingName(false);
                }
              }}
              autoFocus
              className="font-['Space_Grotesk'] text-[16px] text-[#1A231E] font-semibold bg-white px-2 py-0.5 rounded border border-[#2E6F40] focus:outline-none shadow-inner"
              aria-label="Nombre del proyecto"
            />
          ) : (
            <button
              onClick={() => setIsEditingName(true)}
              className="flex items-center gap-1.5 group cursor-pointer hover:bg-white/60 px-2 py-1 rounded-lg transition-colors"
              title="Haz clic para cambiar el nombre del proyecto"
            >
              <span className="font-['Space_Grotesk'] text-[17px] text-[#1A231E] font-semibold tracking-tight">
                {projectName}
              </span>
              <span className="material-symbols-outlined text-[15px] text-[#8C968E] group-hover:text-[#2E6F40] transition-colors">
                edit
              </span>
            </button>
          )}
        </div>

        <div className="h-4 w-px bg-[#D8D2C7] hidden md:block"></div>

        <div className="hidden lg:flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#2E6F40]/10 text-[#2E6F40] border border-[#2E6F40]/20 text-[11px] font-semibold font-['Space_Grotesk']">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2E6F40] animate-pulse"></span>
            Simulación Activa
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#4D7C5F]/15 text-[#4D7C5F] border border-[#4D7C5F]/25 text-[11px] font-semibold font-['Space_Grotesk']">
            <span className="w-1.5 h-1.5 rounded-full bg-[#4D7C5F] animate-ping"></span>
            Cálculo en Tiempo Real
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Methodology Button */}
        <button
          onClick={onOpenMethodology}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-[#D8D2C7]/90 text-[12px] font-['Space_Grotesk'] font-semibold text-[#2E6F40] hover:bg-[#FAF8F5] shadow-xs cursor-pointer transition-all"
          title="Ver cómo la webapp calcula el impacto ambiental"
        >
          <span className="material-symbols-outlined text-[16px] text-[#2E6F40]">functions</span>
          <span className="hidden sm:inline">Metodología de Cálculo</span>
        </button>

        {/* Action icons */}
        <div className="flex items-center gap-1 bg-[#EFECE6]/80 border border-[#D8D2C7]/70 p-1 rounded-full shadow-inner">
          <button
            onClick={onExportGeoJSON}
            className="p-1.5 rounded-full text-[#4A5D52] hover:bg-white hover:text-[#1A231E] hover:shadow-xs transition-all cursor-pointer"
            title="Exportar GeoJSON"
            aria-label="Exportar GeoJSON"
          >
            <span className="material-symbols-outlined text-[18px] block">download</span>
          </button>
          <button
            onClick={onShare}
            className="p-1.5 rounded-full text-[#4A5D52] hover:bg-white hover:text-[#1A231E] hover:shadow-xs transition-all cursor-pointer"
            title="Compartir Escenario"
            aria-label="Compartir Escenario"
          >
            <span className="material-symbols-outlined text-[18px] block">share</span>
          </button>
          <button
            onClick={onOpenSettings}
            className="p-1.5 rounded-full text-[#4A5D52] hover:bg-white hover:text-[#1A231E] hover:shadow-xs transition-all cursor-pointer"
            title="Ajustes de Renderizado"
            aria-label="Ajustes de Renderizado"
          >
            <span className="material-symbols-outlined text-[18px] block">tune</span>
          </button>
        </div>

        {/* Toggle Right Panel Button */}
        <button
          onClick={onToggleRightPanel}
          className="w-9 h-9 rounded-xl bg-white border border-[#D8D2C7]/80 text-[#2E6F40] hover:bg-[#FAF8F5] flex items-center justify-center cursor-pointer shadow-xs transition-colors"
          title={isRightPanelOpen ? 'Ocultar panel derecho' : 'Mostrar panel derecho'}
          aria-label="Alternar panel derecho"
        >
          <span className="material-symbols-outlined text-[20px]">
            {isRightPanelOpen ? 'right_panel_close' : 'right_panel_open'}
          </span>
        </button>

        <div className="h-6 w-px bg-[#D8D2C7] hidden sm:block"></div>

        <div className="hidden md:flex items-center gap-2 pl-1">
          <div className="flex flex-col text-right">
            <span className="font-['Space_Grotesk'] text-[12px] text-[#1A231E] font-medium leading-none">
              Dra. Marcela Silva
            </span>
            <span className="text-[10px] text-[#4A5D52] leading-none mt-1">
              Ecol. Espacial Senior
            </span>
          </div>
          <div className="w-8 h-8 rounded-full bg-[#2E6F40] text-white flex items-center justify-center font-bold text-xs ring-1 ring-[#2E6F40]/40 border border-white shadow-sm">
            MS
          </div>
        </div>
      </div>
    </header>
  );
};
