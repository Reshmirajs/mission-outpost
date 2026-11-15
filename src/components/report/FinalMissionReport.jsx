import { useEffect, useMemo, useState } from 'react'
import NasaScienceTerminal from '../science/NasaScienceTerminal'
import { demoMissionHistoryCases, getDemoMissionHistoryCase } from '../../services/missionHistory/demoMissionHistory'
import { getMissionHistory, normalizeMissionHistoryResponse } from '../../services/missionHistory/missionHistoryService'
import './FinalMissionReport.css'

const RESOURCE_FIELDS = [
  { key: 'oxygen', label: 'Oxygen' },
  { key: 'power', label: 'Power' },
  { key: 'food', label: 'Food' },
  { key: 'radiation', label: 'Radiation (simulated)' },
]

const SECTION_NAMES = {
  crew: 'Crew',
  solSnapshots: 'Sol snapshots',
  completedTasks: 'Completed tasks',
  objectives: 'Objectives',
  events: 'Emergency and trap events',
  decisions: 'Decisions and votes',
}

function formatTimestamp(value) {
  if (typeof value !== 'string' || !value) return 'Not recorded'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Not recorded'
  return `${new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'UTC',
  }).format(date)} UTC`
}

function formatDuration(startedAt, endedAt) {
  if (typeof startedAt !== 'string' || typeof endedAt !== 'string') return 'Not recorded'
  const start = Date.parse(startedAt)
  const end = Date.parse(endedAt)
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return 'Not recorded'
  const totalHours = Math.floor((end - start) / 3_600_000)
  const days = Math.floor(totalHours / 24)
  const hours = totalHours % 24
  return days > 0 ? `${days}d ${hours}h` : `${hours}h`
}

