import it from "./it"

// Italian is the reference language: the shape of the other languages, when added,
// is derived from it (frontend.md §6).
export type TranslationShape<T> = {
  [Key in keyof T]: T[Key] extends string ? string : TranslationShape<T[Key]>
}

export const resources = {
  it: { translation: it },
} as const
