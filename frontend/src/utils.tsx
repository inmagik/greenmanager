import { Alert, Text } from "@mantine/core"
import { modals } from "@mantine/modals"
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
  "Selected time series does not belong to current tenant.":
    "serverErrors.selected_time_series_not_belong_to_current_tenant",
  "Feature not found in this dataset.": "serverErrors.feature_not_found_in_dataset",
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
