import { AlertError } from "@/components/AlertError"
import { transformErrorsForForm } from "@/utils"
import { ApiError } from "@inmagik/react-crud/dist/crud/utils"
import { Box, Button, Group, TextInput } from "@mantine/core"
import { useForm } from "@mantine/form"
import { yupResolver } from "mantine-form-yup-resolver"
import { useState } from "react"
import { TbId } from "react-icons/tb"
import * as yup from "yup"
import { useTranslation } from "react-i18next"

type Form = {
  name: string
}

type Props = {
  initialValues?: Partial<Form>
  onSubmit: (values: Form) => Promise<void> | void
}

export function CreateRoleForm({ initialValues, onSubmit }: Props) {
  const { t } = useTranslation()
  const schema = yup.object().shape({ name: yup.string().required().label(t("fields.name")) })
  const form = useForm({
    mode: "controlled",
    initialValues: {
      name: initialValues?.name || "",
    },
    validate: yupResolver(schema),
  })
  const [isLoading, setIsLoading] = useState(false)

  return (
    <form
      onSubmit={form.onSubmit(async () => {
        setIsLoading(true)
        try {
          await onSubmit(form.values)
        } catch (err) {
          if (err instanceof ApiError) {
            form.setErrors(transformErrorsForForm(err.data))
          } else {
            form.setErrors({
              non_field_errors:
                t("common.unexpectedError"),
            })
          }
        } finally {
          setIsLoading(false)
        }
      })}
    >
      <Box pb="sm">
        {form.errors.non_field_errors && (
          <AlertError title={t("common.errorTitle")} message={form.errors.non_field_errors.toString()} mb="xs" />
        )}
        <TextInput
          withAsterisk
          label={t("fields.name")}
          placeholder={t("fields.name")}
          key={form.key("name")}
          leftSection={<TbId size="1rem" />}
          leftSectionPointerEvents="none"
          {...form.getInputProps("name")}
          pb="md"
        />
      </Box>
      <Group justify="flex-end" pt="sm">
        <Button type="submit" loading={isLoading}>
          {t("common.confirm")}
        </Button>
      </Group>
    </form>
  )
}
