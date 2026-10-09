import { Alert, Anchor, Box, Button, Grid, PasswordInput, Stack, Text, TextInput } from "@mantine/core"
import { useForm } from "@mantine/form"
import { yupResolver } from "mantine-form-yup-resolver"
import * as yup from "yup"
import { Link } from "react-router-dom"
import { useAuth } from "../../auth/auth"
import { useTranslation } from "react-i18next"
import type { TFunction } from "i18next"

const schema = yup.object().shape({
  email: yup.string().email().required().label("Email"),
  password: yup.string().required().label("Password"),
})

const LOGIN_ERROR_CODES = ["invalid_credentials", "account_locked", "login_unavailable"] as const

function getLoginErrorMessage(error: unknown, t: TFunction) {
  const code = error instanceof Error ? error.message : error
  const knownCode = LOGIN_ERROR_CODES.find((c) => c === code)
  return knownCode ? t(`auth.loginErrors.${knownCode}`) : t("auth.loginError")
}

export function Login() {
  const { performLogin, loginError } = useAuth()
  const { t } = useTranslation()

  const form = useForm({
    mode: "uncontrolled",
    initialValues: {
      email: "",
      password: "",
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
            <Text size="32px" fw={700} mb="sm" ta={"center"}>
              {t("auth.loginTitle")}
            </Text>

            <Text size="md" mb="sm" c="gray.7" ta={"center"}>
              {t("auth.loginSubtitle")}
            </Text>

            <form onSubmit={form.onSubmit((values) => performLogin(values))}>
              <Stack gap="md">
                <TextInput
                  withAsterisk
                  label={t("auth.email")}
                  placeholder={t("auth.emailPlaceholder")}
                  key={form.key("email")}
                  {...form.getInputProps("email")}
                />

                <PasswordInput
                  withAsterisk
                  label={t("auth.password")}
                  placeholder={t("auth.passwordPlaceholder")}
                  key={form.key("password")}
                  {...form.getInputProps("password")}
                />

                <Anchor component={Link} to="/forgot-password" size="sm" fw={"700"}>
                  {t("auth.forgotPassword")}
                </Anchor>

                <Button type="submit" fullWidth>
                  {t("auth.login")}
                </Button>
              </Stack>
            </form>

            {!!loginError && (
              <Alert variant="light" color="red" mt="md" title={t("auth.loginFailed")}>
                {getLoginErrorMessage(loginError, t)}
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
