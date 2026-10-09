export function numberOrFallback(value: unknown, fallback: number): number {
  return typeof value === "number" ? value : fallback
}

export function numberStringOrFallback(value: unknown, fallback: number): string {
  return numberOrFallback(value, fallback).toString()
}

export function numberArrayOrEmpty(value: unknown): number[] {
  return Array.isArray(value) ? value.filter((item): item is number => typeof item === "number") : []
}

export function toNullableNumber(value: unknown): number | null {
  if (value === "" || value === null || value === undefined) {
    return null
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null
  }

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}
