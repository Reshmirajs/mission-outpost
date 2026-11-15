import PowerStationModal from './PowerStationModal.jsx';
import GreenhouseStationModal from './GreenhouseStationModal.jsx';
import LifeSupportStationModal from './LifeSupportStationModal.jsx';
import ScienceStationModal from './ScienceStationModal.jsx';
import CommandStationModal from './CommandStationModal.jsx';
import './Stations.css';

/**
 * StationDialog Component
 * Routes the active interactive station to its designated operational interface.
 */
export default function StationDialog({
  station,
  mission,
  resources,
  players = [],
  currentPlayer,
  tasks = [],
  activeEvent,
  onOpenCrisisModal,
  onCompleteTask,
  onApplyResourceDelta,
  onAdvanceSol,
  powerGrid,
  onUpdatePowerGrid,
  cropIrrigationPolicy,
  onUpdateIrrigationPolicy,
  nasaData,
  onClose,
}) {
  if (!station) return null;

  const stationTasks = tasks.filter((t) => t.stationId === station.id);

  return (
    <div className="station-panel-backdrop" role="dialog" aria-modal="true">
      <section className="station-interaction-dialog">
        <header className="station-dialog-header">
          <div className="dialog-title-group">
            <span className="station-panel-ribbon">HABITAT SYSTEM // {station.roomName?.toUpperCase()}</span>
            <h2 id="station-panel-title">{station.name}</h2>
          </div>
          <button
            type="button"
            className="station-close-button"
            onClick={onClose}
            title="Close station panel (Esc)"
          >
            Close <kbd>Esc</kbd>
          </button>
        </header>

        <div className="station-dialog-body">
          {station.id === 'generator-control' || station.roomId === 'power' ? (
            <PowerStationModal
              station={station}
              resources={resources}
              currentPlayer={currentPlayer}
              tasks={stationTasks}
              onCompleteTask={onCompleteTask}
              onApplyResourceDelta={onApplyResourceDelta}
              powerGrid={powerGrid}
              onUpdatePowerGrid={onUpdatePowerGrid}
              onClose={onClose}
            />
          ) : station.id === 'hydroponics' || station.roomId === 'greenhouse' ? (
            <GreenhouseStationModal
              station={station}
              resources={resources}
              currentPlayer={currentPlayer}
              tasks={stationTasks}
              onCompleteTask={onCompleteTask}
              onApplyResourceDelta={onApplyResourceDelta}
              cropIrrigationPolicy={cropIrrigationPolicy}
              onUpdateIrrigationPolicy={onUpdateIrrigationPolicy}
              onClose={onClose}
            />
          ) : station.id === 'oxygen-control' || station.roomId === 'life-support' ? (
            <LifeSupportStationModal
              station={station}
              resources={resources}
              currentPlayer={currentPlayer}
              tasks={stationTasks}
              onCompleteTask={onCompleteTask}
              onApplyResourceDelta={onApplyResourceDelta}
              onClose={onClose}
            />
          ) : station.id === 'research-workstation' || station.roomId === 'science' ? (
            <ScienceStationModal
              station={station}
              resources={resources}
              currentPlayer={currentPlayer}
              tasks={stationTasks}
              onCompleteTask={onCompleteTask}
              onApplyResourceDelta={onApplyResourceDelta}
              nasaData={nasaData}
              onClose={onClose}
            />
          ) : (
            <CommandStationModal
              station={station}
              mission={mission}
              resources={resources}
              players={players}
              currentPlayer={currentPlayer}
              tasks={stationTasks}
              activeEvent={activeEvent}
              onOpenCrisisModal={onOpenCrisisModal}
              onAdvanceSol={onAdvanceSol}
              onCompleteTask={onCompleteTask}
              onApplyResourceDelta={onApplyResourceDelta}
              onClose={onClose}
            />
          )}
        </div>
      </section>
    </div>
  );
}

