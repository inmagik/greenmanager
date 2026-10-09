import { Alert, Anchor, Box, Button, Divider, Grid, PasswordInput, Stack, Text } from "@mantine/core"
import { useForm } from "@mantine/form"
import { yupResolver } from "mantine-form-yup-resolver"
import * as yup from "yup"
import { fetchApi } from "@inmagik/react-crud"
import { API_URL } from "@/constants"
import { useState } from "react"
import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"

export function ResetPassword() {
  const [confirm, setConfirm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { t } = useTranslation()

  const schema = yup.object().shape({
    password: yup.string().required(t("auth.passwordRequired")).min(8, t("auth.passwordMin")),
    repeatPassword: yup.string().required(t("auth.confirmPasswordRequired")).oneOf([yup.ref("password")], t("auth.passwordsMismatch")),
  })

  const token = new URLSearchParams(window.location.search).get("token")

  const form = useForm({
    mode: "uncontrolled",
    initialValues: {
      password: "",
      repeatPassword: "",
    },
    validate: yupResolver(schema),
  })

  if (!token) {
    return (
      <Grid h="100vh" m={0}>
        <Grid.Col span={6} h="100vh" p={0}>
          <Box
            h="100%"
            w="100%"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Box w="100%" maw={420} className="guest-form-panel">
              <Text size="32px" fw={700} mb="sm" ta={"center"}>
                {t("auth.missingToken")}
              </Text>
              <Text size="md" mb="sm" c="gray.7" ta={"center"}>
                {t("auth.missingTokenMessage")}
              </Text>
              <Text size="md" mt="sm" c="gray.7" ta={"center"}>
                {t("auth.returnTo")} {" "}
                <Anchor component={Link} to="/forgot-password">
                  {t("auth.recoveryPage")}
                </Anchor>
              </Text>
            </Box>
          </Box>
        </Grid.Col>

        <Grid.Col span={6} p={0} h="100vh">
          <Box
            h="100%"
            w="100%"
            style={{
              backgroundImage: "url('/placeholder.png')",
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
            }}
          />
        </Grid.Col>
      </Grid>
    )
  }

  return (
    <Grid h="100vh" m={0}>
      <Grid.Col span={6} h="100vh" p={0}>
        <Box
          h="100%"
          w="100%"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Box w="100%" maw={420} className="guest-form-panel">
            {/* align center the text and the form */}
            {!confirm ? (
              <Text size="32px" fw={700} mb="sm" ta={"center"}>
                {t("auth.setNewPassword")}
              </Text>
            ) : (
              <Text size="32px" fw={700} mb="sm" ta={"center"}>
                {t("auth.passwordChanged")}
              </Text>
            )}

            {!confirm ? (
              <Text size="md" mb="sm" c="gray.7" ta={"center"}>
                {t("auth.newPasswordInstructions")}
              </Text>
            ) : (
              <Text size="md" mb="sm" c="gray.7" ta={"center"}>
                {t("auth.passwordChangedMessage")}
              </Text>
            )}
            {!confirm && (
              <form
                onSubmit={form.onSubmit(
                  async (values) => {
                    try {
                      await fetchApi(API_URL + "/api/userbase/reset-password/", {
                        method: "POST",
                        body: JSON.stringify({
                          ...values,
                          token,
                        }),
                        responseType: "raw",
                        headers: {
                          "Content-Type": "application/json",
                        },
                      })
                      console.log("Password reset successful")
                      setConfirm(true)
                    } catch (error) {
                      console.error("Error while resetting password:", error)
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
                    label={t("auth.password")}
                    placeholder={t("auth.newPasswordPlaceholder")}
                    key={form.key("password")}
                    {...form.getInputProps("password")}
                  />

                  <PasswordInput
                    withAsterisk
                    label={t("auth.confirmPassword")}
                    placeholder={t("auth.confirmPasswordPlaceholder")}
                    key={form.key("repeatPassword")}
                    {...form.getInputProps("repeatPassword")}
                  />

                  <Button type="submit" fullWidth>
                    {t("auth.editPassword")}
                  </Button>
                </Stack>
              </form>
            )}
            <Divider my="xl" />
            {confirm && (
              <Text size="md" mt="sm" c="gray.7" ta={"center"}>
                <Anchor component={Link} to="/login">{t("auth.returnToLogin")}</Anchor>
              </Text>
            )}
            {error && (
              <Alert variant="light" color="red" mt="md">
                {error}
              </Alert>
            )}
          </Box>
        </Box>
      </Grid.Col>

      <Grid.Col span={6} p={0} h="100vh">
        <Box
          h="100%"
          w="100%"
          style={{
            backgroundColor: 'var(--mantine-color-default-filled)',
          }}
        />
      </Grid.Col>
    </Grid>
  )
}
