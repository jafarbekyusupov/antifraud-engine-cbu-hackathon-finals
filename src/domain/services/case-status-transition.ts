import { CaseStatus } from '../../application/ports/case.repository';

const allowedTransitions: Readonly<Record<CaseStatus, readonly CaseStatus[]>> = {
  OPEN: ['INVESTIGATING', 'CONFIRMED', 'FALSE_POSITIVE', 'CLOSED'],
  INVESTIGATING: ['CONFIRMED', 'FALSE_POSITIVE', 'CLOSED'],
  CONFIRMED: ['CLOSED'],
  FALSE_POSITIVE: ['CLOSED'],
  CLOSED: [],
};

export function canTransitionCase(from: CaseStatus, to: CaseStatus): boolean {
  return from === to || allowedTransitions[from].includes(to);
}
