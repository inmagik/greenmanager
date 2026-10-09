import type { TFunction } from "i18next"

export function translateKey(t: TFunction, source: string) {
  return source.includes(".") ? t(source) : source
}
