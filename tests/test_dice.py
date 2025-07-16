import pytest
from mcp_dice import roll


def test_deterministic_seed() -> None:
    result1 = roll("2d6+1", seed="test")
    result2 = roll("2d6+1", seed="test")
    assert result1.dice == result2.dice
    assert result1.total == result2.total


def test_keep_highest() -> None:
    result = roll("4d6kh3", seed="seed")
    assert len(result.dice) == 4
    assert len(result.used) == 3
    assert result.total == sum(sorted(result.dice, reverse=True)[:3])



def test_invalid_expression() -> None:
    with pytest.raises(ValueError):
        roll("bad")
