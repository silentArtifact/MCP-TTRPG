import { describe, expect, test } from 'vitest';
import { rollDice, rollWithAdvantage } from '../src/dice';

describe('Basic Dice Rolling', () => {
  test('simple dice roll: 2d6', () => {
    const result = rollDice('2d6');
    expect(result.total).toBeGreaterThanOrEqual(2);
    expect(result.total).toBeLessThanOrEqual(12);
    expect(result.breakdown).toHaveLength(1);
  });

  test('dice with modifier: 2d6+3', () => {
    const result = rollDice('2d6+3');
    expect(result.total).toBeGreaterThanOrEqual(5);
    expect(result.total).toBeLessThanOrEqual(15);
  });

  test('dice with negative modifier: 2d6-2', () => {
    const result = rollDice('2d6-2');
    expect(result.total).toBeGreaterThanOrEqual(0);
    expect(result.total).toBeLessThanOrEqual(10);
  });

  test('single die: d20', () => {
    const result = rollDice('d20');
    expect(result.total).toBeGreaterThanOrEqual(1);
    expect(result.total).toBeLessThanOrEqual(20);
  });

  test('complex expression: 3d6+2d4+5', () => {
    const result = rollDice('3d6+2d4+5');
    expect(result.total).toBeGreaterThanOrEqual(10);
    expect(result.total).toBeLessThanOrEqual(31);
    expect(result.breakdown).toHaveLength(2); // Two dice groups
  });
});

describe('Keep/Drop Modifiers', () => {
  test('keep highest: 4d6kh3', () => {
    const result = rollDice('4d6kh3');
    expect(result.total).toBeGreaterThanOrEqual(3);
    expect(result.total).toBeLessThanOrEqual(18);
  });

  test('keep lowest: 4d6kl3', () => {
    const result = rollDice('4d6kl3');
    expect(result.total).toBeGreaterThanOrEqual(3);
    expect(result.total).toBeLessThanOrEqual(18);
  });

  test('drop highest: 4d6dh1', () => {
    const result = rollDice('4d6dh1');
    expect(result.total).toBeGreaterThanOrEqual(3);
    expect(result.total).toBeLessThanOrEqual(18);
  });

  test('drop lowest: 4d6dl1', () => {
    const result = rollDice('4d6dl1');
    expect(result.total).toBeGreaterThanOrEqual(3);
    expect(result.total).toBeLessThanOrEqual(18);
  });

  test('keep highest with modifier: 4d6kh3+2', () => {
    const result = rollDice('4d6kh3+2');
    expect(result.total).toBeGreaterThanOrEqual(5);
    expect(result.total).toBeLessThanOrEqual(20);
  });
});

describe('Exploding Dice', () => {
  test('exploding d6', () => {
    const result = rollDice('1d6!');
    expect(result.total).toBeGreaterThanOrEqual(1);
    // Could be much higher due to explosions, but at least 1
  });

  test('exploding with modifier: d6!+2', () => {
    const result = rollDice('d6!+2');
    expect(result.total).toBeGreaterThanOrEqual(3);
  });
});

describe('Reroll Mechanics', () => {
  test('reroll less than: 4d6r<2', () => {
    const result = rollDice('4d6r<2');
    expect(result.total).toBeGreaterThanOrEqual(4);
    expect(result.total).toBeLessThanOrEqual(24);
  });

  test('reroll greater than: 2d6r>5', () => {
    const result = rollDice('2d6r>5');
    expect(result.total).toBeGreaterThanOrEqual(2);
    expect(result.total).toBeLessThanOrEqual(12);
  });

  test('reroll with keep: 4d6r<2kh3', () => {
    const result = rollDice('4d6r<2kh3');
    expect(result.total).toBeGreaterThanOrEqual(3);
    expect(result.total).toBeLessThanOrEqual(18);
  });
});

