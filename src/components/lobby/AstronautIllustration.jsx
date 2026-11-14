import { SPECIALIST_ROLES_MAP } from './educationalRoles.js'

/**
 * AstronautIllustration
 * Clean, standing vector SVG astronaut with role-specific gear, colors,
 * and idle breathing/sway animation.
 */
export default function AstronautIllustration({
  roleKey = null,
  size = 'large', // 'large' | 'medium' | 'small'
  isSilhouette = false,
  isAnimated = true,
  className = '',
}) {
  const role = SPECIALIST_ROLES_MAP[roleKey]
  const accent = role ? role.accentColor : '#64748b'
  const trim = role ? role.suitTrim : '#94a3b8'

  // Size configurations
  const dimensions = {
    large: { width: 280, height: 420 },
    medium: { width: 140, height: 210 },
    small: { width: 70, height: 105 },
  }[size] || { width: 280, height: 420 }

  if (isSilhouette) {
    return (
      <div
        className={`astronaut-illustration silhouette size-${size} ${className}`}
        style={{ width: dimensions.width, height: dimensions.height }}
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 200 300"
          width="100%"
          height="100%"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Ground Platform Pedestal */}
          <ellipse cx="100" cy="285" rx="70" ry="12" fill="rgba(255, 255, 255, 0.04)" />
          <ellipse cx="100" cy="285" rx="55" ry="8" stroke="rgba(255, 255, 255, 0.15)" strokeDasharray="4 4" />

          {/* Silhouette Body (Dashed outline, translucent fill) */}
          <g opacity="0.35" stroke="#94a3b8" strokeWidth="2" strokeDasharray="6 4" fill="rgba(148, 163, 184, 0.05)">
            {/* Legs */}
            <path d="M72 175 L68 250 L84 265 L92 250 L88 175 Z" />
            <path d="M128 175 L132 250 L116 265 L108 250 L112 175 Z" />
            {/* Torso */}
            <rect x="66" y="85" width="68" height="95" rx="18" />
            {/* Arms */}
            <path d="M66 95 L40 160 L54 166 L74 115 Z" />
            <path d="M134 95 L160 160 L146 166 L126 115 Z" />
            {/* Helmet */}
            <circle cx="100" cy="52" r="34" />
          </g>

          {/* Center Beacon Symbol */}
          <circle cx="100" cy="130" r="14" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.5" />
          <path d="M100 120 V140 M90 130 H110" stroke="#94a3b8" strokeWidth="1.5" opacity="0.5" />
        </svg>
      </div>
    )
  }

  return (
    <div
      className={`astronaut-illustration standing-astronaut size-${size} ${isAnimated ? 'animated-idle' : ''} ${className}`}
      style={{ width: dimensions.width, height: dimensions.height }}
      role="img"
      aria-label={role ? `${role.title} in EVA suit` : 'Astronaut'}
    >
      <svg
        viewBox="0 0 200 300"
        width="100%"
        height="100%"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Platform Glow */}
          <radialGradient id={`platformGlow-${roleKey || 'generic'}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={accent} stopOpacity="0.45" />
            <stop offset="100%" stopColor={accent} stopOpacity="0" />
          </radialGradient>

          {/* Visor Gradient */}
          <linearGradient id={`visorGrad-${roleKey || 'generic'}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1e293b" />
            <stop offset="30%" stopColor="#0f172a" />
            <stop offset="70%" stopColor={accent} stopOpacity="0.85" />
            <stop offset="100%" stopColor="#ffedd5" stopOpacity="0.9" />
          </linearGradient>

          {/* Suit Metallic Shading */}
          <linearGradient id={`suitShade-${roleKey || 'generic'}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#cbd5e1" />
            <stop offset="25%" stopColor="#f1f5f9" />
            <stop offset="75%" stopColor="#e2e8f0" />
            <stop offset="100%" stopColor="#94a3b8" />
          </linearGradient>

          {/* Shadow filter */}
          <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* --- PEDESTAL / BASE --- */}
        <ellipse cx="100" cy="285" rx="75" ry="13" fill={`url(#platformGlow-${roleKey || 'generic'})`} />
        <ellipse cx="100" cy="285" rx="65" ry="10" fill="#0f1422" stroke={accent} strokeWidth="2" />
        <ellipse cx="100" cy="285" rx="45" ry="6" stroke={trim} strokeWidth="1" strokeDasharray="6 3" opacity="0.7" />

        {/* --- ASTRONAUT RIG --- */}
        <g className="astronaut-rig">
          {/* Life Support Backpack */}
          <rect x="54" y="80" width="92" height="100" rx="16" fill="#1e293b" stroke="#334155" strokeWidth="2" />
          {/* Backpack Thruster / Vents */}
          <rect x="62" y="72" width="16" height="12" rx="3" fill="#334155" />
          <rect x="122" y="72" width="16" height="12" rx="3" fill="#334155" />

          {/* Role-Specific Backpack Hardware */}
          {roleKey === 'Medic' && (
            // Dual Oxygen Tanks
            <g>
              <rect x="44" y="90" width="14" height="65" rx="7" fill="#0284c7" stroke="#38bdf8" strokeWidth="1.5" />
              <rect x="142" y="90" width="14" height="65" rx="7" fill="#0284c7" stroke="#38bdf8" strokeWidth="1.5" />
              <circle cx="51" cy="95" r="3" fill="#ffffff" />
              <circle cx="149" cy="95" r="3" fill="#ffffff" />
            </g>
          )}

          {roleKey === 'Engineer' && (
            // Battery Storage Cell
            <g>
              <rect x="44" y="95" width="14" height="55" rx="4" fill="#854d0e" stroke="#facc15" strokeWidth="1.5" />
              <rect x="142" y="95" width="14" height="55" rx="4" fill="#854d0e" stroke="#facc15" strokeWidth="1.5" />
              <line x1="47" y1="110" x2="55" y2="110" stroke="#fef08a" strokeWidth="2" />
              <line x1="47" y1="125" x2="55" y2="125" stroke="#fef08a" strokeWidth="2" />
              <line x1="145" y1="110" x2="153" y2="110" stroke="#fef08a" strokeWidth="2" />
              <line x1="145" y1="125" x2="153" y2="125" stroke="#fef08a" strokeWidth="2" />
            </g>
          )}

          {/* --- LEGS --- */}
          {/* Left Leg */}
          <path
            d="M74 175 L70 245 L58 266 L86 266 L91 245 L88 175 Z"
            fill={`url(#suitShade-${roleKey || 'generic'})`}
            stroke="#475569"
            strokeWidth="1.5"
          />
          {/* Left Knee Pad */}
          <rect x="67" y="210" width="22" height="16" rx="4" fill="#334155" stroke={accent} strokeWidth="1.5" />
          {/* Left Boot */}
          <path d="M56 258 L88 258 L88 274 L52 274 Z" fill="#1e293b" stroke="#475569" strokeWidth="2" />
          <path d="M52 270 H88" stroke={accent} strokeWidth="2" />

          {/* Right Leg */}
          <path
            d="M126 175 L130 245 L142 266 L114 266 L109 245 L112 175 Z"
            fill={`url(#suitShade-${roleKey || 'generic'})`}
            stroke="#475569"
            strokeWidth="1.5"
          />
          {/* Right Knee Pad */}
          <rect x="111" y="210" width="22" height="16" rx="4" fill="#334155" stroke={accent} strokeWidth="1.5" />
          {/* Right Boot */}
          <path d="M144 258 L112 258 L112 274 L148 274 Z" fill="#1e293b" stroke="#475569" strokeWidth="2" />
          <path d="M112 270 H148" stroke={accent} strokeWidth="2" />

          {/* --- TORSO & CHEST --- */}
          <rect
            x="64"
            y="85"
            width="72"
            height="95"
            rx="18"
            fill={`url(#suitShade-${roleKey || 'generic'})`}
            stroke="#475569"
            strokeWidth="2"
          />

          {/* Chest Control Console */}
          <rect x="76" y="105" width="48" height="42" rx="8" fill="#1e293b" stroke={accent} strokeWidth="2" />
          {/* Chest Lights / Diodes */}
          <circle cx="86" cy="118" r="3.5" fill={accent} filter="url(#softGlow)" />
          <circle cx="98" cy="118" r="3.5" fill="#10b981" />
          <circle cx="110" cy="118" r="3.5" fill="#38bdf8" />
          <rect x="83" y="128" width="34" height="10" rx="3" fill="#0f172a" stroke="#334155" />
          <line x1="86" y1="133" x2="108" y2="133" stroke={trim} strokeWidth="1.5" />

          {/* Suit Shoulder Accent Stripes */}
          <path d="M66 94 Q100 102 134 94" stroke={accent} strokeWidth="4" strokeLinecap="round" />

          {/* --- ARMS --- */}
          {/* Left Arm */}
          <path
            d="M66 95 L42 165 L58 170 L76 115 Z"
            fill={`url(#suitShade-${roleKey || 'generic'})`}
            stroke="#475569"
            strokeWidth="1.5"
          />
          {/* Left Shoulder Patch */}
          <rect x="52" y="102" width="16" height="12" rx="3" fill="#1e293b" stroke={accent} strokeWidth="1" />
          {/* Left Glove */}
          <ellipse cx="49" cy="172" rx="9" ry="8" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />

          {/* Right Arm */}
          <path
            d="M134 95 L158 165 L142 170 L124 115 Z"
            fill={`url(#suitShade-${roleKey || 'generic'})`}
            stroke="#475569"
            strokeWidth="1.5"
          />
          {/* Right Shoulder Patch */}
          <rect x="132" y="102" width="16" height="12" rx="3" fill="#1e293b" stroke={accent} strokeWidth="1" />
          {/* Right Glove */}
          <ellipse cx="151" cy="172" rx="9" ry="8" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />

          {/* Role-Specific Handheld Gadget */}
          {roleKey === 'Botanist' && (
            // Bio-Canister with glowing plant
            <g transform="translate(138, 160)">
              <rect x="0" y="0" width="18" height="26" rx="6" fill="#064e3b" stroke="#34d399" strokeWidth="1.5" />
              <circle cx="9" cy="13" r="5" fill="#10b981" filter="url(#softGlow)" />
              <path d="M9 16 Q7 12 9 9 Q11 12 9 16" fill="#ecfdf5" />
            </g>
          )}

          {roleKey === 'Scientist' && (
            // Radiation Dosimeter / Scanner
            <g transform="translate(138, 160)">
              <rect x="0" y="0" width="18" height="24" rx="4" fill="#2e1065" stroke="#a78bfa" strokeWidth="1.5" />
              <circle cx="9" cy="10" r="4" fill="#c084fc" filter="url(#softGlow)" />
              <line x1="9" y1="0" x2="9" y2="-6" stroke="#c084fc" strokeWidth="2" strokeLinecap="round" />
            </g>
          )}

          {roleKey === 'Commander' && (
            // Command Tablet
            <g transform="translate(138, 160)">
              <rect x="0" y="0" width="20" height="24" rx="4" fill="#1e293b" stroke="#f59e0b" strokeWidth="1.5" />
              <rect x="3" y="4" width="14" height="12" rx="2" fill="#0f172a" />
              <line x1="5" y1="8" x2="15" y2="8" stroke="#fbbf24" strokeWidth="1" />
              <line x1="5" y1="12" x2="12" y2="12" stroke="#fbbf24" strokeWidth="1" />
            </g>
          )}

          {/* --- HELMET & VISOR --- */}
          {/* Helmet Base Collar */}
          <ellipse cx="100" cy="80" rx="36" ry="12" fill="#334155" stroke="#475569" strokeWidth="2" />

          {/* Helmet Shell */}
          <ellipse cx="100" cy="52" rx="35" ry="34" fill={`url(#suitShade-${roleKey || 'generic'})`} stroke="#475569" strokeWidth="2" />

          {/* Role Headpiece Accent (e.g. Commander Antenna) */}
          {roleKey === 'Commander' && (
            <g>
              <line x1="126" y1="36" x2="136" y2="18" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" />
              <circle cx="136" cy="18" r="3.5" fill="#f59e0b" filter="url(#softGlow)" />
            </g>
          )}

          {/* Golden / Tinted Visor */}
          <ellipse
            cx="100"
            cy="52"
            rx="27"
            ry="23"
            fill={`url(#visorGrad-${roleKey || 'generic'})`}
            stroke={accent}
            strokeWidth="2"
          />

          {/* Visor Glare & Reflection */}
          <path
            d="M82 42 Q96 35 116 39 Q106 46 88 47 Z"
            fill="#ffffff"
            opacity="0.65"
          />
          <ellipse cx="114" cy="58" rx="4" ry="2" fill="#ffffff" opacity="0.4" />
        </g>
      </svg>
    </div>
  )
}
