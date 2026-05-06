def difficulty_tier_from_position(required_position: int | None) -> str | None:
    if required_position is None:
        return None
    if required_position >= 50_000:
        return "Free"
    if required_position >= 20_000:
        return "Easy"
    if required_position >= 5_000:
        return "Normal"
    if required_position >= 1_000:
        return "Hard"
    if required_position >= 250:
        return "Insane"
    return "Demon"
