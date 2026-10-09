import type { User } from "@/auth/types"
import { AlertError } from "@/components/AlertError"
import { FormFooter } from "@/components/FormFooter"
import { transformErrorsForForm } from "@/utils"
import { ApiError } from "@inmagik/react-crud/dist/crud/utils"
import { Button, Group, Input, SimpleGrid, Stack, TextInput } from "@mantine/core"
import { DateTimePicker } from "@mantine/dates"
import { useForm } from "@mantine/form"
import { yupResolver } from "mantine-form-yup-resolver"
import { useState } from "react"
import { TbAt, TbCalendar, TbDeviceFloppy, TbId, TbPower } from "react-icons/tb"
import * as yup from "yup"
import { UserStatus } from "./UserStatus"
import { useTranslation } from "react-i18next"

type Props = {
  initialValues: User
  readonly?: boolean
  onCancel?: () => void
  onSubmit?: (values: User) => Promise<void> | void
}

export function UpdateUserForm({ initialValues, readonly, onCancel, onSubmit }: Props) {
  const [isLoading, setIsLoading] = useState(false)
  const { t } = useTranslation()
  const schema = yup.object().shape({
    full_name: yup.string().required().label(t("users.fields.fullName")),
    email: yup.string().email().required().label(t("users.fields.email")),
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
              leftSection={<TbId />}
              withAsterisk
              label={t("users.fields.fullName")}
              placeholder={t("users.fields.fullName")}
              key={form.key("full_name")}
              {...form.getInputProps("full_name")}
              variant={readonly ? "unstyled" : "default"}
              readOnly={readonly}
            />
            <TextInput
              withAsterisk
              leftSection={<TbAt />}
              label={t("users.fields.email")}
              placeholder={t("users.fields.email")}
              key={form.key("email")}
              {...form.getInputProps("email")}
              variant={readonly ? "unstyled" : "default"}
              readOnly={readonly}
            />
            <DateTimePicker
              leftSection={<TbPower />}
              label={t("users.fields.activationDate")}
              key={form.key("date_joined")}
              {...form.getInputProps("date_joined")}
              variant="unstyled"
              readOnly
            />
            <DateTimePicker
              leftSection={<TbCalendar />}
              label={t("users.fields.lastLogin")}
              key={form.key("last_login")}
              {...form.getInputProps("last_login")}
              variant="unstyled"
              readOnly
            />
            {/* Read status from initialValues and not from the form (we never reinitialize the form) */}
            <Input.Wrapper label={t("fields.status")}>
              <UserStatus status={initialValues.status} />
            </Input.Wrapper>
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
                {t("common.cancel")}
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
