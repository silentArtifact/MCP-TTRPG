import { describe, expect, test } from 'vitest';
import { rollDice } from '../src/index';

describe('rollDice', () => {
  test('handles XdY with modifier', () => {
    const result = rollDice('2d6+3');
    expect(result.rolls).toHaveLength(2);
    expect(result.total).toBeGreaterThanOrEqual(5);
    expect(result.total).toBeLessThanOrEqual(15);
  });

  test('advantage', () => {
    const result = rollDice('1d20', 'adv');
    expect(result.rolls).toHaveLength(2);
    expect(result.total).toBeGreaterThanOrEqual(1);
    expect(result.total).toBeLessThanOrEqual(20);
  });

  test('disadvantage', () => {
    const result = rollDice('1d20', 'dis');
    expect(result.rolls).toHaveLength(2);
    expect(result.total).toBeGreaterThanOrEqual(1);
    expect(result.total).toBeLessThanOrEqual(20);
  });
});
