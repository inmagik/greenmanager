import { AlertError } from "@/components/AlertError"
import { elementClassesApi, removalCausesApi } from "@/modules/catalogs/api/catalogs"
import { CatalogSelect } from "@/modules/catalogs/components/CatalogSelect"
import { transformErrorsForForm } from "@/utils"
import { ApiError } from "@inmagik/react-crud/dist/crud/utils"
import { Button, Group, Stack, Text, Textarea } from "@mantine/core"
import { DateInput } from "@mantine/dates"
import { useForm } from "@mantine/form"
import dayjs from "dayjs"
import { yupResolver } from "mantine-form-yup-resolver"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import * as yup from "yup"
import { useRemoveElement } from "../api/elements"
import type { ElementListItem } from "../types"

type FormValues = {
  removed_on: string | null
  removal_cause: string | null
  reason: string
}

/**
 * The removal of an element (EL-7): the date, not in the future, and the cause, required for the trees. On a removed
 * element the form corrects date and cause.
 */
export function RemoveElementForm({ element, onDone }: { element: ElementListItem; onDone: () => void }) {
  const { t } = useTranslation()
  const [isLoading, setIsLoading] = useState(false)
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
            removed_on: values.removed_on!,
            removal_cause: values.removal_cause,
            reason: values.reason.trim(),
          })
          onDone()
        } catch (error) {
          form.setErrors(
            error instanceof ApiError
              ? transformErrorsForForm(error.data)
              : { non_field_errors: t("common.unexpectedError") }
          )
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
