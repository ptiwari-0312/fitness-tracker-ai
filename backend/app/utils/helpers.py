"""Shared utility helpers."""
from datetime import date, datetime, timedelta


def today_str() -> str:
    return date.today().isoformat()


def week_start() -> str:
    today = date.today()
    return (today - timedelta(days=today.weekday())).isoformat()


def iso_now() -> str:
    return datetime.utcnow().isoformat()


def calculate_bmi(weight_kg: float, height_cm: float) -> float:
    height_m = height_cm / 100
    return round(weight_kg / (height_m ** 2), 1)


def bmi_category(bmi: float) -> str:
    if bmi < 18.5:
        return "Underweight"
    if bmi < 25.0:
        return "Normal weight"
    if bmi < 30.0:
        return "Overweight"
    return "Obese"
