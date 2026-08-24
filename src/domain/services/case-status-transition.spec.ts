import { canTransitionCase } from './case-status-transition';

describe('canTransitionCase', () => {
  it('allows an open case to enter investigation or a terminal outcome', () => {
    expect(canTransitionCase('OPEN', 'INVESTIGATING')).toBe(true);
    expect(canTransitionCase('OPEN', 'CONFIRMED')).toBe(true);
    expect(canTransitionCase('OPEN', 'FALSE_POSITIVE')).toBe(true);
  });

  it('does not reopen a terminal case', () => {
    expect(canTransitionCase('CLOSED', 'OPEN')).toBe(false);
    expect(canTransitionCase('CONFIRMED', 'INVESTIGATING')).toBe(false);
  });

  it('treats the current status as an idempotent update', () => {
    expect(canTransitionCase('INVESTIGATING', 'INVESTIGATING')).toBe(true);
  });
});
