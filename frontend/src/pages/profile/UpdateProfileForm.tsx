import type { User } from "@/auth/types"
import { AlertError } from "@/components/AlertError"
import { FormFooter } from "@/components/FormFooter"
import { transformErrorsForForm } from "@/utils"
import { ApiError } from "@inmagik/react-crud/dist/crud/utils"
import { Button, Group, SimpleGrid, Stack, TextInput } from "@mantine/core"
import { DateTimePicker } from "@mantine/dates"
import { useForm } from "@mantine/form"
import dayjs from "dayjs"
import { yupResolver } from "mantine-form-yup-resolver"
import { useState } from "react"
import { TbDeviceFloppy } from "react-icons/tb"
import * as yup from "yup"
import { useTranslation } from "react-i18next"

type Props = {
  initialValues: User
  readonly?: boolean
  onCancel?: () => void
  onSubmit?: (values: User) => Promise<void> | void
}

export function UpdateProfileForm({ initialValues, readonly, onCancel, onSubmit }: Props) {
  const [isLoading, setIsLoading] = useState(false)
  const { t } = useTranslation()
  const schema = yup.object().shape({
    full_name: yup.string().required().label(t("users.fields.fullName")),
  })

  const form = useForm({
    mode: "controlled",
    initialValues,
    validate: yupResolver(schema),
  })

  return (
    <form
      onSubmit={form.onSubmit(async () => {
        setIsLoading(true)
        try {
          await onSubmit?.(form.values)
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
      <Stack justify="space-between">
        <Stack justify="flex-start">
          {form.errors.non_field_errors && (
            <AlertError
              title={t("common.errorTitle")}
              message={form.errors.non_field_errors.toString()}
              mt="xl"
              mx="xl"
            />
          )}
          <SimpleGrid cols={{ base: 1, md: 2, lg: 3, xl: 4 }} p="xl">
            <TextInput
              withAsterisk
              label={t("users.fields.fullName")}
              placeholder={t("users.fields.fullName")}
              key={form.key("full_name")}
              {...form.getInputProps("full_name")}
              variant={readonly ? "unstyled" : "default"}
              readOnly={readonly}
            />
            <TextInput
              label={t("auth.email")}
              placeholder={t("auth.email")}
              key={form.key("email")}
              {...form.getInputProps("email")}
              variant="unstyled"
              readOnly
            />

            <DateTimePicker
              label={t("users.fields.activationDate")}
              key={form.key("date_joined")}
              {...form.getInputProps("date_joined")}
              value={dayjs(initialValues.date_joined).toDate()}
              variant="unstyled"
              readOnly
            />
            <DateTimePicker
              label={t("users.fields.lastLogin")}
              key={form.key("last_login")}
              {...form.getInputProps("last_login")}
              value={initialValues.last_login ? dayjs(initialValues.last_login).toDate() : undefined}
              variant="unstyled"
              readOnly
            />
          </SimpleGrid>
        </Stack>
        {!readonly && (
          <FormFooter>
            <Group justify="space-between" p="sm" className="standard-border-top">
              <Button
                variant="subtle"
                color="gray.7"
                onClick={() => {
                  form.reset()
                  onCancel?.()
                }}
              >
                {t("common.closeWithoutSaving")}
              </Button>
              <Button leftSection={<TbDeviceFloppy />} loading={isLoading} type="submit">
                {t("common.save")}
              </Button>
            </Group>
          </FormFooter>
        )}
      </Stack>
    </form>
  )
}