describe('Nested Expressions', () => {
  test('nested dice roll: (1d4)d6', () => {
    const result = rollDice('(1d4)d6');
    expect(result.total).toBeGreaterThanOrEqual(1);
    expect(result.total).toBeLessThanOrEqual(24); // 4d6 max
  });

  test('nested with addition: (2d6+1)d4', () => {
    const result = rollDice('(2d6+1)d4');
    expect(result.total).toBeGreaterThanOrEqual(3); // (2+1)d4 = 3d4 min
    expect(result.total).toBeLessThanOrEqual(52); // (12+1)d4 = 13d4 max
  });

  test('parentheses for grouping: (2d6+3)*2 simplified as (2d6+3)+(2d6+3)', () => {
    const result = rollDice('(2d6+3)+(2d6+3)');
    expect(result.total).toBeGreaterThanOrEqual(10);
    expect(result.total).toBeLessThanOrEqual(30);
  });
});

describe('Comment Support', () => {
  test('expression with comment', () => {
    const result = rollDice('3d6 // ability score');
    expect(result.total).toBeGreaterThanOrEqual(3);
    expect(result.total).toBeLessThanOrEqual(18);
  });

  test('expression with inline comment', () => {
    const result = rollDice('2d20kh1+5 // attack roll with advantage');
    expect(result.total).toBeGreaterThanOrEqual(6);
    expect(result.total).toBeLessThanOrEqual(25);
  });
});

describe('Advantage/Disadvantage', () => {
  test('advantage on d20', () => {
    const result = rollWithAdvantage('1d20', 'adv');
    expect(result.total).toBeGreaterThanOrEqual(1);
    expect(result.total).toBeLessThanOrEqual(20);
    expect(result.detail).toContain('advantage');
  });

  test('disadvantage on d20', () => {
    const result = rollWithAdvantage('1d20', 'dis');
    expect(result.total).toBeGreaterThanOrEqual(1);
    expect(result.total).toBeLessThanOrEqual(20);
    expect(result.detail).toContain('disadvantage');
  });

  test('advantage with modifier: d20+5', () => {
    const result = rollWithAdvantage('d20+5', 'adv');
    expect(result.total).toBeGreaterThanOrEqual(6);
    expect(result.total).toBeLessThanOrEqual(25);
  });

  test('advantage does not apply to non-d20', () => {
    const result = rollWithAdvantage('2d6', 'adv');
    expect(result.total).toBeGreaterThanOrEqual(2);
    expect(result.total).toBeLessThanOrEqual(12);
  });

  test('no advantage rolls normally', () => {
    const result = rollWithAdvantage('1d20+3', null);
    expect(result.total).toBeGreaterThanOrEqual(4);
    expect(result.total).toBeLessThanOrEqual(23);
  });
});

describe('Error Handling', () => {
  test('invalid expression throws error', () => {
    expect(() => rollDice('invalid')).toThrow();
  });

  test('missing dice sides throws error', () => {
    expect(() => rollDice('2d')).toThrow();
  });

  test('excessive dice count throws error', () => {
    expect(() => rollDice('10000d6')).toThrow('Invalid dice count');
  });

  test('excessive dice sides throws error', () => {
    expect(() => rollDice('1d99999')).toThrow('Invalid dice sides');
  });
});

describe('Complex Real-World Examples', () => {
  test('D&D ability score generation: 4d6kh3', () => {
    const result = rollDice('4d6kh3');
    expect(result.total).toBeGreaterThanOrEqual(3);
    expect(result.total).toBeLessThanOrEqual(18);
  });

  test('D&D Greatsword crit: 4d6+5', () => {
    const result = rollDice('4d6+5');
    expect(result.total).toBeGreaterThanOrEqual(9);
    expect(result.total).toBeLessThanOrEqual(29);
  });

  test('Shadowrun dice pool with explosions: 5d6!', () => {
    const result = rollDice('5d6!');
    expect(result.total).toBeGreaterThanOrEqual(5);
  });

  test('Great Weapon Fighting reroll: 2d6r<2', () => {
    const result = rollDice('2d6r<2');
    expect(result.total).toBeGreaterThanOrEqual(2);
    expect(result.total).toBeLessThanOrEqual(12);
  });

  test('Multiple attacks: 2d20kh1+5+3d6+3', () => {
    const result = rollDice('2d20kh1+5+3d6+3');
    expect(result.total).toBeGreaterThanOrEqual(11);
    expect(result.total).toBeLessThanOrEqual(46);
  });
});
