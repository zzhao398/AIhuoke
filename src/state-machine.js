/**
 * State Machine for managing conversation stages
 * Stages: GREET → QUALIFY → PROOF
 */

const STAGES = {
  GREET: 'GREET',
  QUALIFY: 'QUALIFY',
  PROOF: 'PROOF',
};

const STAGE_CONFIG = {
  GREET: {
    name: 'GREET',
    description: 'Initial contact - gather basic intent',
    required_fields: ['destination_country', 'qty_bucket'],
    optional_fields: ['destination_port'],
    max_turns: 3,
    next_stage: 'QUALIFY',
  },
  QUALIFY: {
    name: 'QUALIFY',
    description: 'Deep qualification',
    required_fields: ['company_name', 'buyer_type'],
    optional_fields: ['timeline', 'budget_indication'],
    max_turns: 4,
    next_stage: 'PROOF',
  },
  PROOF: {
    name: 'PROOF',
    description: 'Verify legitimacy and readiness',
    required_fields: ['contact_method'],
    optional_fields: [],
    max_turns: 3,
    next_stage: null, // Final stage
  },
};

/**
 * Get stage configuration
 */
export function getStageConfig(stage) {
  return STAGE_CONFIG[stage] || STAGE_CONFIG.GREET;
}

/**
 * Check if required fields for a stage are complete
 */
export function isStageComplete(stage, leadData) {
  const config = STAGE_CONFIG[stage];
  if (!config) return false;

  return config.required_fields.every(field => {
    const value = leadData[field];
    return value && value.trim() !== '';
  });
}

/**
 * Check if stage should advance
 * Returns: { shouldAdvance: boolean, reason: string, nextStage: string|null }
 */
export function shouldAdvanceStage(session) {
  const currentStage = session.stage || 'GREET';
  const config = STAGE_CONFIG[currentStage];

  if (!config) {
    return { shouldAdvance: false, reason: 'Invalid stage', nextStage: null };
  }

  // Count turns in current stage
  const turnsInStage = countTurnsInStage(session, currentStage);

  // Check if required fields are complete
  const isComplete = isStageComplete(currentStage, session.lead_data);

  // Advance if fields complete
  if (isComplete) {
    return {
      shouldAdvance: true,
      reason: 'Required fields complete',
      nextStage: config.next_stage,
    };
  }

  // Force advance if max turns reached (with incomplete data)
  if (turnsInStage >= config.max_turns) {
    return {
      shouldAdvance: true,
      reason: 'Max turns reached',
      nextStage: config.next_stage,
    };
  }

  return {
    shouldAdvance: false,
    reason: 'Continue current stage',
    nextStage: null,
  };
}

/**
 * Count how many conversation turns have happened in the current stage
 */
function countTurnsInStage(session, stage) {
  // Use the session's stage turn counter
  return session.stage_turn_count || 0;
}

/**
 * Get missing required fields for current stage
 */
export function getMissingFields(stage, leadData) {
  const config = STAGE_CONFIG[stage];
  if (!config) return [];

  return config.required_fields.filter(field => {
    const value = leadData[field];
    return !value || value.trim() === '';
  });
}

/**
 * Get completion percentage for current stage
 */
export function getStageProgress(stage, leadData) {
  const config = STAGE_CONFIG[stage];
  if (!config || config.required_fields.length === 0) return 100;

  const completed = config.required_fields.filter(field => {
    const value = leadData[field];
    return value && value.trim() !== '';
  }).length;

  return Math.round((completed / config.required_fields.length) * 100);
}

/**
 * Determine if conversation is complete (all stages done)
 */
export function isConversationComplete(session) {
  return session.stage === 'PROOF' && isStageComplete('PROOF', session.lead_data);
}

/**
 * Get guidance for Claude based on current stage
 */
export function getStageGuidance(stage, leadData) {
  const config = STAGE_CONFIG[stage];
  const missing = getMissingFields(stage, leadData);
  const progress = getStageProgress(stage, leadData);

  return {
    stage: stage,
    description: config.description,
    required_fields: config.required_fields,
    missing_fields: missing,
    progress: progress,
    guidance: generateGuidanceText(stage, missing, progress),
  };
}

/**
 * Generate helpful guidance text for Claude
 */
function generateGuidanceText(stage, missingFields, progress) {
  const config = STAGE_CONFIG[stage];

  if (missingFields.length === 0) {
    return `Stage ${stage} complete (${progress}%). Ready to advance to ${config.next_stage || 'completion'}.`;
  }

  const fieldsList = missingFields.join(', ');
  return `Stage ${stage} at ${progress}%. Still need: ${fieldsList}. Ask naturally about these in your next question.`;
}

export default {
  STAGES,
  STAGE_CONFIG,
  getStageConfig,
  isStageComplete,
  shouldAdvanceStage,
  getMissingFields,
  getStageProgress,
  isConversationComplete,
  getStageGuidance,
};
