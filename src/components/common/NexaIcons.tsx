import React from 'react';

export interface NexaIconProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
  size?: number | string;
  strokeWidth?: number;
}

const defaultProps: NexaIconProps = {
  className: 'w-4 h-4',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

// 1. Icono de Sesión / Culto técnico NEXA (Marco de encuadre con retícula central)
export const IconSession: React.FC<NexaIconProps> = ({ className = 'w-4 h-4', ...props }) => (
  <svg viewBox="0 0 24 24" {...defaultProps} className={className} {...props}>
    {/* Esquinas de enfoque técnico */}
    <path d="M4 8V5a1 1 0 0 1 1-1h3" />
    <path d="M16 4h3a1 1 0 0 1 1 1v3" />
    <path d="M20 16v3a1 1 0 0 1-1 1h-3" />
    <path d="M8 20H5a1 1 0 0 1-1-1v-3" />
    {/* Retícula central */}
    <circle cx="12" cy="12" r="2.5" />
    <path d="M12 7.5v1.5M12 15v1.5M7.5 12h1.5M15 12h1.5" />
  </svg>
);

export const IconSessionCongreso = IconSession;
export const IconSessionConferencia = IconSession;
export const IconSessionEspecial = IconSession;
export const IconSessionEvento = IconSession;

// 2. Fecha & Hora
export const IconCalendar: React.FC<NexaIconProps> = ({ className = 'w-4 h-4', ...props }) => (
  <svg viewBox="0 0 24 24" {...defaultProps} className={className} {...props}>
    <rect x="3" y="4" width="18" height="17" rx="1.5" />
    <path d="M16 2v4M8 2v4M3 9.5h18" />
    <path d="M8 13.5h.01M12 13.5h.01M16 13.5h.01M8 17h.01M12 17h.01M16 17h.01" strokeWidth={2.2} />
  </svg>
);

export const IconClock: React.FC<NexaIconProps> = ({ className = 'w-4 h-4', ...props }) => (
  <svg viewBox="0 0 24 24" {...defaultProps} className={className} {...props}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3.5 2" />
  </svg>
);

// 3. Estado & Proyector
export const IconLive: React.FC<NexaIconProps> = ({ className = 'w-4 h-4', ...props }) => (
  <svg viewBox="0 0 24 24" {...defaultProps} className={className} {...props}>
    <circle cx="12" cy="12" r="2" fill="currentColor" />
    <path d="M16.5 7.5a6.5 6.5 0 0 1 0 9M7.5 7.5a6.5 6.5 0 0 0 0 9" />
    <path d="M19.5 4.5a11 11 0 0 1 0 15M4.5 4.5a11 11 0 0 0 0 15" />
  </svg>
);

export const IconProjector: React.FC<NexaIconProps> = ({ className = 'w-4 h-4', ...props }) => (
  <svg viewBox="0 0 24 24" {...defaultProps} className={className} {...props}>
    <rect x="2.5" y="4" width="19" height="13" rx="1" />
    <path d="M8 20.5h8M12 17v3.5" />
  </svg>
);

export const IconDisplays = IconProjector;

// 4. Controles de Producción (Transport Bar)
export const IconTake: React.FC<NexaIconProps> = ({ className = 'w-4 h-4', ...props }) => (
  <svg viewBox="0 0 24 24" {...defaultProps} className={className} {...props}>
    <path d="M4 12h14.5M13.5 6.5l5.5 5.5-5.5 5.5" />
  </svg>
);

export const IconPrev: React.FC<NexaIconProps> = ({ className = 'w-4 h-4', ...props }) => (
  <svg viewBox="0 0 24 24" {...defaultProps} className={className} {...props}>
    <path d="M6 6v12M18 6.5L8.5 12l9.5 5.5V6.5z" />
  </svg>
);

export const IconNext: React.FC<NexaIconProps> = ({ className = 'w-4 h-4', ...props }) => (
  <svg viewBox="0 0 24 24" {...defaultProps} className={className} {...props}>
    <path d="M18 6v12M6 6.5l9.5 5.5-9.5 5.5V6.5z" />
  </svg>
);

export const IconBlackout: React.FC<NexaIconProps> = ({ className = 'w-4 h-4', ...props }) => (
  <svg viewBox="0 0 24 24" {...defaultProps} className={className} {...props}>
    <rect x="4" y="4" width="16" height="16" rx="1" />
    <circle cx="12" cy="12" r="3" fill="currentColor" />
  </svg>
);

export const IconPlay: React.FC<NexaIconProps> = ({ className = 'w-4 h-4', ...props }) => (
  <svg viewBox="0 0 24 24" {...defaultProps} className={className} {...props}>
    <polygon points="7,5 19,12 7,19" fill="currentColor" />
  </svg>
);

export const IconPause: React.FC<NexaIconProps> = ({ className = 'w-4 h-4', ...props }) => (
  <svg viewBox="0 0 24 24" {...defaultProps} className={className} {...props}>
    <rect x="6" y="5" width="4" height="14" fill="currentColor" rx="0.5" />
    <rect x="14" y="5" width="4" height="14" fill="currentColor" rx="0.5" />
  </svg>
);

export const IconCut: React.FC<NexaIconProps> = ({ className = 'w-4 h-4', ...props }) => (
  <svg viewBox="0 0 24 24" {...defaultProps} className={className} {...props}>
    <path d="M4 12h16M12 4v16" />
    <circle cx="6" cy="6" r="2" />
    <circle cx="18" cy="18" r="2" />
  </svg>
);

export const IconFade: React.FC<NexaIconProps> = ({ className = 'w-4 h-4', ...props }) => (
  <svg viewBox="0 0 24 24" {...defaultProps} className={className} {...props}>
    <rect x="4" y="4" width="11" height="11" rx="1" />
    <path d="M9 15h10a1 1 0 0 0 1-1V5" />
  </svg>
);

export const IconVolume: React.FC<NexaIconProps> = ({ className = 'w-4 h-4', ...props }) => (
  <svg viewBox="0 0 24 24" {...defaultProps} className={className} {...props}>
    <polygon points="4,9 8,9 13,5 13,19 8,15 4,15" fill="currentColor" />
    <path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" />
  </svg>
);

export const IconMute: React.FC<NexaIconProps> = ({ className = 'w-4 h-4', ...props }) => (
  <svg viewBox="0 0 24 24" {...defaultProps} className={className} {...props}>
    <polygon points="4,9 8,9 13,5 13,19 8,15 4,15" fill="currentColor" />
    <line x1="17" y1="9" x2="22" y2="15" />
    <line x1="22" y1="9" x2="17" y2="15" />
  </svg>
);

// 5. Sidebar Navigation
export const IconCues: React.FC<NexaIconProps> = ({ className = 'w-4 h-4', ...props }) => (
  <svg viewBox="0 0 24 24" {...defaultProps} className={className} {...props}>
    <line x1="4" y1="6" x2="20" y2="6" />
    <line x1="4" y1="12" x2="20" y2="12" />
    <line x1="4" y1="18" x2="20" y2="18" />
    <circle cx="2" cy="6" r="1" fill="currentColor" />
    <circle cx="2" cy="12" r="1" fill="currentColor" />
    <circle cx="2" cy="18" r="1" fill="currentColor" />
  </svg>
);

export const IconBible: React.FC<NexaIconProps> = ({ className = 'w-4 h-4', ...props }) => (
  <svg viewBox="0 0 24 24" {...defaultProps} className={className} {...props}>
    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v18H6.5a2.5 2.5 0 0 0-2.5 2.5z" />
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M9 7h6M12 4v6" />
  </svg>
);

export const IconMedia: React.FC<NexaIconProps> = ({ className = 'w-4 h-4', ...props }) => (
  <svg viewBox="0 0 24 24" {...defaultProps} className={className} {...props}>
    <rect x="3" y="4" width="18" height="16" rx="1.5" />
    <polygon points="10,9 15,12 10,15" fill="currentColor" />
  </svg>
);

export const IconAnnouncements: React.FC<NexaIconProps> = ({ className = 'w-4 h-4', ...props }) => (
  <svg viewBox="0 0 24 24" {...defaultProps} className={className} {...props}>
    <path d="M3 11v2a1 1 0 0 0 1 1h3l6 4V6L7 10H4a1 1 0 0 0-1 1z" />
    <path d="M16 9a4 4 0 0 1 0 6M19 6.5a8 8 0 0 1 0 11" />
  </svg>
);

export const IconAudio: React.FC<NexaIconProps> = ({ className = 'w-4 h-4', ...props }) => (
  <svg viewBox="0 0 24 24" {...defaultProps} className={className} {...props}>
    <line x1="4" y1="21" x2="4" y2="14" />
    <line x1="4" y1="10" x2="4" y2="3" />
    <line x1="12" y1="21" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12" y2="3" />
    <line x1="20" y1="21" x2="20" y2="16" />
    <line x1="20" y1="12" x2="20" y2="3" />
    <rect x="2" y="10" width="4" height="4" rx="0.5" />
    <rect x="10" y="8" width="4" height="4" rx="0.5" />
    <rect x="18" y="12" width="4" height="4" rx="0.5" />
  </svg>
);

export const IconSettings: React.FC<NexaIconProps> = ({ className = 'w-4 h-4', ...props }) => (
  <svg viewBox="0 0 24 24" {...defaultProps} className={className} {...props}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

// 6. Acciones, Archivos & UI
export const IconSearch: React.FC<NexaIconProps> = ({ className = 'w-4 h-4', ...props }) => (
  <svg viewBox="0 0 24 24" {...defaultProps} className={className} {...props}>
    <circle cx="11" cy="11" r="7" />
    <line x1="16" y1="16" x2="21" y2="21" />
  </svg>
);

export const IconFolder: React.FC<NexaIconProps> = ({ className = 'w-4 h-4', ...props }) => (
  <svg viewBox="0 0 24 24" {...defaultProps} className={className} {...props}>
    <path d="M3 6.5A1.5 1.5 0 0 1 4.5 5H9l2 2h8.5A1.5 1.5 0 0 1 21 8.5v10a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18.5v-12z" />
  </svg>
);

export const IconSave: React.FC<NexaIconProps> = ({ className = 'w-4 h-4', ...props }) => (
  <svg viewBox="0 0 24 24" {...defaultProps} className={className} {...props}>
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
    <polyline points="17 21 17 13 7 13 7 21" />
    <polyline points="7 3 7 8 15 8" />
  </svg>
);

export const IconPdf: React.FC<NexaIconProps> = ({ className = 'w-4 h-4', ...props }) => (
  <svg viewBox="0 0 24 24" {...defaultProps} className={className} {...props}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="9" y1="13" x2="15" y2="13" />
    <line x1="9" y1="17" x2="13" y2="17" />
  </svg>
);

export const IconPlus: React.FC<NexaIconProps> = ({ className = 'w-4 h-4', ...props }) => (
  <svg viewBox="0 0 24 24" {...defaultProps} className={className} {...props}>
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

export const IconTrash: React.FC<NexaIconProps> = ({ className = 'w-4 h-4', ...props }) => (
  <svg viewBox="0 0 24 24" {...defaultProps} className={className} {...props}>
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
);

export const IconDuplicate: React.FC<NexaIconProps> = ({ className = 'w-4 h-4', ...props }) => (
  <svg viewBox="0 0 24 24" {...defaultProps} className={className} {...props}>
    <rect x="8" y="8" width="13" height="13" rx="1" />
    <path d="M4 16V4h12" />
  </svg>
);

export const IconEdit: React.FC<NexaIconProps> = ({ className = 'w-4 h-4', ...props }) => (
  <svg viewBox="0 0 24 24" {...defaultProps} className={className} {...props}>
    <path d="M16.5 3.5l4 4L7 21H3v-4L16.5 3.5z" />
  </svg>
);

export const IconEye: React.FC<NexaIconProps> = ({ className = 'w-4 h-4', ...props }) => (
  <svg viewBox="0 0 24 24" {...defaultProps} className={className} {...props}>
    <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

export const IconChevronUp: React.FC<NexaIconProps> = ({ className = 'w-4 h-4', ...props }) => (
  <svg viewBox="0 0 24 24" {...defaultProps} className={className} {...props}>
    <polyline points="18 15 12 9 6 15" />
  </svg>
);

export const IconChevronDown: React.FC<NexaIconProps> = ({ className = 'w-4 h-4', ...props }) => (
  <svg viewBox="0 0 24 24" {...defaultProps} className={className} {...props}>
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

export const IconSliders: React.FC<NexaIconProps> = ({ className = 'w-4 h-4', ...props }) => (
  <svg viewBox="0 0 24 24" {...defaultProps} className={className} {...props}>
    <line x1="4" y1="21" x2="4" y2="14" />
    <line x1="4" y1="10" x2="4" y2="3" />
    <line x1="12" y1="21" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12" y2="3" />
    <line x1="20" y1="21" x2="20" y2="16" />
    <line x1="20" y1="12" x2="20" y2="3" />
  </svg>
);

// 7. Controles de Ventana (Minimalistas y Geométricos)
export const IconWindowMin: React.FC<NexaIconProps> = ({ className = 'w-3 h-3', ...props }) => (
  <svg viewBox="0 0 24 24" {...defaultProps} className={className} {...props}>
    <line x1="4" y1="12" x2="20" y2="12" strokeWidth={2.5} />
  </svg>
);

export const IconWindowMax: React.FC<NexaIconProps> = ({ className = 'w-3 h-3', ...props }) => (
  <svg viewBox="0 0 24 24" {...defaultProps} className={className} {...props}>
    <rect x="4" y="4" width="16" height="16" rx="0.5" strokeWidth={2} />
  </svg>
);

export const IconWindowRestore: React.FC<NexaIconProps> = ({ className = 'w-3 h-3', ...props }) => (
  <svg viewBox="0 0 24 24" {...defaultProps} className={className} {...props}>
    <rect x="8" y="4" width="12" height="12" rx="0.5" strokeWidth={1.8} />
    <polyline points="4 8 4 20 16 20" strokeWidth={1.8} />
  </svg>
);

export const IconWindowClose: React.FC<NexaIconProps> = ({ className = 'w-3 h-3', ...props }) => (
  <svg viewBox="0 0 24 24" {...defaultProps} className={className} {...props}>
    <line x1="5" y1="5" x2="19" y2="19" strokeWidth={2.2} />
    <line x1="19" y1="5" x2="5" y2="19" strokeWidth={2.2} />
  </svg>
);

export const IconClose = IconWindowClose;

export const IconAlert: React.FC<NexaIconProps> = ({ className = 'w-4 h-4', ...props }) => (
  <svg viewBox="0 0 24 24" {...defaultProps} className={className} {...props}>
    <path d="M12 2L1 21h22L12 2z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <circle cx="12" cy="17" r="1" fill="currentColor" />
  </svg>
);

export const IconCheck: React.FC<NexaIconProps> = ({ className = 'w-4 h-4', ...props }) => (
  <svg viewBox="0 0 24 24" {...defaultProps} className={className} {...props}>
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

export const IconInfo: React.FC<NexaIconProps> = ({ className = 'w-4 h-4', ...props }) => (
  <svg viewBox="0 0 24 24" {...defaultProps} className={className} {...props}>
    <circle cx="12" cy="12" r="9" />
    <line x1="12" y1="8" x2="12" y2="8.01" strokeWidth={2.5} />
    <line x1="12" y1="12" x2="12" y2="16" />
  </svg>
);

export const IconKeyboard: React.FC<NexaIconProps> = ({ className = 'w-4 h-4', ...props }) => (
  <svg viewBox="0 0 24 24" {...defaultProps} className={className} {...props}>
    <rect x="2" y="5" width="20" height="14" rx="2" />
    <line x1="6" y1="9" x2="6.01" y2="9" strokeWidth={2} />
    <line x1="10" y1="9" x2="10.01" y2="9" strokeWidth={2} />
    <line x1="14" y1="9" x2="14.01" y2="9" strokeWidth={2} />
    <line x1="18" y1="9" x2="18.01" y2="9" strokeWidth={2} />
    <line x1="6" y1="13" x2="6.01" y2="13" strokeWidth={2} />
    <line x1="18" y1="13" x2="18.01" y2="13" strokeWidth={2} />
    <line x1="10" y1="13" x2="14" y2="13" strokeWidth={2} />
  </svg>
);

export const IconMusic: React.FC<NexaIconProps> = ({ className = 'w-4 h-4', ...props }) => (
  <svg viewBox="0 0 24 24" {...defaultProps} className={className} {...props}>
    <path d="M9 18V5l12-2v13" />
    <circle cx="6" cy="18" r="3" />
    <circle cx="18" cy="16" r="3" />
  </svg>
);

export const IconSongs = IconMusic;

// 8. Iconos Phosphor oficiales para diálogos y sistema NEXA
export const IconPhosphorExit: React.FC<NexaIconProps> = ({ className = 'w-4 h-4', ...props }) => (
  <svg
    viewBox="0 0 256 256"
    fill="none"
    stroke="currentColor"
    strokeWidth={16}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <path d="M136,40h56a8,8,0,0,1,8,8V208a8,8,0,0,1-8,8H136" />
    <line x1="32" y1="128" x2="152" y2="128" />
    <polyline points="112 88 152 128 112 168" />
  </svg>
);

export const IconPhosphorSave: React.FC<NexaIconProps> = ({ className = 'w-4 h-4', ...props }) => (
  <svg
    viewBox="0 0 256 256"
    fill="none"
    stroke="currentColor"
    strokeWidth={16}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <path d="M40,40H176l40,40V208a8,8,0,0,1-8,8H48a8,8,0,0,1-8-8Z" />
    <rect x="88" y="40" width="80" height="64" rx="4" />
    <line x1="128" y1="40" x2="128" y2="104" />
    <rect x="80" y="144" width="96" height="72" rx="4" />
  </svg>
);

export const IconPhosphorClose: React.FC<NexaIconProps> = ({ className = 'w-4 h-4', ...props }) => (
  <svg
    viewBox="0 0 256 256"
    fill="none"
    stroke="currentColor"
    strokeWidth={18}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <line x1="200" y1="56" x2="56" y2="200" />
    <line x1="200" y1="200" x2="56" y2="56" />
  </svg>
);


