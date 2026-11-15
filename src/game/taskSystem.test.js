import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateConsumption,
  applyConsumption,
  validatePowerAllocation,
  validateWaterAllocation,
} from './resourceManager.js';
import {
  isMissionFailed,
  isMissionCompleted,
  evaluateMissionStatus,
} from './missionRules.js';
import { initMission, advanceMission } from './missionEngine.js';
import { HABITAT_TASKS, getTasksForStation, TaskStatus } from './taskSystem.js';
import { INITIAL_RESOURCES, MissionStatus } from '../types/game.js';

test('1. Task System contains tasks for all 5 stations', () => {
  assert.equal(HABITAT_TASKS.length, 10, 'Should have 10 initial tasks across stations');
  
  const powerTasks = getTasksForStation('generator-control');
  const greenhouseTasks = getTasksForStation('hydroponics');
  const lifeSupportTasks = getTasksForStation('oxygen-control');
  const scienceTasks = getTasksForStation('research-workstation');
  const commandTasks = getTasksForStation('mission-console');

  assert.equal(powerTasks.length, 2, 'Power station should have 2 tasks');
  assert.equal(greenhouseTasks.length, 2, 'Greenhouse station should have 2 tasks');
  assert.equal(lifeSupportTasks.length, 2, 'Life support station should have 2 tasks');
  assert.equal(scienceTasks.length, 2, 'Science station should have 2 tasks');
  assert.equal(commandTasks.length, 2, 'Command station should have 2 tasks');

  // Verify all tasks have steps, explanations, and valid status
  for (const task of HABITAT_TASKS) {
    assert.ok(task.id, 'Task must have an id');
    assert.ok(task.title, 'Task must have a title');
    assert.ok(task.shortExplanation, 'Task must have an explanation');
    assert.ok(task.assignedRole, 'Task must have an assigned role');
    assert.ok(task.steps.length >= 3, `Task ${task.id} must have at least 3 procedural steps`);
    assert.equal(task.status, TaskStatus.AVAILABLE, 'Task must start as available');
    assert.ok(task.educationalTakeaway, 'Task must contain an educational takeaway');
  }
});

test('2. Water is tracked and consumed each Sol', () => {
  assert.equal(INITIAL_RESOURCES.water, 100, 'Initial water should be 100');

  // Single player consumption
  const delta1 = calculateConsumption(INITIAL_RESOURCES, 1);
  assert.equal(delta1.water, -4, 'Single crew base water drain should be -4%');
  assert.equal(delta1.oxygen, -5, 'Oxygen drain should be -5%');

  // Extra crew consumption (3 players: 1 base + 2 extra)
  const delta3 = calculateConsumption(INITIAL_RESOURCES, 3);
  assert.equal(delta3.water, -6, '3-crew water drain should be -4 + -2 = -6%');
  assert.equal(delta3.oxygen, -7, '3-crew oxygen drain should be -5 + -2 = -7%');

  const afterSol = applyConsumption(INITIAL_RESOURCES, delta1);
  assert.equal(afterSol.water, 96, 'Water should be 96 after 1 Sol');
});

test('3. Power allocation validation prevents over-allocation and enforces minimums', () => {
  // Over allocation: 40 + 30 + 25 + 15 = 110 > 100
  const overAlloc = validatePowerAllocation({
    lifeSupport: 40,
    greenhouse: 30,
    science: 25,
    aux: 15,
  }, 100);
  assert.equal(overAlloc.valid, false);
  assert.ok(overAlloc.error.includes('exceeds available generation capacity'));

  // Life support below emergency minimum (15 < 20)
  const starveLifeSupport = validatePowerAllocation({
    lifeSupport: 15,
    greenhouse: 25,
    science: 20,
    aux: 20,
  }, 100);
  assert.equal(starveLifeSupport.valid, false);
  assert.ok(starveLifeSupport.error.includes('at least 20 kW'));

  // Valid allocation
  const validAlloc = validatePowerAllocation({
    lifeSupport: 35,
    greenhouse: 25,
    science: 20,
    aux: 10,
  }, 95);
  assert.equal(validAlloc.valid, true);
  assert.equal(validAlloc.total, 90);
  assert.equal(validAlloc.remaining, 5);
  assert.equal(validAlloc.error, null);
});

test('4. Water allocation validation prevents negative or excessive use during drought', () => {
  assert.equal(validateWaterAllocation(-5, 80).valid, false);
  assert.equal(validateWaterAllocation(25, 10).valid, false); // Critical reserve <= 15
  assert.equal(validateWaterAllocation(20, 80).valid, true);
});

test('5. Mission failure evaluation includes water depletion', () => {
  assert.equal(isMissionFailed({ oxygen: 80, water: 0, power: 80, food: 80, radiation: 10 }), true);
  assert.equal(isMissionFailed({ oxygen: 80, water: 10, power: 80, food: 80, radiation: 10 }), false);
});

test('6. Sol progression loop applies consumption and evaluates completion/failure', () => {
  const mission = initMission({ roomCode: 'MARS01' });
  assert.equal(mission.round, 1);
  assert.equal(mission.status, MissionStatus.IN_PROGRESS);
  assert.equal(mission.resources.water, 100);

  // Advance 1 Sol
  const sol2 = advanceMission(mission);
  assert.equal(sol2.round, 2);
  assert.equal(sol2.status, MissionStatus.IN_PROGRESS);
  assert.equal(sol2.resources.water, 96);

  // Check 20-Sol completion rule
  assert.equal(isMissionCompleted(19, 20), false);
  assert.equal(isMissionCompleted(20, 20), true);

  const wonStatus = evaluateMissionStatus(
    { ...mission, round: 20, resources: { oxygen: 50, water: 40, power: 45, food: 50, radiation: 30 } },
    20
  );
  assert.equal(wonStatus, MissionStatus.COMPLETED);
});
