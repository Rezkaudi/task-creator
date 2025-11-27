import { ConstraintType } from '../../shared/types/node-types';

/**
 * Constraints entity for node positioning
 */
export interface Constraints {
  readonly horizontal: ConstraintType;
  readonly vertical: ConstraintType;
}

/**
 * Default constraints
 */
export const DefaultConstraints: Constraints = {
  horizontal: 'MIN',
  vertical: 'MIN',
};

/**
 * Check if constraints are default
 */
export function isDefaultConstraints(constraints: Constraints): boolean {
  return (
    constraints.horizontal === DefaultConstraints.horizontal &&
    constraints.vertical === DefaultConstraints.vertical
  );
}
