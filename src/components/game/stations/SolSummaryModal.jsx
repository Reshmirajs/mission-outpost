/**
 * SolSummaryModal Component
 * Displays the daily end-of-Sol survival report explaining:
 * - Resources consumed today
 * - Maintenance tasks completed
 * - Hazards and crises mitigated
 * - Risks and preview for the next Martian Sol
 */
export default function SolSummaryModal({
  solNumber,
  previousResources,
  currentResources,
  tasksCompletedToday = [],
  eventsResolvedToday = [],
  missionStatus,
  onContinue,
  onViewReport,
}) {
  const isMissionOver = missionStatus === 'completed' || missionStatus === 'failed';
  const isVictory = missionStatus === 'completed';

  const deltaOxygen = (currentResources?.oxygen ?? 0) - (previousResources?.oxygen ?? 0);
  const deltaWater = (currentResources?.water ?? 0) - (previousResources?.water ?? 0);
  const deltaPower = (currentResources?.power ?? 0) - (previousResources?.power ?? 0);
  const deltaFood = (currentResources?.food ?? 0) - (previousResources?.food ?? 0);
  const deltaRadiation = (currentResources?.radiation ?? 0) - (previousResources?.radiation ?? 0);

  return (
    <div className="sol-summary-overlay" role="dialog" aria-modal="true">
      <div className="sol-summary-dialog">
        <header className="sol-summary-header">
          <span className="summary-ribbon">
            {isMissionOver
              ? isVictory
                ? '🏆 20-SOL EXPEDITION COMPLETED'
                : '⚠️ CRITICAL MISSION FAILURE'
              : `SOL ${solNumber} LOGGED // NIGHTFALL`}
          </span>
          <h2>
            {isMissionOver
              ? isVictory
                ? 'Mission Successful! Mars Outpost Operational'
                : 'Life Support Collapsed'
              : `Sol ${solNumber} Survival Summary`}
          </h2>
          <p className="summary-subtitle">
            {isMissionOver
              ? isVictory
                ? 'The crew has survived all 20 Martian Sols and kept the habitat operational!'
                : 'A vital life-support resource depleted before Sol 20 could be reached.'
              : `Sector 4 base nightfall. Diurnal solar cycle completed.`}
          </p>
        </header>

        <div className="sol-summary-body">
          {/* Resource Delta Grid */}
          <h4 className="summary-heading">Daily Resource Consumption</h4>
          <div className="summary-resources-grid">
            <div className="summary-res-card">
              <span className="res-icon">🫧</span>
              <span className="res-name">Oxygen</span>
              <strong className="res-val">{currentResources?.oxygen ?? 0}%</strong>
              <small className={deltaOxygen < 0 ? 'text-loss' : 'text-gain'}>
                {deltaOxygen > 0 ? `+${deltaOxygen}%` : `${deltaOxygen}%`}
              </small>
            </div>

            <div className="summary-res-card">
              <span className="res-icon">💧</span>
              <span className="res-name">Water</span>
              <strong className="res-val">{currentResources?.water ?? 0}%</strong>
              <small className={deltaWater < 0 ? 'text-loss' : 'text-gain'}>
                {deltaWater > 0 ? `+${deltaWater}%` : `${deltaWater}%`}
              </small>
            </div>

            <div className="summary-res-card">
              <span className="res-icon">⚡</span>
              <span className="res-name">Power</span>
              <strong className="res-val">{currentResources?.power ?? 0}%</strong>
              <small className={deltaPower < 0 ? 'text-loss' : 'text-gain'}>
                {deltaPower > 0 ? `+${deltaPower}%` : `${deltaPower}%`}
              </small>
            </div>

            <div className="summary-res-card">
              <span className="res-icon">🌱</span>
              <span className="res-name">Food</span>
              <strong className="res-val">{currentResources?.food ?? 0}%</strong>
              <small className={deltaFood < 0 ? 'text-loss' : 'text-gain'}>
                {deltaFood > 0 ? `+${deltaFood}%` : `${deltaFood}%`}
              </small>
            </div>

            <div className="summary-res-card">
              <span className="res-icon">☢️</span>
              <span className="res-name">Radiation</span>
              <strong className="res-val">{currentResources?.radiation ?? 0}%</strong>
              <small className={deltaRadiation > 0 ? 'text-loss' : 'text-gain'}>
                {deltaRadiation > 0 ? `+${deltaRadiation}%` : `${deltaRadiation}%`}
              </small>
            </div>
          </div>

          {/* Operational Log */}
          <div className="summary-log-row">
            <div className="summary-log-box">
              <h4>Tasks Completed Today ({tasksCompletedToday.length})</h4>
              {tasksCompletedToday.length === 0 ? (
                <p className="empty-log-note">No station maintenance logged this Sol.</p>
              ) : (
                <ul className="log-items-list">
                  {tasksCompletedToday.map((t, idx) => (
                    <li key={idx}>✓ {t.title}</li>
                  ))}
                </ul>
              )}
            </div>

            <div className="summary-log-box">
              <h4>Crises Resolved ({eventsResolvedToday.length})</h4>
              {eventsResolvedToday.length === 0 ? (
                <p className="empty-log-note">Nominal Sol — no critical emergency occurred.</p>
              ) : (
                <ul className="log-items-list">
                  {eventsResolvedToday.map((e, idx) => (
                    <li key={idx}>🛡️ {e.title}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Next Sol Outlook */}
          {!isMissionOver && (
            <div className="summary-outlook-box">
              <strong>Sol {solNumber + 1} Outlook: </strong>
              <span>
                Dawn brings new solar array generation (+45 kW). Ensure greenhouse hydroponic lines are inspected
                and monitor space weather alerts from NASA DONKI!
              </span>
            </div>
          )}
        </div>

        <footer className="sol-summary-footer">
          {isMissionOver ? (
            <button type="button" className="btn-finish-report" onClick={onViewReport}>
              📊 View Comprehensive Final Mission Report →
            </button>
          ) : (
            <button type="button" className="btn-continue-expedition" onClick={onContinue}>
              Awaken on Sol {solNumber + 1} →
            </button>
          )}
        </footer>
      </div>
    </div>
  );
}

