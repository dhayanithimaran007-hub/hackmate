import React from 'react';

export type EarthVariant = 
  | 'hero-right'
  | 'top-right'
  | 'subtle-top'
  | 'dashboard'
  | 'center-auth'
  | 'minimal';

interface EarthBackgroundProps {
  variant?: EarthVariant;
  className?: string;
  opacity?: number;
}

export const EarthBackground: React.FC<EarthBackgroundProps> = ({
  variant = 'top-right',
  className = '',
  opacity,
}) => {
  // Preset container styles according to the design specification
  const variantStyles: Record<EarthVariant, { container: string; svgScale: string; defaultOpacity: number }> = {
    'hero-right': {
      container: 'absolute top-[-10%] right-[-15%] sm:right-[-10%] lg:right-[-2%] w-[420px] h-[420px] sm:w-[580px] sm:h-[580px] lg:w-[780px] lg:h-[780px]',
      svgScale: 'w-full h-full',
      defaultOpacity: 0.85,
    },
    'top-right': {
      container: 'absolute -top-12 -right-16 sm:right-[-5%] lg:right-[2%] w-[380px] h-[380px] sm:w-[520px] sm:h-[520px] lg:w-[620px] lg:h-[620px]',
      svgScale: 'w-full h-full',
      defaultOpacity: 0.75,
    },
    'subtle-top': {
      container: 'absolute -top-20 right-[5%] sm:right-[15%] w-[360px] h-[360px] sm:w-[480px] sm:h-[480px] lg:w-[560px] lg:h-[560px]',
      svgScale: 'w-full h-full',
      defaultOpacity: 0.5,
    },
    'dashboard': {
      container: 'absolute -top-24 -right-20 sm:right-[-8%] w-[340px] h-[340px] sm:w-[460px] sm:h-[460px] lg:w-[540px] lg:h-[540px]',
      svgScale: 'w-full h-full',
      defaultOpacity: 0.55,
    },
    'center-auth': {
      container: 'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[460px] h-[460px] sm:w-[620px] sm:h-[620px] pointer-events-none',
      svgScale: 'w-full h-full',
      defaultOpacity: 0.65,
    },
    'minimal': {
      container: 'absolute -top-16 -right-16 w-[300px] h-[300px] sm:w-[400px] sm:h-[400px]',
      svgScale: 'w-full h-full',
      defaultOpacity: 0.4,
    },
  };

  const selected = variantStyles[variant] || variantStyles['top-right'];
  const effectiveOpacity = opacity !== undefined ? opacity : selected.defaultOpacity;

  return (
    <div 
      className={`pointer-events-none select-none z-0 overflow-hidden ${selected.container} ${className}`}
      style={{ opacity: effectiveOpacity }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 800 800"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`${selected.svgScale} transition-opacity duration-700`}
      >
        <defs>
          {/* Subtle Red Atmospheric Glow Filter */}
          <filter id="red-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          <filter id="intense-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="16" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          {/* Radial depth gradient for wireframe sphere */}
          <radialGradient id="sphere-core" cx="42%" cy="38%" r="58%">
            <stop offset="0%" stopColor="#FF3548" stopOpacity="0.08" />
            <stop offset="50%" stopColor="#16191E" stopOpacity="0.4" />
            <stop offset="85%" stopColor="#0E1013" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#090A0C" stopOpacity="0.98" />
          </radialGradient>

          {/* Rim light gradient */}
          <linearGradient id="rim-light" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF3548" stopOpacity="0.8" />
            <stop offset="35%" stopColor="#FF3548" stopOpacity="0.3" />
            <stop offset="70%" stopColor="#FF3548" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#FF3548" stopOpacity="0.4" />
          </linearGradient>

          {/* Linear gradient for orbit trail */}
          <linearGradient id="orbit-fade-1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FF3548" stopOpacity="0.1" />
            <stop offset="50%" stopColor="#FF5262" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#FF3548" stopOpacity="0.15" />
          </linearGradient>

          <linearGradient id="orbit-fade-2" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FF3548" stopOpacity="0.6" />
            <stop offset="70%" stopColor="#FF3548" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#FF3548" stopOpacity="0.4" />
          </linearGradient>
        </defs>

        {/* Outer ambient atmospheric halo */}
        <circle 
          cx="400" 
          cy="400" 
          r="260" 
          fill="#FF3548" 
          fillOpacity="0.04" 
          filter="url(#intense-glow)" 
        />

        {/* Telemetry Reticle & Outer Coordinate Ring */}
        <g stroke="#292D35" strokeWidth="0.75" opacity="0.6">
          <circle cx="400" cy="400" r="330" strokeDasharray="3 9" />
          <circle cx="400" cy="400" r="310" strokeDasharray="1 6" strokeOpacity="0.4" />
          {/* Scientific crosshair ticks */}
          <line x1="400" y1="50" x2="400" y2="80" stroke="#FF3548" strokeOpacity="0.5" strokeWidth="1" />
          <line x1="400" y1="720" x2="400" y2="750" stroke="#FF3548" strokeOpacity="0.5" strokeWidth="1" />
          <line x1="50" y1="400" x2="80" y2="400" stroke="#FF3548" strokeOpacity="0.5" strokeWidth="1" />
          <line x1="720" y1="400" x2="750" y2="400" stroke="#FF3548" strokeOpacity="0.5" strokeWidth="1" />
        </g>

        {/* Diagonal Scientific Alignment Lines */}
        <g stroke="#FF3548" strokeWidth="0.5" strokeOpacity="0.2">
          <line x1="120" y1="120" x2="160" y2="120" />
          <line x1="120" y1="120" x2="120" y2="160" />
          <line x1="680" y1="120" x2="640" y2="120" />
          <line x1="680" y1="120" x2="680" y2="160" />
          <line x1="120" y1="680" x2="160" y2="680" />
          <line x1="120" y1="680" x2="120" y2="640" />
          <line x1="680" y1="680" x2="640" y2="680" />
          <line x1="680" y1="680" x2="680" y2="640" />
        </g>

        {/* ================================================================= */}
        {/* SPHERE GROUP WITH SCIENTIFIC AXIAL TILT (-18 DEGREES)            */}
        {/* ================================================================= */}
        <g transform="rotate(-18 400 400)">
          {/* Sphere Solid Base / Radial Occlusion */}
          <circle
            cx="400"
            cy="400"
            r="240"
            fill="url(#sphere-core)"
            stroke="url(#rim-light)"
            strokeWidth="1.2"
          />

          {/* Latitude Lines (Parallels) */}
          {/* Equator */}
          <ellipse
            cx="400"
            cy="400"
            rx="240"
            ry="48"
            stroke="#FF3548"
            strokeWidth="1.2"
            strokeOpacity="0.55"
            fill="none"
          />

          {/* Northern Parallels */}
          <ellipse cx="400" cy="355" rx="235" ry="42" stroke="#FF3548" strokeWidth="0.9" strokeOpacity="0.45" fill="none" />
          <ellipse cx="400" cy="310" rx="222" ry="36" stroke="#FF3548" strokeWidth="0.8" strokeOpacity="0.4" fill="none" />
          <ellipse cx="400" cy="265" rx="199" ry="30" stroke="#FF3548" strokeWidth="0.75" strokeOpacity="0.35" fill="none" />
          <ellipse cx="400" cy="225" rx="166" ry="24" stroke="#FF3548" strokeWidth="0.7" strokeOpacity="0.3" fill="none" />
          <ellipse cx="400" cy="190" rx="121" ry="17" stroke="#FF3548" strokeWidth="0.65" strokeOpacity="0.25" fill="none" />
          <ellipse cx="400" cy="168" rx="68" ry="10" stroke="#FF3548" strokeWidth="0.6" strokeOpacity="0.2" fill="none" />

          {/* Southern Parallels */}
          <ellipse cx="400" cy="445" rx="235" ry="42" stroke="#FF3548" strokeWidth="0.8" strokeOpacity="0.38" fill="none" />
          <ellipse cx="400" cy="490" rx="222" ry="36" stroke="#FF3548" strokeWidth="0.75" strokeOpacity="0.32" fill="none" />
          <ellipse cx="400" cy="535" rx="199" ry="30" stroke="#FF3548" strokeWidth="0.7" strokeOpacity="0.28" fill="none" />
          <ellipse cx="400" cy="575" rx="166" ry="24" stroke="#FF3548" strokeWidth="0.65" strokeOpacity="0.22" fill="none" />
          <ellipse cx="400" cy="610" rx="121" ry="17" stroke="#FF3548" strokeWidth="0.6" strokeOpacity="0.18" fill="none" />
          <ellipse cx="400" cy="632" rx="68" ry="10" stroke="#FF3548" strokeWidth="0.5" strokeOpacity="0.14" fill="none" />

          {/* Longitude Lines (Meridians) */}
          {/* Prime Meridian */}
          <ellipse cx="400" cy="400" rx="38" ry="240" stroke="#FF3548" strokeWidth="1" strokeOpacity="0.5" fill="none" />
          <ellipse cx="400" cy="400" rx="88" ry="240" stroke="#FF3548" strokeWidth="0.9" strokeOpacity="0.45" fill="none" />
          <ellipse cx="400" cy="400" rx="142" ry="240" stroke="#FF3548" strokeWidth="0.8" strokeOpacity="0.4" fill="none" />
          <ellipse cx="400" cy="400" rx="194" ry="240" stroke="#FF3548" strokeWidth="0.75" strokeOpacity="0.35" fill="none" />
          <ellipse cx="400" cy="400" rx="228" ry="240" stroke="#FF3548" strokeWidth="0.7" strokeOpacity="0.3" fill="none" />

          {/* Axial Pole Indicator */}
          <line x1="400" y1="130" x2="400" y2="160" stroke="#FF5262" strokeWidth="1.5" strokeOpacity="0.8" />
          <circle cx="400" cy="160" r="3" fill="#FF3548" />
          <line x1="400" y1="640" x2="400" y2="670" stroke="#FF3548" strokeWidth="1" strokeOpacity="0.4" />
        </g>

        {/* ================================================================= */}
        {/* ORBITAL RINGS & SATELLITE TRACKS                                  */}
        {/* ================================================================= */}
        {/* Orbital Ring 1 - Dramatic Tilted Orbit */}
        <g transform="rotate(32 400 400)">
          <ellipse
            cx="400"
            cy="400"
            rx="330"
            ry="95"
            stroke="url(#orbit-fade-1)"
            strokeWidth="1.2"
            strokeDasharray="8 6 2 6"
            fill="none"
          />
          {/* Orbital Satellite Marker Node */}
          <g transform="translate(680, 400)">
            <circle cx="0" cy="0" r="4.5" fill="#FF3548" filter="url(#red-glow)" />
            <circle cx="0" cy="0" r="2" fill="#FFFFFF" />
            <circle cx="0" cy="0" r="9" stroke="#FF3548" strokeWidth="0.75" strokeOpacity="0.6" strokeDasharray="2 3" fill="none" />
          </g>
          {/* Secondary Counter Node */}
          <g transform="translate(120, 400)">
            <circle cx="0" cy="0" r="2.5" fill="#FF5262" />
          </g>
        </g>

        {/* Orbital Ring 2 - Counter Orbit */}
        <g transform="rotate(-38 400 400)">
          <ellipse
            cx="400"
            cy="400"
            rx="305"
            ry="75"
            stroke="url(#orbit-fade-2)"
            strokeWidth="1"
            strokeDasharray="4 8"
            fill="none"
          />
          <g transform="translate(660, 400)">
            <circle cx="0" cy="0" r="3" fill="#FF5262" />
            <line x1="-5" y1="0" x2="5" y2="0" stroke="#FF3548" strokeWidth="1" />
            <line x1="0" y1="-5" x2="0" y2="5" stroke="#FF3548" strokeWidth="1" />
          </g>
        </g>

        {/* Orbital Ring 3 - Outer High-Altitude Boundary */}
        <g transform="rotate(8 400 400)">
          <ellipse
            cx="400"
            cy="400"
            rx="360"
            ry="115"
            stroke="#292D35"
            strokeWidth="0.8"
            strokeDasharray="2 8"
            fill="none"
          />
        </g>

        {/* ================================================================= */}
        {/* SCIENTIFIC HUD CROSSHAIRS & COORDINATE ANNOTATIONS                 */}
        {/* ================================================================= */}
        {/* Crosshair 1 */}
        <g transform="translate(480, 310)" stroke="#FF3548" strokeWidth="0.8" strokeOpacity="0.7">
          <line x1="-6" y1="0" x2="6" y2="0" />
          <line x1="0" y1="-6" x2="0" y2="6" />
          <circle cx="0" cy="0" r="1.5" fill="#FF3548" />
        </g>

        {/* Crosshair 2 */}
        <g transform="translate(320, 460)" stroke="#FF3548" strokeWidth="0.8" strokeOpacity="0.5">
          <line x1="-5" y1="0" x2="5" y2="0" />
          <line x1="0" y1="-5" x2="0" y2="5" />
          <circle cx="0" cy="0" r="1.2" fill="#FF3548" />
        </g>

        {/* Crosshair 3 */}
        <g transform="translate(440, 520)" stroke="#FF3548" strokeWidth="0.8" strokeOpacity="0.6">
          <line x1="-5" y1="0" x2="5" y2="0" />
          <line x1="0" y1="-5" x2="0" y2="5" />
        </g>

        {/* Subtle Scientific Monospace HUD Markers */}
        <text 
          x="300" 
          y="155" 
          fill="#A2A8B5" 
          fillOpacity="0.45" 
          fontSize="9" 
          fontFamily="monospace" 
          letterSpacing="0.1em"
        >
          SYS.GEO // 23.5° N
        </text>
        <text 
          x="465" 
          y="665" 
          fill="#A2A8B5" 
          fillOpacity="0.4" 
          fontSize="8.5" 
          fontFamily="monospace" 
          letterSpacing="0.12em"
        >
          ORBITAL RAD: 6,371 KM
        </text>
        <text 
          x="120" 
          y="420" 
          fill="#747B89" 
          fillOpacity="0.35" 
          fontSize="8" 
          fontFamily="monospace"
        >
          RA 14H 29M
        </text>
        <text 
          x="660" 
          y="380" 
          fill="#FF3548" 
          fillOpacity="0.6" 
          fontSize="8" 
          fontFamily="monospace" 
          fontWeight="bold"
        >
          NODE_01 ●
        </text>
      </svg>
    </div>
  );
};

export default EarthBackground;
