import { Alert, Anchor, Box, Button, Divider, Grid, Stack, Text, TextInput } from "@mantine/core"
import { useForm } from "@mantine/form"
import { yupResolver } from "mantine-form-yup-resolver"
import * as yup from "yup"
import { fetchApi } from "@inmagik/react-crud"
import { API_URL } from "@/constants"
import { useState } from "react"
import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { splitApiErrors } from "@/utils"

export function ForgotPassword() {
  const [confirm, setConfirm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { t } = useTranslation()

  const schema = yup.object().shape({
    email: yup.string().email().required().label(t("auth.email")),
  })

  const form = useForm({
    mode: "uncontrolled",
    initialValues: {
      email: "",
    },
    validate: yupResolver(schema),
  })

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
                {t("auth.forgotTitle")}
              </Text>
            ) : (
              <Text size="32px" fw={700} mb="sm" ta={"center"}>
                {t("auth.emailSent")}
              </Text>
            )}

            {!confirm ? (
              <Text size="md" mb="sm" c="gray.7" ta={"center"}>
                {t("auth.forgotInstructions")}
              </Text>
            ) : (
              <Text size="md" mb="sm" c="gray.7" ta={"center"}>
                {t("auth.checkInbox")}
              </Text>
            )}
            {!confirm && (
              <form
                onSubmit={form.onSubmit(
                  async (values) => {
                    try {
                      await fetchApi(API_URL + "/api/userbase/recover-password/", {
                        method: "POST",
                        body: JSON.stringify(values),
                        responseType: "raw",
                        headers: {
                          "Content-Type": "application/json",
                        },
                      })
                      setError(null)
                      setConfirm(true)
                    } catch (error) {
                      const { fieldErrors, message } = splitApiErrors(error, ["email"])
                      form.setErrors(fieldErrors)
                      setError(message && t("auth.recoverPasswordError"))
                    }
                  }
                )}
              >
                <Stack gap="md">
                  <TextInput
                    withAsterisk
                    label={t("auth.email")}
                    placeholder={t("auth.emailPlaceholder")}
                    key={form.key("email")}
                    {...form.getInputProps("email")}
                  />

                  <Button type="submit" fullWidth>
                    {t("auth.sendEmail")}
                  </Button>
                </Stack>
              </form>
            )}
            {error && (
              <Alert variant="light" color="red" mt="md">
                {error}
              </Alert>
            )}
            <Divider my="xl" />
            {!confirm ? (
              <Text size="sm" mt="md" c="gray.7" ta={"center"}>
                {t("auth.keepPassword")} {" "}
                <Anchor fw={700} component={Link} to="/login">
                  {t("auth.goBack")}
                </Anchor>
              </Text>
            ) : (
              <Text size="sm" mt="md" c="gray.7" ta={"center"}>
                {t("auth.returnToLoginQuestion")} {" "}
                <Anchor fw={700} component={Link} to="/login">
                  {t("auth.loginNow")}
                </Anchor>
              </Text>
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
