import { randomInt } from 'crypto';

// Token types for lexer
type TokenType =
  | 'NUMBER'
  | 'PLUS'
  | 'MINUS'
  | 'DICE'
  | 'LPAREN'
  | 'RPAREN'
  | 'KEEP_HIGH'
  | 'KEEP_LOW'
  | 'DROP_HIGH'
  | 'DROP_LOW'
  | 'EXPLODE'
  | 'REROLL_LESS'
  | 'REROLL_GREATER'
  | 'EOF';

interface Token {
  type: TokenType;
  value?: number;
  raw?: string;
}

// AST Node types
interface ExprNode {
  type: 'binary' | 'dice' | 'number';
}

interface BinaryNode extends ExprNode {
  type: 'binary';
  operator: '+' | '-';
  left: ExprNode;
  right: ExprNode;
}

interface DiceNode extends ExprNode {
  type: 'dice';
  count: ExprNode;
  sides: ExprNode;
  modifiers: DiceModifier[];
}

interface NumberNode extends ExprNode {
  type: 'number';
  value: number;
}

interface DiceModifier {
  type: 'kh' | 'kl' | 'dh' | 'dl' | 'explode' | 'reroll';
  value?: number;
  threshold?: number;
  comparison?: '<' | '>';
}

interface RollDetail {
  total: number;
  rolls: number[];
  detail: string;
  breakdown?: string[];
}

// Tokenizer/Lexer
class Lexer {
  private input: string;
  private pos: number = 0;

  constructor(input: string) {
    // Remove comments (// to end of line)
    this.input = input.replace(/\/\/.*$/gm, '').replace(/\s+/g, '');
  }

  private peek(): string {
    return this.input[this.pos] || '';
  }

  private advance(): string {
    return this.input[this.pos++] || '';
  }

  private readNumber(): number {
    let num = '';
    while (/\d/.test(this.peek())) {
      num += this.advance();
    }
    return parseInt(num, 10);
  }

  nextToken(): Token {
    if (this.pos >= this.input.length) {
      return { type: 'EOF' };
    }

    const char = this.peek();

    // Numbers
    if (/\d/.test(char)) {
      const value = this.readNumber();
      return { type: 'NUMBER', value };
    }

    // Single character tokens
    switch (char) {
      case '+':
        this.advance();
        return { type: 'PLUS' };
      case '-':
        this.advance();
        return { type: 'MINUS' };
      case '(':
        this.advance();
        return { type: 'LPAREN' };
      case ')':
        this.advance();
        return { type: 'RPAREN' };
      case '!':
        this.advance();
        return { type: 'EXPLODE' };
    }

    // Check for multi-character tokens
    const lowerChar = char.toLowerCase();

    // Check for 'd' - could be DICE, DROP_HIGH, or DROP_LOW
    if (lowerChar === 'd') {
      const nextChar = this.input[this.pos + 1];
      if (nextChar && nextChar.toLowerCase() === 'h') {
        this.advance(); // consume 'd'
        this.advance(); // consume 'h'
        return { type: 'DROP_HIGH' };
      } else if (nextChar && nextChar.toLowerCase() === 'l') {
        this.advance(); // consume 'd'
        this.advance(); // consume 'l'
        return { type: 'DROP_LOW' };
      } else {
        this.advance(); // consume 'd'
        return { type: 'DICE' };
      }
    }

    // Check for 'k' - KEEP_HIGH or KEEP_LOW
    if (lowerChar === 'k') {
      this.advance();
      const keepType = this.advance().toLowerCase();
      if (keepType === 'h') {
        return { type: 'KEEP_HIGH' };
      } else if (keepType === 'l') {
        return { type: 'KEEP_LOW' };
      }
      throw new Error(`Invalid keep modifier: k${keepType}`);
    }

    // Check for 'r' - reroll
    if (lowerChar === 'r') {
      this.advance();
      const comparison = this.peek();
      if (comparison === '<') {
        this.advance();
        return { type: 'REROLL_LESS' };
      } else if (comparison === '>') {
        this.advance();
        return { type: 'REROLL_GREATER' };
      }
      throw new Error(`Invalid reroll modifier: r${comparison}`);
    }

    throw new Error(`Unexpected character: ${char}`);
  }

  peekToken(): Token {
    const saved = this.pos;
    const token = this.nextToken();
    this.pos = saved;
    return token;
  }
}

// Parser
class Parser {
  private lexer: Lexer;
  private currentToken: Token;

  constructor(input: string) {
    this.lexer = new Lexer(input);
    this.currentToken = this.lexer.nextToken();
  }

  private eat(type: TokenType): Token {
    if (this.currentToken.type !== type) {
      throw new Error(`Expected ${type} but got ${this.currentToken.type}`);
    }
    const token = this.currentToken;
    this.currentToken = this.lexer.nextToken();
    return token;
  }

  private peek(): TokenType {
    return this.currentToken.type;
  }

