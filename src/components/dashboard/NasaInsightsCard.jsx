import NasaSpaceWeatherPanel from './NasaSpaceWeatherPanel.jsx'
import NasaMarsEnvironmentPanel from './NasaMarsEnvironmentPanel.jsx'
import './NasaInsightsCard.css'

/**
 * NasaInsightsCard Component
 *
 * Implements Center Column (D) NASA & Mars Insights.
 * A compact, educational information panel clearly distinguishing:
 * - Actual NASA DONKI space weather observations
 * - Real Mars surface imagery (Jezero Crater / Perseverance)
 * - Transparent fallback/simulated labels
 */
export default function NasaInsightsCard({
  spaceWeather = null,
  marsEnvironment = null,
}) {
  return (
    <div className="nasa-insights-card">
      <div className="insights-header">
        <div className="insights-title-group">
          <span className="insights-glyph" aria-hidden="true">🛰️</span>
          <h4 className="insights-title">NASA &amp; MARS INSIGHTS</h4>
        </div>
        <span className="insights-badge">ASTRONOMICAL CONTEXT</span>
      </div>

      <div className="insights-grid">
        <div className="insight-panel-wrapper">
          <NasaSpaceWeatherPanel spaceWeather={spaceWeather} />
        </div>
        <div className="insight-panel-wrapper">
          <NasaMarsEnvironmentPanel marsEnvironment={marsEnvironment} />
        </div>
      </div>
    </div>
  )
}

