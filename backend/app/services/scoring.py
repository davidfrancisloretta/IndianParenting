from app.models import Chore, ChoreType


def calculate_points(chore: Chore, value: int | None) -> tuple[int, int | None]:
    if chore.type == ChoreType.BOOLEAN:
        approved_value = 1 if value is None else min(value, 1)
        return (chore.fixed_points if approved_value else 0, approved_value)

    if chore.type == ChoreType.SCORE:
        max_score = chore.max_score if chore.max_score is not None else 2
        approved_value = max(0, min(value or 0, max_score))
        return approved_value * chore.score_multiplier, approved_value

    minutes = value if value is not None else chore.duration_minutes or 0
    approved_value = max(0, minutes)
    return approved_value // chore.minutes_per_point, approved_value
