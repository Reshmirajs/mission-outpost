import { getResourceCondition } from './dashboardUtils.js'
import './OutpostSystemsPanel.css'

const SYSTEM_RESOURCES = [
  { key: 'oxygen', name: 'Oxygen Reserves', icon: '🫧', isRadiation: false },
  { key: 'power', name: 'Core Power Grid', icon: '⚡', isRadiation: false },
  { key: 'food', name: 'Food Rations', icon: '🌱', isRadiation: false },
  { key: 'water', name: 'Water Reserves', icon: '💧', isRadiation: false },
  { key: 'radiation', name: 'Radiation Exposure', icon: '☢️', isRadiation: true },
]

/**
 * OutpostSystemsPanel Component
 *
 * Implements Center Column (B) Outpost Systems.
 * Displays 5 resource indicators with values, compact progress bars, and status pills.
 */
export default function OutpostSystemsPanel({ resources = {} }) {
  // If water is not explicitly in resources, calculate dynamic hydration level from life-support reserves
  const waterLevel = typeof resources?.water === 'number'
    ? resources.water
    : Math.min(100, Math.round(((resources?.oxygen ?? 78) * 0.4 + (resources?.food ?? 85) * 0.6)))

  const activeResources = {
    oxygen: resources?.oxygen ?? 78,
    power: resources?.power ?? 64,
    food: resources?.food ?? 85,
    water: waterLevel,
    radiation: resources?.radiation ?? 28,
  }

  return (
    <div className="outpost-systems-panel">
      <div className="systems-panel-header">
        <div className="systems-title-group">
          <span className="systems-icon" aria-hidden="true">⚙️</span>
          <h3 className="systems-title">OUTPOST SYSTEMS</h3>
        </div>
        <span className="systems-badge">LIFE SUPPORT TELEMETRY</span>
      </div>

      <div className="systems-indicators-grid">
        {SYSTEM_RESOURCES.map((sys) => {
          const rawVal = activeResources[sys.key] ?? 0
          const val = typeof rawVal === 'number' && !isNaN(rawVal)
            ? Math.max(0, Math.min(100, rawVal))
            : 0

          const condition = getResourceCondition(sys.key, val)

          return (
            <div
              key={sys.key}
              className={`system-indicator-card status-${condition.status} sys-type-${sys.key}`}
            >
              {/* Top Row: Icon + Name + Condition Tag */}
              <div className="system-card-top">
                <div className="system-name-group">
                  <span className="system-glyph" aria-hidden="true">{sys.icon}</span>
                  <span className="system-name-text">{sys.name}</span>
                </div>
                <span className={`system-condition-pill pill-${condition.status}`}>
                  {condition.label}
                </span>
              </div>

              {/* Metric Value */}
              <div className="system-metric-row">
                <span className="system-metric-value">{val}</span>
                <span className="system-metric-unit">%</span>
                {sys.isRadiation && (
                  <span className="system-subtag">SIMULATED METRIC</span>
                )}
              </div>

              {/* Progress Track */}
              <div
                className="system-meter-track"
                role="progressbar"
                aria-valuenow={val}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${sys.name} level`}
              >
                <div
                  className={`system-meter-fill fill-${condition.status}`}
                  style={{ width: `${val}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

