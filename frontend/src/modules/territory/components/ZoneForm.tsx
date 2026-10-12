import { AlertError } from "@/components/AlertError"
import { FormFooter } from "@/components/FormFooter"
import { RevisionConflictAlert } from "@/components/RevisionConflictAlert"
import { ClientSelect } from "@/modules/parties/components/ClientSelect"
import { transformErrorsForForm } from "@/utils"
import { isRevisionConflict } from "@/utils/tracking"
import { ApiError } from "@inmagik/react-crud/dist/crud/utils"
import { Box, Button, Group, NumberInput, SimpleGrid, Stack, TextInput } from "@mantine/core"
import { useForm } from "@mantine/form"
import { yupResolver } from "mantine-form-yup-resolver"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { TbDeviceFloppy } from "react-icons/tb"
import * as yup from "yup"
import type { Zone, ZonePayload } from "../types"

type FormValues = { client: string | null; code: number | string; name: string }

type Props = {
  /** The zone shown or changed; none for a new zone. */
  zone?: Zone
  /** The client of a new zone, e.g. the one of the filter of the list. */
  defaultClient?: string | null
  onSubmit: (values: ZonePayload) => Promise<void> | void
  /** Reload the zone after a revision conflict; the parent remounts the form with the new values. */
  onReload?: () => void
  readonly?: boolean
  layout?: "modal" | "page"
  onCancel?: () => void
}

export function ZoneForm({
  zone,
  defaultClient,
  onSubmit,
  onReload,
  readonly = false,
  layout = "modal",
  onCancel,
}: Props) {
  const { t } = useTranslation()
  const [isLoading, setIsLoading] = useState(false)
  const [conflict, setConflict] = useState(false)
  const schema = yup.object({
    client: yup.string().nullable().required().label(t("territory.fields.client")),
    name: yup.string().trim().required().max(255).label(t("fields.name")),
    // The server gives the next code to a zone without one: on a saved zone it would change the code.
    code: zone
      ? yup
          .mixed()
          .test(
            "required",
            t("validation.required", { field: t("territory.fields.zoneCode") }),
            (value) => value !== ""
          )
      : yup.mixed(),
  })
  const form = useForm<FormValues>({
    mode: "controlled",
    initialValues: {
      client: zone?.client ?? defaultClient ?? null,
      code: zone?.code ?? "",
      name: zone?.name ?? "",
    },
    validate: yupResolver(schema),
  })
  const inputVariant = readonly ? "unstyled" : "default"

  return (
    <form
      className={layout === "page" ? "h-100" : undefined}
      onSubmit={form.onSubmit(async (values) => {
        setIsLoading(true)
        try {
          await onSubmit({
            // The client does not change after the creation.
            ...(zone ? {} : { client: values.client ?? undefined }),
            name: values.name,
            code: values.code === "" ? null : Number(values.code),
          })
        } catch (error) {
          if (isRevisionConflict(error) && onReload) {
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
      <Stack justify="space-between" h={layout === "page" ? "100%" : undefined}>
        <Box pb="sm" p={layout === "page" ? "xl" : undefined}>
          {conflict && onReload && <RevisionConflictAlert onReload={onReload} mb="xs" />}
          {form.errors.non_field_errors && (
            <AlertError title={t("common.errorTitle")} message={form.errors.non_field_errors.toString()} mb="xs" />
          )}
          <SimpleGrid cols={layout === "page" ? { base: 1, md: 2, lg: 3 } : 1}>
            {zone ? (
              <TextInput
                label={t("territory.fields.client")}
                description={readonly ? undefined : t("territory.clientImmutable")}
                readOnly
                variant="unstyled"
                value={zone.client_data.name}
              />
            ) : (
              <ClientSelect
                activeOnly
                withAsterisk
                label={t("territory.fields.client")}
                value={form.values.client}
                onChange={(value) => form.setFieldValue("client", value)}
                error={form.errors.client}
              />
            )}
            <NumberInput
              withAsterisk={!readonly && !!zone}
              label={t("territory.fields.zoneCode")}
              description={readonly || zone ? undefined : t("territory.fields.zoneCodeDescription")}
              allowDecimal={false}
              allowNegative={false}
              min={0}
              readOnly={readonly}
              variant={inputVariant}
              {...form.getInputProps("code")}
            />
            <TextInput
              withAsterisk={!readonly}
              label={t("fields.name")}
              readOnly={readonly}
              variant={inputVariant}
              {...form.getInputProps("name")}
            />
          </SimpleGrid>
        </Box>
        {!readonly &&
          (layout === "page" ? (
            <FormFooter>
              <Group justify="space-between" p="sm" className="standard-border-top">
                <Button
                  variant="subtle"
                  color="gray.7"
                  onClick={() => {
                    form.reset()
                    setConflict(false)
                    onCancel?.()
                  }}
                >
                  {t("common.cancel")}
                </Button>
                <Button leftSection={<TbDeviceFloppy />} type="submit" loading={isLoading}>
                  {t("common.save")}
                </Button>
              </Group>
            </FormFooter>
          ) : (
            <Group justify="flex-end" pt="sm">
              <Button type="submit" loading={isLoading}>
                {t("common.confirm")}
              </Button>
            </Group>
          ))}
      </Stack>
    </form>
  )
}