  // EXPR ::= TERM ( ("+" | "-") TERM )*
  parseExpression(): ExprNode {
    let node = this.parseTerm();

    while (this.peek() === 'PLUS' || this.peek() === 'MINUS') {
      const op = this.peek() === 'PLUS' ? '+' : '-';
      this.eat(this.peek());
      const right = this.parseTerm();
      node = {
        type: 'binary',
        operator: op,
        left: node,
        right: right
      } as BinaryNode;
    }

    return node;
  }

  // TERM ::= FACTOR ("d" FACTOR MODIFIERS?)?
  private parseTerm(): ExprNode {
    let node = this.parseFactor();

    if (this.peek() === 'DICE') {
      this.eat('DICE');
      const sides = this.parseFactor();
      const modifiers = this.parseModifiers();

      return {
        type: 'dice',
        count: node,
        sides: sides,
        modifiers: modifiers
      } as DiceNode;
    }

    return node;
  }

  // FACTOR ::= NUMBER | GROUP
  private parseFactor(): ExprNode {
    if (this.peek() === 'NUMBER') {
      const token = this.eat('NUMBER');
      return {
        type: 'number',
        value: token.value!
      } as NumberNode;
    }

    if (this.peek() === 'LPAREN') {
      this.eat('LPAREN');
      const node = this.parseExpression();
      this.eat('RPAREN');
      return node;
    }

    // Handle implicit 1 in "d20"
    if (this.peek() === 'DICE') {
      return {
        type: 'number',
        value: 1
      } as NumberNode;
    }

    throw new Error(`Unexpected token: ${this.peek()}`);
  }

  // MODIFIERS ::= (KEEPDROP | EXPLODE | REROLL)*
  private parseModifiers(): DiceModifier[] {
    const modifiers: DiceModifier[] = [];

    while (true) {
      const tokenType = this.peek();

      if (tokenType === 'KEEP_HIGH') {
        this.eat('KEEP_HIGH');
        const value = this.eat('NUMBER').value!;
        modifiers.push({ type: 'kh', value });
      } else if (tokenType === 'KEEP_LOW') {
        this.eat('KEEP_LOW');
        const value = this.eat('NUMBER').value!;
        modifiers.push({ type: 'kl', value });
      } else if (tokenType === 'DROP_HIGH') {
        this.eat('DROP_HIGH');
        const value = this.eat('NUMBER').value!;
        modifiers.push({ type: 'dh', value });
      } else if (tokenType === 'DROP_LOW') {
        this.eat('DROP_LOW');
        const value = this.eat('NUMBER').value!;
        modifiers.push({ type: 'dl', value });
      } else if (tokenType === 'EXPLODE') {
        this.eat('EXPLODE');
        modifiers.push({ type: 'explode' });
      } else if (tokenType === 'REROLL_LESS') {
        this.eat('REROLL_LESS');
        const threshold = this.eat('NUMBER').value!;
        modifiers.push({ type: 'reroll', comparison: '<', threshold });
      } else if (tokenType === 'REROLL_GREATER') {
        this.eat('REROLL_GREATER');
        const threshold = this.eat('NUMBER').value!;
        modifiers.push({ type: 'reroll', comparison: '>', threshold });
      } else {
        break;
      }
    }

    return modifiers;
  }

  parse(): ExprNode {
    const ast = this.parseExpression();
    this.eat('EOF');
    return ast;
  }
}

// Evaluator
class Evaluator {
  private breakdown: string[] = [];

  evaluate(node: ExprNode): number {
    this.breakdown = [];
    return this.evaluateNode(node);
  }

  getBreakdown(): string[] {
    return this.breakdown;
  }

  private evaluateNode(node: ExprNode): number {
    if (node.type === 'number') {
      return (node as NumberNode).value;
    }

    if (node.type === 'binary') {
      const binaryNode = node as BinaryNode;
      const left = this.evaluateNode(binaryNode.left);
      const right = this.evaluateNode(binaryNode.right);

      if (binaryNode.operator === '+') {
        return left + right;
      } else {
        return left - right;
      }
    }

    if (node.type === 'dice') {
      return this.evaluateDice(node as DiceNode);
    }

    throw new Error(`Unknown node type: ${(node as any).type}`);
  }

