import React from 'react';

interface AltimetricProfileProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onToggle3D: () => void;
  onResetView: () => void;
  is3DActive: boolean;
  coords: { lat: number; lng: number };
}

export const AltimetricProfile: React.FC<AltimetricProfileProps> = ({
  onZoomIn,
  onZoomOut,
  onToggle3D,
  onResetView,
  is3DActive,
  coords,
}) => {
  return (
    <div className="absolute bottom-4 left-4 z-[1000] flex flex-col gap-2.5 pointer-events-none">
      {/* Elevation Card */}
      <div className="pointer-events-auto w-80 p-3 rounded-2xl bg-white/90 backdrop-blur-2xl shadow-[0_12px_32px_rgba(26,35,30,0.08)] border border-white/90">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[#2E6F40] text-[16px]">
              show_chart
            </span>
            <span className="font-['Space_Grotesk'] text-[10px] text-[#4A5D52] font-semibold uppercase tracking-wider">
              Perfil Altimétrico (Z)
            </span>
          </div>
          <span className="font-['Space_Grotesk'] text-[11px] text-[#2E6F40] font-bold">
            320m → 680m s.n.m.
          </span>
        </div>

        {/* Sparkline curve */}
        <div className="w-full h-14 bg-[#FAF8F5] rounded-lg p-1.5 flex items-end border border-[#D8D2C7]/60">
          <svg className="w-full h-full overflow-visible" viewBox="0 0 280 44" fill="none">
            <defs>
              <linearGradient id="elevGradLight" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4D7C5F" stopOpacity="0.45" />
                <stop offset="100%" stopColor="#4D7C5F" stopOpacity="0.05" />
              </linearGradient>
            </defs>
            <path
              d="M0,38 Q40,34 70,26 T140,12 T210,24 T280,4 L280,44 L0,44 Z"
              fill="url(#elevGradLight)"
            />
            <path
              d="M0,38 Q40,34 70,26 T140,12 T210,24 T280,4"
              stroke="#2E6F40"
              strokeWidth="2.4"
              strokeLinecap="round"
            />
            <circle cx="140" cy="12" r="3.5" fill="#2E6F40" />
            <circle cx="280" cy="4" r="3.5" fill="#2E6F40" />
          </svg>
        </div>

        {/* Coordinates readout */}
        <div className="flex items-center justify-between mt-2 pt-1 font-['Space_Grotesk'] text-[10px] text-[#4A5D52]">
          <span>Lat: {coords.lat >= 0 ? `${coords.lat.toFixed(4)}° N` : `${Math.abs(coords.lat).toFixed(4)}° S`}</span>
          <span>Lon: {coords.lng >= 0 ? `${coords.lng.toFixed(4)}° E` : `${Math.abs(coords.lng).toFixed(4)}° W`}</span>
          <span className="text-[#2E6F40] font-mono font-bold bg-[#2E6F40]/10 px-1.5 py-0.5 rounded">
            WGS84
          </span>
        </div>
      </div>

      {/* Camera & Zoom controls */}
      <div className="pointer-events-auto flex items-center gap-1 p-1 bg-white/90 backdrop-blur-xl rounded-full shadow-md border border-white/90 self-start">
        <button
          onClick={onZoomIn}
          className="w-8 h-8 rounded-full flex items-center justify-center text-[#4A5D52] hover:text-[#1A231E] hover:bg-[#EAE6DE] transition-colors cursor-pointer"
          title="Acercar Zoom"
          aria-label="Acercar Zoom"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
        </button>
        <button
          onClick={onZoomOut}
          className="w-8 h-8 rounded-full flex items-center justify-center text-[#4A5D52] hover:text-[#1A231E] hover:bg-[#EAE6DE] transition-colors cursor-pointer"
          title="Alejar Zoom"
          aria-label="Alejar Zoom"
        >
          <span className="material-symbols-outlined text-[18px]">remove</span>
        </button>
        <div className="h-4 w-px bg-[#D8D2C7]"></div>
        <button
          onClick={onToggle3D}
          className={`px-2.5 h-8 rounded-full font-['Space_Grotesk'] text-[11px] flex items-center gap-1 transition-colors cursor-pointer ${
            is3DActive
              ? 'bg-[#2E6F40] text-white font-semibold'
              : 'text-[#4A5D52] hover:text-[#1A231E] hover:bg-[#EAE6DE]'
          }`}
          title="Alternar Vista Perspectiva 3D"
          aria-label="Alternar Vista 3D"
        >
          <span className="material-symbols-outlined text-[16px]">view_in_ar</span>
          <span>3D Tilt</span>
        </button>
        <button
          onClick={onResetView}
          className="w-8 h-8 rounded-full flex items-center justify-center text-[#4A5D52] hover:text-[#1A231E] hover:bg-[#EAE6DE] transition-colors cursor-pointer"
          title="Restablecer Cámara"
          aria-label="Restablecer Cámara"
        >
          <span className="material-symbols-outlined text-[17px]">restart_alt</span>
        </button>
      </div>
    </div>
  );
};
