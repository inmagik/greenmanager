import type { i18n as I18n } from "i18next"
import { setLocale } from "yup"

export function setupYupLocale(i18n: I18n) {
  const message =
    (key: string) =>
    <Params extends object>(params: Params & { label?: string; path?: string }) =>
      i18n.t(`validation.${key}`, {
        ...params,
        field: params.label ?? params.path,
      } as Record<string, unknown>)

  setLocale({
    mixed: {
      default: message("invalid"),
      required: message("required"),
      defined: message("required"),
      notNull: message("required"),
      oneOf: message("oneOf"),
      notOneOf: message("notOneOf"),
    },
    string: {
      length: message("string.length"),
      min: message("string.min"),
      max: message("string.max"),
      email: message("string.email"),
      url: message("string.url"),
      uuid: message("string.uuid"),
      trim: message("string.trim"),
      lowercase: message("string.lowercase"),
      uppercase: message("string.uppercase"),
    },
    number: {
      min: message("number.min"),
      max: message("number.max"),
      lessThan: message("number.lessThan"),
      moreThan: message("number.moreThan"),
      positive: message("number.positive"),
      negative: message("number.negative"),
      integer: message("number.integer"),
    },
    date: {
      min: message("date.min"),
      max: message("date.max"),
    },
    array: {
      length: message("array.length"),
      min: message("array.min"),
      max: message("array.max"),
    },
    object: {
      noUnknown: message("object.noUnknown"),
    },
  })
}
