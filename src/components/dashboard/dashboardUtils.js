/**
 * MISSION: OUTPOST - Dashboard Utilities & Calculations
 * Person 2: Mars Dashboard Module
 */

/**
 * Easy-to-modify threshold configuration for habitat resources.
 * - For Standard resources (oxygen, power, food): higher is better.
 * - For Radiation: higher is dangerous.
 */
export const RESOURCE_THRESHOLDS = {
  standard: {
    critical: 25, // Value below this is Critical
    warning: 50,  // Value below this is Warning
  },
  radiation: {
    critical: 70, // Value at or above this is Critical
    warning: 40,  // Value at or above this is Warning
  },
};

/**
 * Evaluates the safety condition of a resource.
 * @param {'oxygen'|'power'|'food'|'radiation'} type
 * @param {number} value (0 - 100)
 * @returns {{ status: 'nominal'|'warning'|'critical', label: string, message: string }}
 */
export function getResourceCondition(type, value) {
  const isRadiation = type === 'radiation';
  const numericValue = typeof value === 'number' && !isNaN(value) ? Math.max(0, Math.min(100, value)) : 0;

  if (isRadiation) {
    if (numericValue >= RESOURCE_THRESHOLDS.radiation.critical) {
      return {
        status: 'critical',
        label: 'CRITICAL',
        message: 'Severe radiation hazard! Shielding breached.',
      };
    }
    if (numericValue >= RESOURCE_THRESHOLDS.radiation.warning) {
      return {
        status: 'warning',
        label: 'ELEVATED',
        message: 'Elevated radiation detected. Monitor exposure.',
      };
    }
    return {
      status: 'nominal',
      label: 'NOMINAL',
      message: 'Background cosmic levels safe.',
    };
  }

  // Standard resources (oxygen, power, food)
  if (numericValue < RESOURCE_THRESHOLDS.standard.critical) {
    return {
      status: 'critical',
      label: 'CRITICAL',
      message: `Critically low ${type}! Immediate action required.`,
    };
  }
  if (numericValue < RESOURCE_THRESHOLDS.standard.warning) {
    return {
      status: 'warning',
      label: 'DEPLETING',
      message: `Reserve below 50%. Rationing advised.`,
    };
  }
  return {
    status: 'nominal',
    label: 'NOMINAL',
    message: 'System stable within operating limits.',
  };
}

/**
 * Derives real-time system alerts based on current resource telemetry.
 * @param {Object} resources
 * @returns {Array<{ id: string, type: 'info'|'warning'|'critical', title: string, message: string, timestamp: string }>}
 */
export function deriveResourceAlerts(resources) {
  if (!resources) return [];

  const generatedAlerts = [];
  const now = 'Telemetry Monitor';

  const o2 = typeof resources.oxygen === 'number' ? resources.oxygen : 100;
  const pwr = typeof resources.power === 'number' ? resources.power : 100;
  const food = typeof resources.food === 'number' ? resources.food : 100;
  const rad = typeof resources.radiation === 'number' ? resources.radiation : 0;

  // Oxygen alerts
  if (o2 < RESOURCE_THRESHOLDS.standard.critical) {
    generatedAlerts.push({
      id: 'alert-o2-crit',
      type: 'critical',
      title: 'CRITICAL OXYGEN FAILURE',
      message: `Hab atmospheric oxygen depleted to ${o2}%. Hypoxia hazard imminent.`,
      timestamp: now,
    });
  } else if (o2 < RESOURCE_THRESHOLDS.standard.warning) {
    generatedAlerts.push({
      id: 'alert-o2-warn',
      type: 'warning',
      title: 'Low Oxygen Warning',
      message: `Oxygen levels have dropped to ${o2}%. Check scrubbers.`,
      timestamp: now,
    });
  }

  // Power alerts
  if (pwr < RESOURCE_THRESHOLDS.standard.critical) {
    generatedAlerts.push({
      id: 'alert-pwr-crit',
      type: 'critical',
      title: 'GRID POWER EMERGENCY',
      message: `Core power reserves at ${pwr}%. Non-essential subsystems offline.`,
      timestamp: now,
    });
  } else if (pwr < RESOURCE_THRESHOLDS.standard.warning) {
    generatedAlerts.push({
      id: 'alert-pwr-warn',
      type: 'warning',
      title: 'High Power Drain',
      message: `Grid storage at ${pwr}%. Power conservation recommended.`,
      timestamp: now,
    });
  }

  // Food alerts
  if (food < RESOURCE_THRESHOLDS.standard.critical) {
    generatedAlerts.push({
      id: 'alert-food-crit',
      type: 'critical',
      title: 'CRITICAL RATIONS DEPLETION',
      message: `Food supplies critically low (${food}%). Crew starvation risk.`,
      timestamp: now,
    });
  } else if (food < RESOURCE_THRESHOLDS.standard.warning) {
    generatedAlerts.push({
      id: 'alert-food-warn',
      type: 'warning',
      title: 'Food Stock Low',
      message: `Rations at ${food}%. Schedule Botanist harvest cycle.`,
      timestamp: now,
    });
  }

  // Radiation alerts (higher is dangerous)
  if (rad >= RESOURCE_THRESHOLDS.radiation.critical) {
    generatedAlerts.push({
      id: 'alert-rad-crit',
      type: 'critical',
      title: 'SEVERE SOLAR RADIATION HAZARD',
      message: `Cosmic exposure reached dangerous levels (${rad}%). Seek storm shelter!`,
      timestamp: now,
    });
  } else if (rad >= RESOURCE_THRESHOLDS.radiation.warning) {
    generatedAlerts.push({
      id: 'alert-rad-warn',
      type: 'warning',
      title: 'Elevated Radiation Alert',
      message: `External radiation spiked to ${rad}%. Prepare shelter protocol.`,
      timestamp: now,
    });
  }

  return generatedAlerts;
}
