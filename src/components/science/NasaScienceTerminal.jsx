import NasaMarsEnvironmentPanel from '../dashboard/NasaMarsEnvironmentPanel'
import NasaSpaceWeatherPanel from '../dashboard/NasaSpaceWeatherPanel'
import './NasaScienceTerminal.css'

function displayFeedStatus(status) {
  if (status === 'live') return 'NASA feed live'
  if (status === 'partial') return 'NASA feed partial'
  if (status === 'fallback') return 'Demo fallback'
  if (status === 'loading') return 'Loading'
  if (status === 'no-results') return 'No results'
  if (status === 'error') return 'Feed error'
  return 'Feed unavailable'
}

function formatImageDate(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeZone: 'UTC' }).format(date)
}

function MarsMetadata({ marsEnvironment }) {
  if (marsEnvironment?.status !== 'live') return null

  const returnedText = [
    marsEnvironment.title,
    marsEnvironment.description,
    ...(Array.isArray(marsEnvironment.keywords) ? marsEnvironment.keywords : []),
  ].filter((value) => typeof value === 'string').join(' ')
  const rover = returnedText.match(/\b(?:Perseverance|Curiosity|Opportunity|Spirit|Sojourner)\b/i)?.[0] || ''
  const camera = returnedText.match(/\b(?:Mastcam(?:-?Z)?|Navcam|Front Hazcam|Rear Hazcam|MAHLI|MARDI|WATSON)\b/i)?.[0] || ''
  const sol = marsEnvironment.sol != null && marsEnvironment.sol !== ''
    ? String(marsEnvironment.sol)
    : returnedText.match(/\bSol(?:\s+number)?\s*[:#-]?\s*(\d{1,4})\b/i)?.[1] || ''
  const metadata = [
    ['Rover', rover],
    ['Camera', camera],
    ['Image date (UTC)', formatImageDate(marsEnvironment.dateCreated)],
    ['Sol', sol ? `Sol ${sol}` : ''],
  ].filter(([, value]) => value !== '' && value != null)

  return (
    <section className="science-metadata-card" aria-label="NASA rover image metadata">
      <div className="science-card-heading">
        <span className="science-card-kicker">NASA IMAGE METADATA</span>
        <h2>Rover observation details</h2>
      </div>
      {metadata.length > 0 ? (
        <dl className="science-metadata-grid">
          {metadata.map(([label, value]) => (
            <div className="science-metadata-item" key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="science-muted-note">
          NASA did not return rover, camera, date, or Sol details for this image. Missing metadata is left blank.
        </p>
      )}
      <p className="science-source-note">
        Values are shown only when provided or explicitly named in NASA Image Library metadata.
      </p>
    </section>
  )
}

function NasaScienceTerminal({ spaceWeather, marsEnvironment }) {
  return (
    <section className="nasa-science-terminal" aria-labelledby="science-terminal-title">
      <header className="science-terminal-header">
        <div>
          <span className="science-terminal-eyebrow">MISSION: OUTPOST // RESEARCH DECK</span>
          <h1 id="science-terminal-title">NASA Science Terminal</h1>
          <p>Space-weather observations and Mars rover imagery for scientific context.</p>
        </div>
        <div className="science-feed-status" aria-label="NASA data feed status">
          <span><b>DONKI</b>{displayFeedStatus(spaceWeather?.status)}</span>
          <span><b>MARS IMAGERY</b>{displayFeedStatus(marsEnvironment?.status)}</span>
        </div>
      </header>

      <div className="science-observations-grid">
        <div className="science-weather-column">
          <NasaSpaceWeatherPanel spaceWeather={spaceWeather} />
          <section className="science-context-card science-weather-definitions" aria-labelledby="weather-definitions-title">
            <span className="science-card-kicker">SPACE WEATHER BASICS</span>
            <h2 id="weather-definitions-title">Two different solar events</h2>
            <div className="science-definition-list">
              <p><strong>Solar flare:</strong> a sudden, intense burst of light and other electromagnetic radiation from the Sun.</p>
              <p><strong>Coronal mass ejection (CME):</strong> a large cloud of solar plasma carrying magnetic fields that erupts into space.</p>
            </div>
            <a href="https://science.nasa.gov/sun/solar-storms-and-flares/" target="_blank" rel="noreferrer">
              NASA Science: Solar storms and flares
            </a>
          </section>
        </div>
        <div className="science-mars-column">
          <NasaMarsEnvironmentPanel marsEnvironment={marsEnvironment} />
          <MarsMetadata marsEnvironment={marsEnvironment} />
        </div>
      </div>

      <div className="science-context-grid">
        <section className="science-context-card radiation-education" aria-labelledby="radiation-education-title">
          <span className="science-card-kicker">EDUCATIONAL CONTEXT // NOT A LIVE MEASUREMENT</span>
          <h2 id="radiation-education-title">Radiation and crew safety</h2>
          <p>
            Mars offers less natural shielding than Earth: it has no global magnetic field and its atmosphere is much thinner.
            Galactic cosmic rays and energetic particles from solar events are part of the radiation environment that mission
            planners study.
          </p>
          <p>
            Radiation cannot be seen or felt. Real crews would need instruments to monitor exposure and protective planning,
            such as shielding in habitats and vehicles and following mission procedures during solar particle events.
          </p>
          <div className="science-measurement-caveat">
            This terminal shows no radiation dose measurement. DONKI solar flare and CME records do not measure radiation inside
            the fictional Mars habitat.
          </div>
          <div className="science-source-links" aria-label="NASA radiation science sources">
            <a href="https://www.nasa.gov/hrp/hazard-space-radiation/" target="_blank" rel="noreferrer">
              NASA: Space radiation hazard
            </a>
            <a href="https://www.nasa.gov/science-research/heliophysics/real-martians-how-to-protect-astronauts-from-space-radiation-on-mars/" target="_blank" rel="noreferrer">
              NASA: Protecting astronauts on Mars
            </a>
            <a href="https://science.nasa.gov/mission/msl-curiosity/science-instruments/" target="_blank" rel="noreferrer">
              NASA: Curiosity RAD instrument
            </a>
          </div>
        </section>

        <section className="science-context-card mission-briefing" aria-labelledby="mission-briefing-title">
          <span className="science-card-kicker">MISSION BRIEFING</span>
          <h2 id="mission-briefing-title">Science informs the scenario</h2>
          <p>
            NASA DONKI reports solar flares and coronal mass ejections observed in space. Those records help explain why
            mission planners monitor space weather, while NASA rover images provide real views of Mars.
          </p>
          <p>
            In MISSION: OUTPOST, NASA observations are presented as learning context only. They are not linked to a game
            emergency. Any game events and resource values are simulated separately for this preview.
          </p>
          <div className="science-data-key">
            <span><i className="science-key-dot is-nasa" /> NASA observations and imagery</span>
            <span><i className="science-key-dot is-simulation" /> Fictional events and simulated resources</span>
          </div>
        </section>
      </div>
    </section>
  )
}

export default NasaScienceTerminal