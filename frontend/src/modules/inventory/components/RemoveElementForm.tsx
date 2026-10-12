import { AlertError } from "@/components/AlertError"
import { RevisionConflictAlert } from "@/components/RevisionConflictAlert"
import { elementClassesApi, removalCausesApi } from "@/modules/catalogs/api/catalogs"
import { CatalogSelect } from "@/modules/catalogs/components/CatalogSelect"
import { transformErrorsForForm, translateApiError } from "@/utils"
import { isRevisionConflict } from "@/utils/tracking"
import { ApiError } from "@inmagik/react-crud/dist/crud/utils"
import { Button, Group, Loader, Stack, Text, Textarea } from "@mantine/core"
import { DateInput } from "@mantine/dates"
import { useForm } from "@mantine/form"
import dayjs from "dayjs"
import { yupResolver } from "mantine-form-yup-resolver"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import * as yup from "yup"
import { useElement, useRemoveElement } from "../api/elements"
import type { Element } from "../types"

type FormValues = {
  removed_on: string | null
  removal_cause: string | null
  reason: string
}

type Props = {
  element: Element
  onDone: () => void
  /** Reload the element after a revision conflict; the parent remounts the form with the new values. */
  onReload: () => void
}

function RemovalForm({ element, onDone, onReload }: Props) {
  const { t } = useTranslation()
  const [isLoading, setIsLoading] = useState(false)
  const [conflict, setConflict] = useState(false)
  const { mutateAsync: removeElement } = useRemoveElement()
  // The class says whether the element counts as a tree, which needs the cause; the server checks it again.
  const { data: elementClass } = elementClassesApi.useEntry(element.element_class)
  const causeRequired = !!elementClass?.counts_as_tree
  const today = dayjs().format("YYYY-MM-DD")
  const schema = yup.object({
    removed_on: yup
      .string()
      .nullable()
      .required()
      .test("not-future", t("inventory.validation.removedOnFuture"), (value) => !value || value <= today)
      .label(t("inventory.fields.removedOn")),
    removal_cause: causeRequired
      ? yup.string().nullable().required().label(t("inventory.fields.removalCause"))
      : yup.string().nullable(),
  })
  const form = useForm<FormValues>({
    mode: "controlled",
    initialValues: {
      removed_on: element.removed_on ?? today,
      removal_cause: element.removal_cause,
      reason: "",
    },
    validate: yupResolver(schema),
  })

  return (
    <form
      onSubmit={form.onSubmit(async (values) => {
        setIsLoading(true)
        try {
          await removeElement({
            id: element.id,
            revision: element.revision,
            removed_on: values.removed_on!,
            removal_cause: values.removal_cause,
            reason: values.reason.trim(),
          })
          onDone()
        } catch (error) {
          if (isRevisionConflict(error)) {
            setConflict(true)
          } else {
            form.setErrors(
              error instanceof ApiError
                ? transformErrorsForForm(error.data)
                : { non_field_errors: t("common.unexpectedError") }
            )
          }
        } finally {
          setIsLoading(false)
        }
      })}
    >
      <Stack gap="sm">
        {!element.removed_on && (
          <Text size="sm" c="dimmed">
            {t("inventory.removeDescription")}
          </Text>
        )}
        {conflict && <RevisionConflictAlert onReload={onReload} />}
        {form.errors.non_field_errors && (
          <AlertError title={t("inventory.removeError")} message={form.errors.non_field_errors.toString()} />
        )}
        <DateInput
          withAsterisk
          label={t("inventory.fields.removedOn")}
          valueFormat="DD/MM/YYYY"
          maxDate={today}
          {...form.getInputProps("removed_on")}
        />
        <CatalogSelect
          api={removalCausesApi}
          withAsterisk={causeRequired}
          clearable={!causeRequired}
          label={t("inventory.fields.removalCause")}
          value={form.values.removal_cause}
          onChange={(value) => form.setFieldValue("removal_cause", value)}
          error={form.errors.removal_cause}
        />
        <Textarea
          label={t("inventory.fields.reason")}
          description={t("inventory.fields.reasonDescription")}
          autosize
          minRows={2}
          {...form.getInputProps("reason")}
        />
        <Group justify="flex-end" pt="sm">
          <Button type="submit" loading={isLoading} color={element.removed_on ? undefined : "red"}>
            {t(element.removed_on ? "common.save" : "inventory.remove")}
          </Button>
        </Group>
      </Stack>
    </form>
  )
}

/**
 * The removal of an element (EL-7): the date, not in the future, and the cause, required for the trees. On a removed
 * element the form corrects date and cause. Like the edit in a modal, it loads the current element: it starts from its
 * removal and sends its revision, so it does not overwrite a removal changed meanwhile.
 */
export function RemoveElementForm({ id, onDone }: { id: string; onDone: () => void }) {
  const { t } = useTranslation()
  const { data: element, error, refetch } = useElement(id)

  if (error) {
    return <AlertError title={t("common.errorTitle")} message={translateApiError(error, t("common.unexpectedError"))} />
  }
  if (!element) {
    return (
      <Group justify="center" py="xl">
        <Loader />
      </Group>
    )
  }
  // A new revision, after a reload, starts the form again with its values.
  return <RemovalForm key={element.revision} element={element} onDone={onDone} onReload={() => refetch()} />
}
