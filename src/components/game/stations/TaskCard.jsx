import { useState } from 'react';

/**
 * TaskCard Component
 * Standardized, child-friendly task card used across all 5 habitat stations.
 *
 * Structure:
 * A. Task Title (e.g. "Clean the Solar Panels")
 * B. Equipment and Location (e.g. "Power Room → Solar Panel Array")
 * C. Short Description (1-2 sentences for kids aged 7-12)
 * D. View Steps Option (collapsible numbered instructions)
 * E. Action (tactile button/control to execute the task)
 * F. Completion Status (Pending, In Progress, Completed + success feedback)
 * G. Why It Matters (educational explanation of survival benefits)
 */
export default function TaskCard({
  task,
  onCompleteTask,
  onApplyResourceDelta,
}) {
  const [isStepsExpanded, setIsStepsExpanded] = useState(false);
  const [isPerforming, setIsPerforming] = useState(false);
  const [successBanner, setSuccessBanner] = useState(null);

  const isCompleted = task.status === 'completed';
  const locationString = task.location || `${task.roomName || 'Habitat'} → ${task.equipment || 'Station'}`;

  const handleExecuteTask = () => {
    if (isCompleted || isPerforming) return;

    setIsPerforming(true);

    // Brief interactive engagement timing (350ms) to feel like a real action
    setTimeout(() => {
      if (onCompleteTask) {
        onCompleteTask(task.id, task.resourceEffect);
      }
      if (onApplyResourceDelta && task.resourceEffect) {
        onApplyResourceDelta(task.resourceEffect);
      }
      setIsPerforming(false);
      setSuccessBanner(task.successMessage || 'Task completed successfully!');
    }, 350);
  };

  return (
    <div
      className={`standard-task-card ${isCompleted ? 'task-state-completed' : isPerforming ? 'task-state-in-progress' : 'task-state-pending'}`}
      data-task-id={task.id}
    >
      {/* 1. Header: Title & Status Badge */}
      <div className="task-card-header">
        <div className="task-title-group">
          <h3 className="task-card-title">{task.title}</h3>
          <div className="task-location-tag">
            <span className="location-pin-icon" aria-hidden="true">📍</span>
            <span className="location-text">{locationString}</span>
          </div>
        </div>

        <div className="task-status-container">
          {isCompleted ? (
            <span className="status-badge status-completed">
              <span className="badge-icon">✓</span> Completed
            </span>
          ) : isPerforming ? (
            <span className="status-badge status-in-progress">
              <span className="badge-icon spinner-icon">⚡</span> In Progress
            </span>
          ) : (
            <span className="status-badge status-pending">
              <span className="badge-icon">⏳</span> Pending
            </span>
          )}
        </div>
      </div>

      {/* 2. Short Description */}
      <p className="task-card-description">
        {task.shortDescription || task.shortExplanation}
      </p>

      {/* 3. View Steps Option (Collapsible, visually secondary) */}
      <div className="task-steps-accordion">
        <button
          type="button"
          className="btn-toggle-steps"
          onClick={() => setIsStepsExpanded((prev) => !prev)}
          aria-expanded={isStepsExpanded}
        >
          <span className="toggle-steps-icon">{isStepsExpanded ? '▼' : '▶'}</span>
          <span className="toggle-steps-label">
            {isStepsExpanded ? 'Hide Steps' : `View Steps (${task.steps?.length || 0})`}
          </span>
        </button>

        {isStepsExpanded && task.steps && task.steps.length > 0 && (
          <ol className="task-steps-numbered-list">
            {task.steps.map((step, index) => (
              <li key={index} className="task-step-item">
                <span className="step-counter">{index + 1}.</span>
                <span className="step-text">{step}</span>
              </li>
            ))}
          </ol>
        )}
      </div>

      {/* 4. Action Area */}
      <div className="task-card-action-bar">
        {isCompleted ? (
          <div className="task-completed-message">
            <span className="completion-check">✅</span>
            <span className="completion-text">
              {successBanner || task.successMessage || 'Task Completed! Outpost systems updated.'}
            </span>
          </div>
        ) : (
          <button
            type="button"
            className="btn-task-action"
            onClick={handleExecuteTask}
            disabled={isPerforming}
          >
            {isPerforming ? (
              <>
                <span className="action-spinner">⚙️</span>
                <span>Working...</span>
              </>
            ) : (
              <>
                <span>{task.actionLabel || 'Complete Task'}</span>
                {task.resourceEffect && Object.keys(task.resourceEffect).length > 0 && (
                  <span className="action-effect-tag">
                    {Object.entries(task.resourceEffect)
                      .map(([res, val]) => `${val > 0 ? '+' : ''}${val}% ${res.charAt(0).toUpperCase() + res.slice(1)}`)
                      .join(', ')}
                  </span>
                )}
              </>
            )}
          </button>
        )}
      </div>

      {/* 5. Why It Matters (Educational context for kids 7-12) */}
      <div className="task-why-it-matters">
        <div className="why-header">
          <span className="bulb-icon" aria-hidden="true">💡</span>
          <strong>Why It Matters:</strong>
        </div>
        <p className="why-text">
          {task.whyItMatters || task.educationalTakeaway}
        </p>
      </div>
    </div>
  );
}

