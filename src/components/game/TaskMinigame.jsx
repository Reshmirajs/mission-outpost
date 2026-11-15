import { useEffect, useRef, useState } from 'react'
import './TaskMinigame.css'

const WIRE_COLORS = ['amber', 'cyan', 'violet']
const SAMPLE_OPTIONS = ['iron', 'silica', 'water', 'carbon', 'salt']

function TaskMinigame({ task, playerRole, onComplete, onClose, onProgress = () => {}, progress = {}, completed }) {
  const [sequence, setSequence] = useState(progress.sequence || [])
  const [connections, setConnections] = useState(progress.connections || [])
  const [selectedWire, setSelectedWire] = useState(null)
  const [dial, setDial] = useState(progress.dial || 0)
  const [samples, setSamples] = useState(progress.samples || [])
  const [choice, setChoice] = useState(progress.choice || '')
  const [catalogue, setCatalogue] = useState(progress.catalogue || {})
  const [pressure, setPressure] = useState(progress.pressure || [0, 0, 0])
  const [frequencyLocked, setFrequencyLocked] = useState(Boolean(progress.frequencyLocked))
  const [message, setMessage] = useState('')
  const [solved, setSolved] = useState(completed)
  const finishStarted = useRef(Boolean(completed))
  const closeTimer = useRef(null)

  useEffect(() => () => window.clearTimeout(closeTimer.current), [])

  if (!task) return null

  const finish = () => {
    if (finishStarted.current || solved) return
    finishStarted.current = true
    setSolved(true)
    setMessage('System check complete. Mission resources updated.')
    onProgress(task.id, { percent: 100 })
    onComplete(task)
    closeTimer.current = window.setTimeout(onClose, 850)
  }
  const persist = (state, count = 1, total = 1) => {
    onProgress(task.id, { ...state, percent: Math.min(95, Math.round((count / Math.max(1, total)) * 95)) })
  }
  const playKey = (value) => {
    const next = [...sequence, value]
    setSequence(next)
    const correct = task.target.slice(0, next.length).every((item, index) => item === next[index])
    if (!correct) {
      setSequence([])
      persist({ sequence: [] }, 0, task.target.length)
      setMessage('That order did not match. Try the displayed sequence again.')
    } else if (next.length === task.target.length) finish()
    else { persist({ sequence: next }, next.length, task.target.length); setMessage(`${next.length} of ${task.target.length} steps matched.`) }
  }
  const connectWire = (terminal) => {
    if (!selectedWire) return
    const next = [...connections, [selectedWire, terminal]]
    setConnections(next)
    setSelectedWire(null)
    if (selectedWire !== terminal) {
      setConnections([])
      persist({ connections: [] }, 0, task.target.length)
      setMessage('The connector rejected that match. Start the wiring check again.')
    } else if (next.length === task.target.length) finish()
    else { persist({ connections: next }, next.length, task.target.length); setMessage(`${next.length} of ${task.target.length} connections verified.`) }
  }
  const chooseSample = (sample) => {
    if (samples.includes(sample)) return
    const next = [...samples, sample]
    setSamples(next)
    const correct = task.target.slice(0, next.length).every((item, index) => item === next[index])
    if (!correct) {
      setSamples([])
      persist({ samples: [] }, 0, task.target.length)
      setMessage('That spectral marker is out of sequence. Begin the analysis again.')
    } else if (next.length === task.target.length) finish()
    else { persist({ samples: next }, next.length, task.target.length); setMessage(`${next.length} of ${task.target.length} markers identified.`) }
  }
  const adjustDial = (value) => {
    setDial(value)
    persist({ dial: value }, value === task.target ? 1 : 0, 1)
    if (value === task.target) finish()
    else setMessage(value < task.target ? 'Reading is low. Increase the mix.' : 'Reading is high. Reduce the mix.')
  }
  const chooseOption = (value) => {
    setChoice(value)
    if (value === task.target) finish()
    else { persist({ choice: value }, 0, 1); setMessage('That interpretation does not match the simulated observation. Review the clues and try again.') }
  }
  const updateCatalogue = (label, value) => {
    const next = { ...catalogue, [label]: value }
    setCatalogue(next)
    const keys = Object.keys(task.target)
    const correctCount = keys.filter((key) => next[key] === task.target[key]).length
    if (keys.every((key) => next[key] === task.target[key])) finish()
    else { persist({ catalogue: next }, correctCount, keys.length); setMessage(`${correctCount} of ${keys.length} records match.`) }
  }
  const setPressureValve = (index, value) => {
    const next = pressure.map((item, valveIndex) => valveIndex === index ? value : item)
    setPressure(next)
    if (next.every((item, valveIndex) => item === task.target[valveIndex])) finish()
    else { persist({ pressure: next }, next.filter((item, valveIndex) => item === task.target[valveIndex]).length, task.target.length); setMessage('The simulated pressure loop is still outside its target sequence.') }
  }
  const setFrequency = (value) => {
    setDial(value)
    setFrequencyLocked(false)
    persist({ dial: value, frequencyLocked: false }, 0, 2)
  }
  const lockFrequency = () => {
    if (dial === task.target) {
      setFrequencyLocked(true)
      persist({ dial, frequencyLocked: true }, 1, 2)
      setMessage('Carrier locked. Transmit the status packet to finish.')
    } else setMessage('Signal is outside the reference band. Keep tuning.')
  }

  return (
    <div className="task-game-backdrop">
      <section className="task-game-panel" role="dialog" aria-modal="true" aria-labelledby="task-game-title">
        <header className="task-game-header">
          <div><span>{task.category?.toUpperCase()} · {task.role.toUpperCase()} · {task.difficulty?.toUpperCase()}</span><h2 id="task-game-title">{task.title}</h2></div>
          <button type="button" onClick={onClose} aria-label="Close task">×</button>
        </header>
        <p className="task-game-instructions">{task.instructions}</p>
        {playerRole !== task.role ? (
          <div className="task-role-lock"><strong>Assigned specialist: {task.role}</strong><p>This procedure is reserved for the matching crew role. Change the preview role or ask that specialist to complete it.</p></div>
        ) : task.type === 'sequence' && (
          <div className="task-game-controls">
            <p>Sequence: {task.target.map((value) => ['A', 'B', 'C', 'D'][value]).join(' · ')}</p>
            <div className="task-key-grid">{['A', 'B', 'C', 'D'].map((label, index) => <button type="button" key={label} disabled={solved} onClick={() => playKey(index)}>{label}</button>)}</div>
          </div>
        )}
        {playerRole === task.role && task.type === 'wires' && (
          <div className="task-wire-game">
            <div><strong>Loose leads</strong>{WIRE_COLORS.map((color) => <button type="button" className={`wire-lead ${color} ${selectedWire === color ? 'selected' : ''}`} key={color} disabled={solved || connections.some(([wire]) => wire === color)} onClick={() => setSelectedWire(color)}>{color}</button>)}</div>
            <span className="wire-bridge" aria-hidden="true">⟷</span>
            <div><strong>Terminal sockets</strong>{[...WIRE_COLORS].reverse().map((color) => <button type="button" className={`wire-lead ${color}`} key={color} disabled={solved || connections.some(([, terminal]) => terminal === color)} onClick={() => connectWire(color)}>{color}</button>)}</div>
          </div>
        )}
        {playerRole === task.role && task.type === 'calibration' && (
          <div className="task-calibration-game">
            <div className="calibration-track"><span className="calibration-target" style={{ left: `${task.target * 20}%` }} /><span className="calibration-marker" style={{ left: `${dial * 20}%` }} /></div>
            <div className="calibration-options">{[0, 1, 2, 3, 4, 5].map((value) => <button type="button" key={value} disabled={solved} aria-label={`Set dial to ${value}`} aria-pressed={dial === value} onClick={() => adjustDial(value)}>{value}</button>)}</div>
            <small>Move the reading into the green band.</small>
          </div>
        )}
        {playerRole === task.role && task.type === 'sample' && (
          <div className="task-sample-game"><p>Reference scan: <strong>{task.target.join(' → ')}</strong></p><div>{(task.options || SAMPLE_OPTIONS).map((sample) => <button type="button" key={sample} disabled={solved || samples.includes(sample)} onClick={() => chooseSample(sample)}>{sample}</button>)}</div><small>Identify the matching sample markers in order.</small></div>
        )}
        {playerRole === task.role && task.type === 'frequency' && (
          <div className="task-calibration-game"><p>SIMULATED CARRIER · {task.unit || 'MHz'}</p><div className="task-frequency-readout">{dial} <small>{task.unit || 'MHz'}</small></div><input type="range" min="0" max="10" step="1" value={dial} disabled={solved || frequencyLocked} onChange={(event) => setFrequency(Number(event.target.value))} aria-label="Tune simulated frequency" /><button type="button" disabled={solved || frequencyLocked} onClick={lockFrequency}>Lock signal</button><button type="button" disabled={solved || !frequencyLocked} onClick={finish}>Transmit packet</button></div>
        )}
        {playerRole === task.role && task.type === 'diagnosis' && (
          <div className="task-choice-grid">{task.options.map((option) => <button type="button" key={option.id} className={choice === option.id ? 'is-selected' : ''} aria-pressed={choice === option.id} disabled={solved} onClick={() => chooseOption(option.id)}><strong>{option.label}</strong></button>)}</div>
        )}
        {playerRole === task.role && task.type === 'observation' && (
          <div className="task-observation-card"><span>SIMULATED OBSERVATION CARD · NOT LIVE NASA DATA</span>{task.options.map((option) => <button type="button" key={option.id} className={choice === option.id ? 'is-selected' : ''} aria-pressed={choice === option.id} disabled={solved} onClick={() => chooseOption(option.id)}><strong>{option.label}</strong><small>{option.clue}</small></button>)}</div>
        )}
        {playerRole === task.role && task.type === 'catalogue' && (
          <div className="task-catalogue-list">{Object.keys(task.target).map((label) => <label key={label}><span>{label}</span><select value={catalogue[label] || ''} disabled={solved} onChange={(event) => updateCatalogue(label, event.target.value)}><option value="">Choose destination</option>{task.options.map((option) => <option key={option}>{option}</option>)}</select></label>)}</div>
        )}
        {playerRole === task.role && task.type === 'pressure' && (
          <div className="task-pressure-controls">{pressure.map((value, index) => <label key={index}>VALVE {index + 1}<input type="range" min="0" max="4" value={value} disabled={solved} onChange={(event) => setPressureValve(index, Number(event.target.value))} /><strong>{value}</strong></label>)}</div>
        )}
        <p className={`task-game-feedback ${solved ? 'success' : ''}`} aria-live="polite">{message || (playerRole !== task.role ? 'No task progress recorded.' : solved ? 'Task already completed for this mission.' : 'Complete the station procedure to record this task.')}</p>
        <footer><span>{solved ? 'TASK RECORDED' : 'SIMULATED TASK · LOCAL PREVIEW'}</span><button type="button" onClick={onClose}>Close</button></footer>
      </section>
    </div>
  )
}

export default TaskMinigame
