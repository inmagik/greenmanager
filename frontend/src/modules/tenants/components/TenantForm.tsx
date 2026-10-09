import { AlertError } from "@/components/AlertError"
import { FormFooter } from "@/components/FormFooter"
import { transformErrorsForForm } from "@/utils"
import { ApiError } from "@inmagik/react-crud/dist/crud/utils"
import { Box, Button, Checkbox, Group, SimpleGrid, Stack, TextInput } from "@mantine/core"
import { useForm } from "@mantine/form"
import { yupResolver } from "mantine-form-yup-resolver"
import { TbDeviceFloppy } from "react-icons/tb"
import { useState } from "react"
import * as yup from "yup"
import type { TenantPayload } from "../types"
import { useTranslation } from "react-i18next"

type Props = {
  initialValues?: Partial<TenantPayload>
  onSubmit: (values: TenantPayload) => Promise<void> | void
  readonly?: boolean
  layout?: "modal" | "page"
  onCancel?: () => void
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export function TenantForm({ initialValues, onSubmit, readonly = false, layout = "modal", onCancel }: Props) {
  const [isLoading, setIsLoading] = useState(false)
  const { t } = useTranslation()
  const schema = yup.object({
    name: yup.string().trim().required().label(t("fields.name")),
    slug: yup.string().trim().matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, t("tenants.fields.slugValidation")).required().label(t("tenants.fields.slug")),
    is_active: yup.boolean().required(),
  })
  const form = useForm<TenantPayload>({
    mode: "controlled",
    initialValues: {
      name: initialValues?.name ?? "",
      slug: initialValues?.slug ?? "",
      is_active: initialValues?.is_active ?? true,
    },
    validate: yupResolver(schema),
  })

  return (
    <form className={layout === "page" ? "h-100" : undefined}
      onSubmit={form.onSubmit(async (values) => {
        setIsLoading(true)
        try {
          await onSubmit(values)
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
      <Stack justify="space-between" h={layout === "page" ? "100%" : undefined}>
      <Box pb="sm" p={layout === "page" ? "xl" : undefined}>
        {form.errors.non_field_errors && (
          <AlertError title={t("common.errorTitle")} message={form.errors.non_field_errors.toString()} mb="xs" />
        )}
        <SimpleGrid cols={layout === "page" ? { base: 1, md: 2, lg: 3 } : 1}>
        <TextInput
          withAsterisk
          label={t("fields.name")}
          placeholder={t("tenants.fields.tenantName")}
          {...form.getInputProps("name")}
          readOnly={readonly}
          variant={readonly ? "unstyled" : "default"}
          onChange={(event) => {
            const name = event.currentTarget.value
            form.setFieldValue("name", name)
            form.setFieldValue("slug", slugify(name))
          }}
        />
        <TextInput
          withAsterisk
          label={t("tenants.fields.slug")}
          description={t("tenants.fields.slugDescription")}
          placeholder="tenant-name"
          readOnly
          variant={readonly ? "unstyled" : "filled"}
          {...form.getInputProps("slug")}
        />
        <Checkbox label={t("tenants.fields.active")} disabled={readonly} {...form.getInputProps("is_active", { type: "checkbox" })} />
        </SimpleGrid>
      </Box>
      {!readonly && (layout === "page" ? (
        <FormFooter>
          <Group justify="space-between" p="sm" className="standard-border-top">
            <Button variant="subtle" color="gray.7" onClick={() => { form.reset(); onCancel?.() }}>{t("common.cancel")}</Button>
            <Button leftSection={<TbDeviceFloppy />} type="submit" loading={isLoading}>{t("common.save")}</Button>
          </Group>
        </FormFooter>
      ) : (
        <Group justify="flex-end" pt="sm"><Button type="submit" loading={isLoading}>{t("common.confirm")}</Button></Group>
      ))}
      </Stack>
    </form>
  )
}
