import { useAuth } from "@/auth/auth"
import { API_URL } from "@/constants"
import { fetchApi } from "@inmagik/react-crud"
import { Alert, Box, Button, Divider, PasswordInput, Stack } from "@mantine/core"
import { useForm } from "@mantine/form"
import { yupResolver } from "mantine-form-yup-resolver"
import { useState } from "react"
import * as yup from "yup"
import { useTranslation } from "react-i18next"

type ChangePasswordModalProps = {
  onChangePassword?: () => void
}
export function ChangePasswordModal({ onChangePassword }: ChangePasswordModalProps) {
  const { tokens } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const { t } = useTranslation()
  const schema = yup.object().shape({
    old_password: yup.string().required(t("auth.currentPasswordRequired")),
    password: yup.string().required(t("auth.newPasswordRequired")).min(8, t("auth.passwordMin")).notOneOf([yup.ref("old_password")], t("auth.passwordMustDiffer")),
  })

  const form = useForm({
    mode: "uncontrolled",
    initialValues: {
      old_password: "",
      password: "",
    },
    validate: yupResolver(schema),
  })

  return (
    <Box
      h="100%"
      w="100%"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Box w="100%">
        {/* align center the text and the form */}

        <form
          onSubmit={form.onSubmit(
            async (values) => {
              try {
                await fetchApi(API_URL + "/api/userbase/change-password/", {
                  method: "PUT",
                  body: JSON.stringify({
                    ...values,
                  }),
                  responseType: "raw",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${tokens?.access}`,
                  },
                })
                console.log("Password change successful")
                onChangePassword?.()
              } catch (error) {
                console.error("Error while changing password:", error)
                setError(error instanceof Error ? error.message : "Unknown error")
              }
            },
            (errors) => {
              console.log("Validation errors:", errors)
            }
          )}
        >
          <Stack gap="md">
            <PasswordInput
              withAsterisk
              label={t("auth.currentPassword")}
              placeholder={t("auth.currentPasswordPlaceholder")}
              key={form.key("old_password")}
              {...form.getInputProps("old_password")}
            />

            <PasswordInput
              withAsterisk
              label={t("auth.newPassword")}
              placeholder={t("auth.newPasswordPlaceholder")}
              key={form.key("password")}
              {...form.getInputProps("password")}
            />

            <Button type="submit" fullWidth>
              {t("auth.editPassword")}
            </Button>
          </Stack>
        </form>

        {error && (
          <>
            <Divider my="md" />
            <Alert variant="light" color="red" mt="md">
              {error}
            </Alert>
          </>
        )}
      </Box>
    </Box>
  )
}
