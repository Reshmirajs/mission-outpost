import { useState } from 'react'
import {
  DEFAULT_MISSION_CONFIGURATION,
  normalizeMissionConfiguration,
} from '../../game/missionConfiguration.js'
import './MissionConfigurationDialog.css'

const DIFFICULTIES = ['casual', 'standard', 'challenging', 'custom']
const FREQUENCIES = ['none', 'low', 'medium', 'high']
const SOL_PRESETS = [1, 3, 5, 7, 10]

function titleCase(value) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

export default function MissionConfigurationDialog({
  initialConfiguration,
  onCancel,
  onConfirm,
  saving = false,
}) {
  const [configuration, setConfiguration] = useState(() => normalizeMissionConfiguration(
    initialConfiguration || DEFAULT_MISSION_CONFIGURATION,
  ))
  const [solSelection, setSolSelection] = useState(() => (
    SOL_PRESETS.includes(configuration.duration.totalSols)
      ? String(configuration.duration.totalSols)
      : 'custom'
  ))

  const update = (section, key, value) => {
    setConfiguration((current) => ({
      ...current,
      [section]: { ...current[section], [key]: value },
    }))
  }

  const updateDifficulty = (value) => {
    setConfiguration((current) => ({ ...current, difficulty: value }))
  }

  return (
    <div className="mission-config-backdrop" role="presentation">
      <section
        className="mission-config-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="mission-config-title"
      >
        <header className="mission-config-header">
          <div>
            <span className="mission-config-kicker">PRE-LAUNCH CHECK</span>
            <h2 id="mission-config-title">Mission settings</h2>
          </div>
          <button
            type="button"
            className="mission-config-close"
            onClick={onCancel}
            aria-label="Close settings"
          >
            ×
          </button>
        </header>

        <p className="mission-config-intro">
          Choose the length and simulation settings for this crew. These are game settings,
          not real Mars mission operating limits.
        </p>

        <div className="mission-config-grid">
          <label className="mission-config-field">
            <span>Mission difficulty</span>
            <select value={configuration.difficulty} onChange={(event) => updateDifficulty(event.target.value)}>
              {DIFFICULTIES.map((value) => (
                <option key={value} value={value}>{titleCase(value)}</option>
              ))}
            </select>
          </label>

          <fieldset className="mission-config-field mission-config-wide">
            <legend>Mission duration</legend>
            <div className="mission-config-inline">
              <label>
                <span>Total Sols</span>
                <select
                  value={solSelection}
                  onChange={(event) => {
                    setSolSelection(event.target.value)
                    if (event.target.value !== 'custom') {
                      update('duration', 'totalSols', Number(event.target.value))
                    }
                  }}
                >
                  {SOL_PRESETS.map((sol) => (
                    <option key={sol} value={sol}>{sol} Sol{sol > 1 ? 's' : ''}</option>
                  ))}
                  <option value="custom">Custom</option>
                </select>
              </label>
              <label>
                <span>Custom total (1–100)</span>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={configuration.duration.totalSols}
                  onChange={(event) => {
                    setSolSelection('custom')
                    update('duration', 'totalSols', Number(event.target.value))
                  }}
                />
              </label>
              <label>
                <span>Minutes per Sol</span>
                <input
                  type="number"
                  min="1"
                  max="1440"
                  value={configuration.duration.solDurationMinutes}
                  onChange={(event) => update('duration', 'solDurationMinutes', Number(event.target.value))}
                />
              </label>
            </div>
            <label className="mission-config-toggle">
              <input
                type="checkbox"
                checked={configuration.duration.acceleratedMode}
                onChange={(event) => update('duration', 'acceleratedMode', event.target.checked)}
              />
              <span>Accelerated demo clock (10× faster)</span>
            </label>
          </fieldset>

          <fieldset className="mission-config-field mission-config-wide">
            <legend>Task settings</legend>
            <div className="mission-config-inline">
              <label>
                <span>Short task difficulty</span>
                <select
                  value={configuration.tasks.shortDifficulty}
                  onChange={(event) => update('tasks', 'shortDifficulty', event.target.value)}
                >
                  {DIFFICULTIES.map((value) => <option key={value} value={value}>{titleCase(value)}</option>)}
                </select>
              </label>
              <label>
                <span>Long task difficulty</span>
                <select
                  value={configuration.tasks.longDifficulty}
                  onChange={(event) => update('tasks', 'longDifficulty', event.target.value)}
                >
                  {DIFFICULTIES.map((value) => <option key={value} value={value}>{titleCase(value)}</option>)}
                </select>
              </label>
              <label>
                <span>Tasks per astronaut</span>
                <input
                  type="number"
                  min="1"
                  max="6"
                  value={configuration.tasks.tasksPerAstronaut}
                  onChange={(event) => update('tasks', 'tasksPerAstronaut', Number(event.target.value))}
                />
              </label>
            </div>
            <div className="mission-config-checks">
              {[
                ['optionalTasksEnabled', 'Optional tasks'],
                ['mandatoryTasksEnabled', 'Mandatory tasks'],
                ['teamTasksEnabled', 'Team tasks'],
              ].map(([key, label]) => (
                <label className="mission-config-toggle" key={key}>
                  <input
                    type="checkbox"
                    checked={configuration.tasks[key]}
                    onChange={(event) => update('tasks', key, event.target.checked)}
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="mission-config-field mission-config-wide">
            <legend>Environmental event settings</legend>
            <div className="mission-config-inline mission-config-event-fields">
              {[
                ['solarFlareFrequency', 'Solar flares'],
                ['dustStormFrequency', 'Dust storms'],
                ['equipmentFailureFrequency', 'Equipment failures'],
                ['difficulty', 'Event difficulty'],
              ].map(([key, label]) => {
                const choices = key === 'difficulty' ? DIFFICULTIES : FREQUENCIES
                return (
                  <label key={key}>
                    <span>{label}</span>
                    <select
                      value={configuration.events[key]}
                      onChange={(event) => update('events', key, event.target.value)}
                    >
                      {choices.map((value) => (
                        <option key={value} value={value}>{titleCase(value)}</option>
                      ))}
                    </select>
                  </label>
                )
              })}
            </div>
          </fieldset>
        </div>

        <div className="mission-config-summary">
          <strong>Launch summary</strong>
          <span>
            {configuration.duration.totalSols} Sols · {configuration.duration.solDurationMinutes} minutes each
            {configuration.duration.acceleratedMode ? ' · 10× demo speed' : ''} · {configuration.difficulty} difficulty
          </span>
          <span>
            Tasks: {configuration.tasks.tasksPerAstronaut} per astronaut · short {configuration.tasks.shortDifficulty} · long {configuration.tasks.longDifficulty}
          </span>
          <span>
            Events: flares {configuration.events.solarFlareFrequency} · dust storms {configuration.events.dustStormFrequency} · equipment {configuration.events.equipmentFailureFrequency} · {configuration.events.difficulty} event difficulty
          </span>
          <small>
            Settings are saved with this local preview mission. Lobby coordination uses the
            existing browser-based service.
          </small>
        </div>

        <footer className="mission-config-actions">
          <button type="button" onClick={onCancel} disabled={saving}>Back to crew</button>
          <button
            type="button"
            className="mission-config-launch"
            onClick={() => onConfirm(normalizeMissionConfiguration(configuration))}
            disabled={saving}
          >
            {saving ? 'Saving settings…' : 'Save & start countdown'}
          </button>
        </footer>
      </section>
    </div>
  )
}