function formatStatus(value) {
  if (typeof value !== 'string' || !value.trim()) return 'Not recorded'
  return value.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function getCompleteness(result, history, section) {
  const value = history?.completeness?.[section] || result?.completeness?.[section]
  return value === 'complete' || value === 'partial' || value === 'missing' ? value : 'missing'
}

function CompletenessTag({ status }) {
  return <span className={`report-completeness is-${status}`}>{status}</span>
}

function SectionHeader({ title, status, detail }) {
  return (
    <div className="report-section-header">
      <div>
        <h2>{title}</h2>
        {detail && <p>{detail}</p>}
      </div>
      <CompletenessTag status={status} />
    </div>
  )
}

function emptySectionMessage(label, status) {
  if (status === 'complete') return `No ${label.toLowerCase()} were recorded.`
  if (status === 'partial') return `No ${label.toLowerCase()} are available in the returned portion of this history; more may be missing.`
  return `${label} history is unavailable. Its absence cannot be confirmed.`
}

function asList(history, key) {
  return Array.isArray(history?.[key]) ? history[key] : null
}

function getSortedSnapshots(snapshots) {
  return [...snapshots]
    .filter((snapshot) => Number.isFinite(snapshot?.sol))
    .sort((left, right) => left.sol - right.sol)
}

function resourceValue(resources, key) {
  const value = resources?.[key]
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 100
    ? value
    : null
}

function ResourceTrendChart({ field, snapshots }) {
  const numericSnapshots = snapshots.filter((snapshot) => Number.isFinite(snapshot.sol))
  const sols = numericSnapshots.map((snapshot) => snapshot.sol)
  const firstSol = sols.length ? Math.min(...sols) : 0
  const lastSol = sols.length ? Math.max(...sols) : 0
  const points = numericSnapshots.flatMap((snapshot) => {
    const value = resourceValue(snapshot.resources, field.key)
    if (value === null) return []
    const x = firstSol === lastSol ? 320 : 42 + ((snapshot.sol - firstSol) / (lastSol - firstSol)) * 548
    const y = 140 - (value / 100) * 104
    return [{ sol: snapshot.sol, value, x, y }]
  })
  const segments = points.slice(1).flatMap((point, index) => {
    const previous = points[index]
    return point.sol === previous.sol + 1 ? [{ previous, point }] : []
  })

  return (
    <article className="report-chart-card">
      <div className="report-chart-heading">
        <h3>{field.label}</h3>
        <span>SIMULATED GAME RESOURCE</span>
      </div>
      {points.length === 0 ? (
        <p className="report-unavailable-copy">No numeric {field.label.toLowerCase()} snapshots are available to chart.</p>
      ) : (
        <svg className="resource-chart" viewBox="0 0 640 190" role="img" aria-label={`${field.label} by Sol from recorded snapshots`}>
          <line x1="42" y1="36" x2="590" y2="36" className="chart-gridline" />
          <line x1="42" y1="88" x2="590" y2="88" className="chart-gridline" />
          <line x1="42" y1="140" x2="590" y2="140" className="chart-axis" />
          <text x="4" y="40" className="chart-label">100%</text>
          <text x="10" y="92" className="chart-label">50%</text>
          <text x="20" y="144" className="chart-label">0%</text>
          {segments.map(({ previous, point }) => (
            <line
              key={`${field.key}-${previous.sol}-${point.sol}`}
              x1={previous.x}
              y1={previous.y}
              x2={point.x}
              y2={point.y}
              className={`chart-line is-${field.key}`}
            />
          ))}
          {points.map((point) => (
            <circle key={`${field.key}-${point.sol}`} cx={point.x} cy={point.y} r="5" className={`chart-point is-${field.key}`}>
              <title>{`Sol ${point.sol}: ${point.value}%`}</title>
            </circle>
          ))}
          {points.map((point) => (
            <text key={`sol-${field.key}-${point.sol}`} x={point.x} y="163" textAnchor="middle" className="chart-sol-label">Sol {point.sol}</text>
          ))}
        </svg>
      )}
    </article>
  )
}

function ResourceHistory({ result, history }) {
  const status = getCompleteness(result, history, 'solSnapshots')
  const snapshots = asList(history, 'solSnapshots')
  const ordered = snapshots ? getSortedSnapshots(snapshots) : []

  return (
    <section className="report-section" aria-labelledby="resource-history-title">
      <SectionHeader
        title="Resource trends across Sols"
        status={status}
        detail="These are simulated game resource values, not NASA measurements."
      />
      {ordered.length === 0 ? (
        <p className="report-empty-state">{emptySectionMessage('Sol snapshots', status)}</p>
      ) : (
        <div className="report-chart-grid">
          {RESOURCE_FIELDS.map((field) => (
            <ResourceTrendChart key={field.key} field={field} snapshots={ordered} />
          ))}
        </div>
      )}
    </section>
  )
}

function finalSnapshotFor(result, history) {
  if (getCompleteness(result, history, 'solSnapshots') !== 'complete') return null
  if (!['completed', 'failed'].includes(history?.mission?.status)) return null
  const snapshots = asList(history, 'solSnapshots')
  if (!snapshots?.length) return null
  return getSortedSnapshots(snapshots).at(-1) || null
}

function FinalResources({ result, history }) {
  const status = getCompleteness(result, history, 'solSnapshots')
  const snapshot = finalSnapshotFor(result, history)
  return (
    <section className="report-section" aria-labelledby="final-resources-title">
      <SectionHeader title="Final recorded resource levels" status={status} detail="Taken only from the final snapshot in a complete, ended mission history." />
      {snapshot ? (
        <>
          <p className="report-final-sol">Final recorded snapshot: Sol {snapshot.sol} · {formatTimestamp(snapshot.recordedAt)}</p>
          <div className="report-final-resource-grid">
            {RESOURCE_FIELDS.map((field) => {
              const value = resourceValue(snapshot.resources, field.key)
              return (
                <div className="report-final-resource" key={field.key}>
                  <span>{field.label}</span>
                  <strong>{value === null ? 'Not recorded' : `${value}%`}</strong>
                </div>
              )
            })}
          </div>
        </>
      ) : (
        <p className="report-empty-state">
          {status !== 'complete'
            ? 'Final levels are unavailable because the Sol history is incomplete.'
            : 'No final resource snapshot is available for this ended mission.'}
        </p>
      )}
    </section>
  )
}

function TaskHistory({ result, history }) {
  const status = getCompleteness(result, history, 'completedTasks')
  const tasks = asList(history, 'completedTasks')
  const crewById = new Map((asList(history, 'crew') || []).map((member) => [member.playerId, member]))

  return (
    <section className="report-section" aria-labelledby="task-history-title">
      <SectionHeader title="Completed tasks" status={status} />
      {!tasks || tasks.length === 0 ? (
        <p className="report-empty-state">{emptySectionMessage('Completed tasks', status)}</p>
      ) : (
        <ul className="report-record-list">
          {tasks.map((task, index) => (
            <li className="report-record-card" key={task.taskId || `task-${index}`}>
              <div className="report-record-title-row">
                <strong>{task.title || 'Task title not recorded'}</strong>
                {Number.isFinite(task.sol) && <span>Sol {task.sol}</span>}
              </div>
              <p>Completed: {formatTimestamp(task.completedAt)}</p>
              <p>
                Crew: {Array.isArray(task.completedBy) && task.completedBy.length > 0
                  ? task.completedBy.map((person, personIndex) => {
                    const crewMember = crewById.get(person.playerId)
                    const name = crewMember?.name || person.playerId || 'Player ID not recorded'
                    const role = person.role || crewMember?.role
                    return `${name}${role ? ` · ${role}` : ''}${personIndex < task.completedBy.length - 1 ? ', ' : ''}`
                  }).join('')
                  : 'Not recorded'}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function ObjectiveHistory({ result, history }) {
  const status = getCompleteness(result, history, 'objectives')
  const objectives = asList(history, 'objectives')
  return (
    <section className="report-section" aria-labelledby="objective-history-title">
      <SectionHeader title="Objective progress" status={status} />
      {!objectives || objectives.length === 0 ? (
        <p className="report-empty-state">{emptySectionMessage('Objectives', status)}</p>
      ) : (
        <ul className="report-record-list">
          {objectives.map((objective, index) => (
            <li className="report-record-card" key={objective.objectiveId || `objective-${index}`}>
              <div className="report-record-title-row">
                <strong>{objective.title || 'Objective title not recorded'}</strong>
                <span>{formatStatus(objective.status)}</span>
              </div>
              {objective.category && <p>{objective.category}</p>}
              <p>Completed: {formatTimestamp(objective.completedAt)}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function outcomeText(outcome) {
  if (typeof outcome === 'string') return formatStatus(outcome)
  if (outcome && typeof outcome === 'object') {
    if (outcome.summary) return outcome.summary
    if (outcome.status) return formatStatus(outcome.status)
    return outcome.selectedOptionId || 'Not recorded'
  }
  return 'Not recorded'
}

function eventType(event) {
  return typeof event?.type === 'string' ? event.type.toLowerCase().replaceAll('-', '_') : ''
}

function eventOutcome(event) {
  if (typeof event?.outcome === 'string') return event.outcome.toLowerCase()
  return typeof event?.outcome?.status === 'string' ? event.outcome.status.toLowerCase() : ''
}

function eventGroups(events) {
  return {
    incidents: events.filter((event) => ['emergency', 'trap', 'trap_incident'].includes(eventType(event))),
    rescueAttempts: events.filter((event) => eventType(event) === 'rescue_attempt'),
    successfulRescues: events.filter((event) => eventType(event) === 'successful_rescue'
      || (eventType(event) === 'rescue'
        && ['success', 'successful', 'succeeded', 'rescued'].includes(eventOutcome(event)))),
    eliminations: events.filter((event) => eventType(event) === 'elimination'),
  }
}

function RecordedCount({ records, status, label }) {
  if (!Array.isArray(records) || status === 'missing') return <strong>Unavailable</strong>
  if (status === 'complete') return <strong>{records.length} {label}</strong>
  return <strong>{records.length} recorded · history partial</strong>
}

function EventHistory({ result, history }) {
  const status = getCompleteness(result, history, 'events')
  const events = asList(history, 'events')
  const groups = eventGroups(events || [])
  const summaries = [
    ['Emergencies and traps', groups.incidents, 'events'],
    ['Rescue attempts', groups.rescueAttempts, 'attempts'],
    ['Successful rescues', groups.successfulRescues, 'rescues'],
    ['Eliminations', groups.eliminations, 'eliminations'],
  ]

  return (
    <section className="report-section" aria-labelledby="event-history-title">
      <SectionHeader title="Emergencies, traps and crew outcomes" status={status} />
      {!events || events.length === 0 ? (
        <p className="report-empty-state">{emptySectionMessage('Emergency and trap events', status)}</p>
      ) : (
        <>
          <div className="report-count-grid">
            {summaries.map(([label, records, noun]) => (
              <div className="report-count-card" key={label}>
                <span>{label}</span>
                <RecordedCount records={records} status={status} label={noun} />
              </div>
            ))}
          </div>
          <ul className="report-record-list">
            {events.map((event, index) => (
              <li className="report-record-card" key={event.eventId || `event-${index}`}>
                <div className="report-record-title-row">
                  <strong>{formatStatus(event.type) || 'Event type not recorded'}</strong>
                  {Number.isFinite(event.sol) && <span>Sol {event.sol}</span>}
                </div>
                {event.summary && <p>{event.summary}</p>}
                <p>Occurred: {formatTimestamp(event.occurredAt)} · Outcome: {outcomeText(event.outcome)}</p>
                <p>
                  Affected crew: {Array.isArray(event.affectedPlayers) && event.affectedPlayers.length > 0
                    ? event.affectedPlayers.map((person) => {
                      const name = person.name || person.playerId || 'Player ID not recorded'
                      return `${name}${person.role ? ` (${person.role})` : ''}`
                    }).join(', ')
                    : 'Not recorded'}
                </p>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  )
}

function DecisionHistory({ result, history }) {
  const status = getCompleteness(result, history, 'decisions')
  const decisions = asList(history, 'decisions')
  const crewById = new Map((asList(history, 'crew') || []).map((member) => [member.playerId, member]))
  return (
    <section className="report-section" aria-labelledby="decision-history-title">
      <SectionHeader title="Decisions and votes" status={status} />
      {!decisions || decisions.length === 0 ? (
        <p className="report-empty-state">{emptySectionMessage('Decisions and votes', status)}</p>
      ) : (
        <ul className="report-record-list">
          {decisions.map((decision, index) => (
            <li className="report-record-card" key={decision.decisionId || `decision-${index}`}>
              <div className="report-record-title-row">
                <strong>{decision.prompt || 'Decision prompt not recorded'}</strong>
                {Number.isFinite(decision.sol) && <span>Sol {decision.sol}</span>}
              </div>
              <p>Resolved outcome: {outcomeText(decision.outcome)}</p>
              {Array.isArray(decision.votes) ? (
                decision.votes.length > 0 ? (
                  <ul className="report-vote-list">
                    {decision.votes.map((vote, voteIndex) => {
                      const crewMember = crewById.get(vote.playerId)
                      const name = crewMember?.name || vote.playerId || 'Player ID not recorded'
                      return (
                        <li key={`${decision.decisionId || index}-vote-${voteIndex}`}>
                          {name} — {vote.optionId || 'Choice not recorded'}
                          {vote.role || crewMember?.role ? ` (${vote.role || crewMember.role})` : ''}
                        </li>
                      )
                    })}
                  </ul>
                ) : <p>No votes were recorded for this decision.</p>
              ) : <p>Vote details are unavailable.</p>}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function CrewHistory({ result, history }) {
  const crewStatus = getCompleteness(result, history, 'crew')
  const taskStatus = getCompleteness(result, history, 'completedTasks')
  const crew = asList(history, 'crew')
  const tasks = asList(history, 'completedTasks')
  const taskCounts = new Map()

  if (Array.isArray(tasks)) {
    for (const task of tasks) {
      if (!Array.isArray(task.completedBy)) continue
      for (const person of task.completedBy) {
        if (typeof person.playerId !== 'string') continue
        taskCounts.set(person.playerId, (taskCounts.get(person.playerId) || 0) + 1)
      }
    }
  }

  return (
    <section className="report-section" aria-labelledby="crew-history-title">
      <SectionHeader title="Crew roster and contributions" status={crewStatus} detail="Contribution counts are recorded task completions, not performance scores." />
      {!crew || crew.length === 0 ? (
        <p className="report-empty-state">{emptySectionMessage('Crew roster', crewStatus)}</p>
      ) : (
        <div className="report-crew-grid">
          {crew.map((member, index) => (
            <article className="report-crew-card" key={member.playerId || `crew-${index}`}>
              <span className="report-crew-role">{member.role || 'Role not recorded'}</span>
              <h3>{member.name || member.playerId || 'Crew member not identified'}</h3>
              <p>Status: {formatStatus(member.finalStatus)}</p>
              <p>
                Recorded task completions:{' '}
                {taskStatus === 'missing' || !Array.isArray(tasks)
                  ? 'Unavailable'
                  : `${taskCounts.get(member.playerId) || 0}${taskStatus === 'partial' ? ' or more' : ''}`}
              </p>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

function MissionOverview({ result, history }) {
  const mission = history?.mission
  const status = result?.status === 'complete' ? 'complete' : result?.status === 'partial' ? 'partial' : 'missing'
  return (
    <section className="report-overview" aria-labelledby="mission-overview-title">
      <div className="report-overview-header">
        <div>
          <span className="report-kicker">FINAL MISSION REPORT</span>
          <h2 id="mission-overview-title">{mission?.missionId || 'Mission history'}</h2>
          <p>Room code: {mission?.roomCode || 'Not recorded'}</p>
        </div>
        <div className="report-outcome-block">
          <span>Outcome</span>
          <strong>{formatStatus(mission?.status)}</strong>
        </div>
      </div>
      <div className="report-overview-stats">
        <div><span>Started</span><strong>{formatTimestamp(mission?.startedAt)}</strong></div>
        <div><span>Ended</span><strong>{formatTimestamp(mission?.endedAt)}</strong></div>
        <div><span>Duration</span><strong>{formatDuration(mission?.startedAt, mission?.endedAt)}</strong></div>
      </div>
      <div className="report-history-status">
        History completeness <CompletenessTag status={status} />
      </div>
    </section>
  )
}

function CompletenessOverview({ result, history }) {
  return (
    <section className="report-section report-completeness-section" aria-label="History record completeness">
      <h2>Record completeness</h2>
      <div className="report-completeness-grid">
        {Object.entries(SECTION_NAMES).map(([key, label]) => (
          <div className="report-completeness-item" key={key}>
            <span>{label}</span>
            <CompletenessTag status={getCompleteness(result, history, key)} />
          </div>
        ))}
      </div>
    </section>
  )
}

function MissionHistoryContent({ result, nasaData }) {
  const history = result?.history || null
  const isTerminal = ['completed', 'failed'].includes(history?.mission?.status)
  const snapshots = asList(history, 'solSnapshots')
  const orderedSnapshots = snapshots ? getSortedSnapshots(snapshots) : []

  return (
    <>
      {result?.status === 'partial' && (
        <div className="report-data-notice is-partial" role="status">
          Some mission records are incomplete. Available entries are shown; missing entries are not treated as zero or as confirmed empty.
        </div>
      )}
      {result?.status === 'missing' && (
        <div className="report-data-notice" role="status">
          {result.message || 'No mission history is available. This does not mean the mission had no events or tasks.'}
        </div>
      )}
      {result?.status === 'unavailable' && (
        <div className="report-data-notice" role="status">
          {result.message || 'The live mission history provider is not connected yet.'}
        </div>
      )}
      {result?.status === 'error' && (
        <div className="report-data-notice is-error" role="alert">
          {result.message || 'Mission history could not be loaded.'}
        </div>
      )}
      {result?.status !== 'missing' && result?.status !== 'unavailable' && result?.status !== 'error' && (
        <>
          <MissionOverview result={result} history={history} />
          <CompletenessOverview result={result} history={history} />
          <CrewHistory result={result} history={history} />
          <ResourceHistory result={result} history={history} />
          <FinalResources result={result} history={history} />
          <div className="report-two-column-grid">
            <TaskHistory result={result} history={history} />
            <ObjectiveHistory result={result} history={history} />
          </div>
          <EventHistory result={result} history={history} />
          <DecisionHistory result={result} history={history} />
          {!isTerminal && (
            <p className="report-data-notice" role="status">
              The mission history does not contain a completed or failed outcome. Final resource levels are not shown as final.
            </p>
          )}
          {orderedSnapshots.length > 0 && getCompleteness(result, history, 'solSnapshots') !== 'complete' && (
            <p className="report-muted-note">Charts show only recorded snapshots and may not include every Sol.</p>
          )}
        </>
      )}
      <details className="report-nasa-context">
        <summary>NASA science context — separate from simulated mission history</summary>
        <p>NASA observations below are not mission events and are not used to fill in mission history.</p>
        <NasaScienceTerminal
          spaceWeather={nasaData?.spaceWeather}
          marsEnvironment={nasaData?.marsEnvironment}
        />
      </details>
    </>
  )
}

function FinalMissionReport({ nasaData, historyLoader = getMissionHistory, initialMissionId = '' }) {
  const [mode, setMode] = useState(initialMissionId ? 'real' : 'demo')
  const [demoCaseId, setDemoCaseId] = useState('complete')
  const [missionId, setMissionId] = useState(initialMissionId)
  const [realResult, setRealResult] = useState(null)
  const [isLoading, setIsLoading] = useState(Boolean(initialMissionId))
  const [loadError, setLoadError] = useState('')
  const selectedDemoCase = useMemo(() => getDemoMissionHistoryCase(demoCaseId), [demoCaseId])
  const result = mode === 'demo'
    ? normalizeMissionHistoryResponse(selectedDemoCase.result)
    : realResult

  useEffect(() => {
    const requestedId = initialMissionId.trim()
    if (!requestedId) return undefined

    let isCurrentRequest = true
    historyLoader(requestedId)
      .then((response) => {
        if (isCurrentRequest) setRealResult(response)
      })
      .catch((error) => {
        if (isCurrentRequest) {
          setLoadError(error instanceof Error ? error.message : 'Mission history could not be loaded.')
        }
      })
      .finally(() => {
        if (isCurrentRequest) setIsLoading(false)
      })

    return () => { isCurrentRequest = false }
  }, [historyLoader, initialMissionId])

  async function handleMissionLookup(event) {
    event.preventDefault()
    const requestedId = missionId.trim()
    if (!requestedId) {
      setMode('real')
      setRealResult({ status: 'missing', history: null, message: 'Enter a mission ID to load its history.' })
      return
    }

    setMode('real')
    setIsLoading(true)
    setLoadError('')
    setRealResult(null)
    try {
      const response = await historyLoader(requestedId)
      setRealResult(response)
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Mission history could not be loaded.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="final-mission-report" aria-labelledby="final-report-page-title">
      <header className="final-report-page-header">
        <div>
          <span className="report-kicker">MISSION: OUTPOST // ARCHIVE</span>
          <h1 id="final-report-page-title">Final Mission Report</h1>
          <p>Recorded mission history, resource trends and crew actions.</p>
        </div>
        <span className={`report-source-ribbon ${mode === 'demo' ? 'is-demo' : 'is-live'}`}>
          {mode === 'demo' ? 'DEMO HISTORY — NOT A REAL MISSION' : realResult?.source === 'local-preview' ? 'LOCAL PLAYTEST HISTORY' : 'RECORDED HISTORY LOOKUP'}
        </span>
      </header>

      <section className="report-source-controls" aria-label="Report data source">
        <label className="report-control-field">
          <span>Demo test fixture</span>
          <select
            value={demoCaseId}
            onChange={(event) => {
              setDemoCaseId(event.target.value)
              setMode('demo')
              setLoadError('')
            }}
          >
            {demoMissionHistoryCases.map((fixture) => (
              <option key={fixture.id} value={fixture.id}>{fixture.label}</option>
            ))}
          </select>
        </label>
        <form className="report-lookup-form" onSubmit={handleMissionLookup}>
          <label className="report-control-field" htmlFor="report-mission-id">
            <span>Mission ID</span>
            <input
              id="report-mission-id"
              value={missionId}
              onChange={(event) => setMissionId(event.target.value)}
              placeholder="Enter a mission ID"
            />
          </label>
          <button type="submit" disabled={isLoading}>
            {isLoading ? 'Loading…' : 'Load recorded history'}
          </button>
        </form>
      </section>

      {mode === 'demo' && (
        <div className="report-demo-notice" role="note">
          DEMO FIXTURE — all names, dates, events and resource values below are fictional UI test data.
        </div>
      )}
      {mode === 'real' && realResult?.source === 'local-preview' && (
        <div className="report-demo-notice" role="note">
          LOCAL PLAYTEST HISTORY — recorded in this browser from the simulated game. It is not Firebase-synchronized or real-world mission telemetry.
        </div>
      )}
      {loadError && <div className="report-data-notice is-error" role="alert">{loadError}</div>}

      {isLoading ? (
        <div className="report-loading" role="status" aria-live="polite">Loading mission history…</div>
      ) : result ? (
        <MissionHistoryContent result={result} nasaData={nasaData} />
      ) : mode === 'real' ? (
        <div className="report-data-notice" role="status">Enter a mission ID and load its history.</div>
      ) : null}
    </main>
  )
}

export default FinalMissionReport
