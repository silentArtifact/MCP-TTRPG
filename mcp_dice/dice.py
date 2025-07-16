import random
import re
from dataclasses import dataclass
from typing import List, Optional


@dataclass
class RollResult:
    expression: str
    dice: List[int]
    used: List[int]
    modifier: int
    total: int
    seed: Optional[str] = None


def roll(expression: str, seed: Optional[str] = None) -> RollResult:
    """Roll dice based on a minimal NdM(+/-K) expression."""
    pattern = re.compile(r"^(\d+)d(\d+)(kh\d+|kl\d+)?([+-]\d+)?$")
    match = pattern.match(expression.replace(" ", ""))
    if not match:
        raise ValueError("Invalid expression")

    count = int(match.group(1))
    sides = int(match.group(2))
    keep_drop = match.group(3)
    modifier = int(match.group(4) or 0)

    rng = random.Random(seed)
    dice = [rng.randint(1, sides) for _ in range(count)]

    used = dice[:]
    if keep_drop:
        action = keep_drop[:2]
        num = int(keep_drop[2:])
        if action == "kh":
            used = sorted(dice, reverse=True)[:num]
        elif action == "kl":
            used = sorted(dice)[:num]

    total = sum(used) + modifier
    return RollResult(
        expression=expression,
        dice=dice,
        used=used,
        modifier=modifier,
        total=total,
        seed=seed,
    )
