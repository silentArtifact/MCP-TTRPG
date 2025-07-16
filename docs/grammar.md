# Dice Expression Grammar

The dice roller accepts a variant of standard tabletop dice notation. Expressions are evaluated left to right and may be nested with parentheses. Whitespace is ignored and lines may contain trailing `//` comments.

```
EXPR      ::= TERM ( ("+" | "-") TERM )*
TERM      ::= FACTOR ("d" FACTOR)?
FACTOR    ::= NUMBER | GROUP
GROUP     ::= "(" EXPR ")"
NUMBER    ::= [0-9]+
```

When rolling dice (`NdX`), optional suffixes modify the roll:

```
ROLL      ::= NUMBER "d" NUMBER MODIFIERS?
MODIFIERS ::= (KEEPDROP | EXPLODE | REROLL)*
KEEPDROP  ::= ("kh"|"kl"|"dh"|"dl") NUMBER
EXPLODE   ::= "!"
REROLL    ::= "r<" NUMBER | "r>" NUMBER
```

- `khN` / `klN` – keep the highest or lowest N dice
- `dhN` / `dlN` – drop the highest or lowest N dice
- `!` – exploding dice; roll again and add while the die shows its maximum value
- `r<N` / `r>N` – reroll once if the die is below/above the threshold

### Examples

- `4d6kh3` – roll four six-sided dice and keep the best three
- `2d20kl1!` – roll two d20, keep the lowest one, and explode on 20s
- `5d10r<3dl1` – roll five d10, reroll any results under 3 once, then drop the lowest die
- `(2d6+1)d4` – nest expressions: roll two d6 plus one, then roll that many d4
- `3d6 // ability score` – comments after `//` are ignored