  private evaluateDice(node: DiceNode): number {
    const count = this.evaluateNode(node.count);
    const sides = this.evaluateNode(node.sides);

    // Validation
    if (count < 1 || count > 1000) {
      throw new Error(`Invalid dice count: ${count} (must be 1-1000)`);
    }
    if (sides < 2 || sides > 10000) {
      throw new Error(`Invalid dice sides: ${sides} (must be 2-10000)`);
    }

    // Roll initial dice
    let rolls: number[] = [];
    for (let i = 0; i < count; i++) {
      rolls.push(randomInt(1, sides + 1));
    }

    const originalRolls = [...rolls];

    // Apply modifiers in order
    for (const modifier of node.modifiers) {
      if (modifier.type === 'reroll') {
        rolls = this.applyReroll(rolls, sides, modifier);
      } else if (modifier.type === 'explode') {
        rolls = this.applyExplode(rolls, sides);
      }
    }

    // Apply keep/drop modifiers (these filter the array)
    let keptRolls = [...rolls];
    for (const modifier of node.modifiers) {
      if (modifier.type === 'kh') {
        keptRolls = this.keepHighest(keptRolls, modifier.value!);
      } else if (modifier.type === 'kl') {
        keptRolls = this.keepLowest(keptRolls, modifier.value!);
      } else if (modifier.type === 'dh') {
        keptRolls = this.dropHighest(keptRolls, modifier.value!);
      } else if (modifier.type === 'dl') {
        keptRolls = this.dropLowest(keptRolls, modifier.value!);
      }
    }

    const total = keptRolls.reduce((sum, die) => sum + die, 0);

    // Build breakdown string
    let breakdownStr = `${count}d${sides}`;
    if (node.modifiers.length > 0) {
      breakdownStr += node.modifiers.map(m => this.modifierToString(m)).join('');
    }
    breakdownStr += `: [${originalRolls.join(', ')}]`;

    if (rolls.length !== originalRolls.length) {
      breakdownStr += ` → [${rolls.join(', ')}] (after modifiers)`;
    }

    if (keptRolls.length !== rolls.length) {
      breakdownStr += ` → [${keptRolls.join(', ')}] (kept)`;
    }

    breakdownStr += ` = ${total}`;
    this.breakdown.push(breakdownStr);

    return total;
  }

  private applyReroll(rolls: number[], sides: number, modifier: DiceModifier): number[] {
    const threshold = modifier.threshold!;
    const comparison = modifier.comparison!;

    return rolls.map(die => {
      if (comparison === '<' && die < threshold) {
        return randomInt(1, sides + 1);
      } else if (comparison === '>' && die > threshold) {
        return randomInt(1, sides + 1);
      }
      return die;
    });
  }

  private applyExplode(rolls: number[], sides: number): number[] {
    const result: number[] = [];
    const maxExplodes = 100; // Prevent infinite loops

    for (let roll of rolls) {
      result.push(roll);
      let explosions = 0;

      while (roll === sides && explosions < maxExplodes) {
        roll = randomInt(1, sides + 1);
        result.push(roll);
        explosions++;
      }
    }

    return result;
  }

  private keepHighest(rolls: number[], count: number): number[] {
    if (count >= rolls.length) return rolls;
    return [...rolls].sort((a, b) => b - a).slice(0, count);
  }

  private keepLowest(rolls: number[], count: number): number[] {
    if (count >= rolls.length) return rolls;
    return [...rolls].sort((a, b) => a - b).slice(0, count);
  }

  private dropHighest(rolls: number[], count: number): number[] {
    if (count >= rolls.length) return [];
    return [...rolls].sort((a, b) => b - a).slice(count);
  }

  private dropLowest(rolls: number[], count: number): number[] {
    if (count >= rolls.length) return [];
    return [...rolls].sort((a, b) => a - b).slice(count);
  }

  private modifierToString(modifier: DiceModifier): string {
    switch (modifier.type) {
      case 'kh': return `kh${modifier.value}`;
      case 'kl': return `kl${modifier.value}`;
      case 'dh': return `dh${modifier.value}`;
      case 'dl': return `dl${modifier.value}`;
      case 'explode': return '!';
      case 'reroll': return `r${modifier.comparison}${modifier.threshold}`;
      default: return '';
    }
  }
}

// Public API
export interface DiceRollResult {
  total: number;
  detail: string;
  breakdown: string[];
}

export function rollDice(expression: string): DiceRollResult {
  try {
    const parser = new Parser(expression);
    const ast = parser.parse();
    const evaluator = new Evaluator();
    const total = evaluator.evaluate(ast);

    return {
      total,
      detail: `Rolled ${expression} = ${total}`,
      breakdown: evaluator.getBreakdown()
    };
  } catch (error) {
    throw new Error(`Failed to parse dice expression "${expression}": ${(error as Error).message}`);
  }
}

// Support for advantage/disadvantage (D&D 5e style)
export type Advantage = 'adv' | 'dis' | null;

export function rollWithAdvantage(notation: string, advantage: Advantage): DiceRollResult {
  // Parse to check if it's a d20 roll
  const match = notation.replace(/\s+/g, '').match(/^(\d*)d(\d+)([+-]\d+)?$/i);

  if (!match) {
    // Complex expression, just roll normally
    return rollDice(notation);
  }

  const count = parseInt(match[1] || '1', 10);
  const sides = parseInt(match[2], 10);
  const modifier = match[3] || '';

  // Only apply advantage/disadvantage to single d20 rolls
  if (advantage && count === 1 && sides === 20) {
    const expression = advantage === 'adv'
      ? `2d20kh1${modifier}`
      : `2d20kl1${modifier}`;

    const result = rollDice(expression);
    result.detail = `Rolled 1d20${modifier} with ${advantage === 'adv' ? 'advantage' : 'disadvantage'} = ${result.total}`;
    return result;
  }

  // Normal roll
  return rollDice(notation);
}
