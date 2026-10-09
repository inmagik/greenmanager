import { ApiError } from "@inmagik/react-crud/dist/crud/utils"
import { Alert, Text } from "@mantine/core"
import { modals } from "@mantine/modals"
import { notifications } from "@mantine/notifications"
import i18n from "@/i18n"

export function uniqBy<T>(array: T[], keyFn: (item: T) => unknown): T[] {
  const seen = new Set()
  return array.filter((item) => {
    const key = keyFn(item)
    if (seen.has(key)) {
      return false
    }
    seen.add(key)
    return true
  })
}

export function requestConfirmation(
  title: string,
  heading: React.ReactNode,
  message: React.ReactNode
): Promise<boolean> {
  return new Promise((resolve) => {
    modals.openConfirmModal({
      title: title,
      children: (
        <Alert
          color="red"
          title={
            <Text size="sm" c="red.9">
              {heading}
            </Text>
          }
        >
          <Text size="sm">{message}</Text>
        </Alert>
      ),
      labels: { confirm: i18n.t("common.confirm"), cancel: i18n.t("common.cancel") },
      confirmProps: { color: "red.9" },
      cancelProps: { color: "gray", variant: "subtle" },
      onCancel: () => resolve(false),
      onConfirm: () => resolve(true),
    })
  })
}

type ApiErrorPayload = {
  code: string
  params?: Record<string, unknown>
  detail?: unknown
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function isApiErrorPayload(value: unknown): value is ApiErrorPayload {
  return isRecord(value) && typeof value.code === "string"
}

function legacyErrorMessage(value: unknown): string | null {
  if (typeof value === "string") return value
  if (Array.isArray(value)) {
    const messages = value.flatMap((item) => legacyErrorMessage(item) ?? [])
    return messages.length ? messages.join(" ") : null
  }
  if (isRecord(value) && "detail" in value) return legacyErrorMessage(value.detail)
  return null
}

const legacyServerErrorTranslations: Record<string, string> = {
  "A tenant is required.": "serverErrors.tenant_required",
  "Tenant not found.": "serverErrors.tenant_not_found",
  "User already has a default tenant.": "serverErrors.user_already_has_default_tenant",
  "User is not associated with this tenant.": "serverErrors.user_not_associated_with_tenant",
}

export function translateApiError(value: unknown, fallback: string): string {
  if (isRecord(value) && "data" in value) {
    return translateApiError(value.data, fallback)
  }
  if (value instanceof Error && value.message) {
    return value.message
  }
  if (isApiErrorPayload(value)) {
    const translationKey = `serverErrors.${value.code}`
    if (i18n.exists(translationKey)) {
      return i18n.t(translationKey, isRecord(value.params) ? value.params : {})
    }
  }
  const legacyMessage = legacyErrorMessage(value)
  if (legacyMessage) {
    const translationKey = legacyServerErrorTranslations[legacyMessage]
    if (translationKey && i18n.exists(translationKey)) {
      return i18n.t(translationKey)
    }
  }
  return legacyMessage ?? fallback
}

export function transformErrorsForForm(errors: unknown): Record<string, string> {
  const formErrors: Record<string, string> = {}

  function formatErrorValue(value: unknown): string {
    if (isApiErrorPayload(value)) return translateApiError(value, legacyErrorMessage(value) ?? i18n.t("common.unexpectedError"))
    if (Array.isArray(value)) {
      return value.map((item) => formatErrorValue(item)).join(" ")
    }
    return String(value)
  }

  function addErrors(value: unknown, path: string) {
    if (Array.isArray(value)) {
      if (value.every((item) => typeof item !== "object" || item === null || isApiErrorPayload(item))) {
        formErrors[path || "non_field_errors"] = formatErrorValue(value)
        return
      }
      const hasNestedErrors = value.some((item) => typeof item === "object" && item !== null)
      if (!hasNestedErrors) {
        formErrors[path] = formatErrorValue(value)
        return
      }

      value.forEach((item, index) => {
        if (typeof item === "object" && item !== null) {
          addErrors(item, `${path}.${index}`)
        } else {
          formErrors[`${path}.${index}`] = formatErrorValue(item)
        }
      })
      return
    }

    if (typeof value === "object" && value !== null) {
      if (isApiErrorPayload(value)) {
        formErrors[path || "non_field_errors"] = formatErrorValue(value)
        return
      }
      for (const key in value) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const nestedValue = (value as any)[key]
        const nextPath = path ? `${path}.${key}` : key

        if (key === "detail" || key === "non_field_errors" || key === "__all__") {
          formErrors[path || "non_field_errors"] = formatErrorValue(nestedValue)
          continue
        }

        addErrors(nestedValue, nextPath)
      }
      return
    }

    formErrors[path] = formatErrorValue(value)
  }

  if (typeof errors === "string") {
    formErrors.non_field_errors = errors
    return formErrors
  }

  if (Array.isArray(errors)) {
    formErrors.non_field_errors = errors.join(" ")
    return formErrors
  }

  if (typeof errors === "object" && errors !== null) {
    addErrors(errors, "")
  }
  return formErrors
}

/**
 * Message of an error of the API, translated: the payload can be a code at the
 * top level or errors of the fields, as in forms.
 */
export function apiErrorMessage(error: unknown, fallback = i18n.t("common.unexpectedError")): string {
  if (!(error instanceof ApiError)) return fallback
  const messages = Object.values(transformErrorsForForm(error.data)).filter(Boolean)
  return messages.length ? messages.join(" ") : fallback
}

/** Show a failed action of the API, for actions outside forms (menus, confirmations). */
export function notifyApiError(error: unknown, title = i18n.t("common.actionFailed")) {
  notifications.show({ title, message: apiErrorMessage(error), color: "red" })
}

/**
 * Errors of the API for a form: the errors of its fields, and one message for the
 * rest (errors of other fields or of the whole request, or a generic error).
 */
export function splitApiErrors(
  error: unknown,
  fields: string[]
): { fieldErrors: Record<string, string>; message: string | null; errors: Record<string, string> } {
  if (!(error instanceof ApiError)) {
    return { fieldErrors: {}, message: i18n.t("common.unexpectedError"), errors: {} }
  }
  const errors = transformErrorsForForm(error.data)
  const fieldErrors: Record<string, string> = {}
  const other: string[] = []
  for (const [key, value] of Object.entries(errors)) {
    if (fields.includes(key)) fieldErrors[key] = value
    else other.push(value)
  }
  const hasFieldErrors = Object.keys(fieldErrors).length > 0
  const message = other.length ? other.join(" ") : hasFieldErrors ? null : i18n.t("common.unexpectedError")
  return { fieldErrors, message, errors }
}
