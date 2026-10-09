import { Anchor, Box, Button, Divider, Grid, PinInput, Stack, Text } from "@mantine/core"
import { useForm } from "@mantine/form"
import { yupResolver } from "mantine-form-yup-resolver"
import * as yup from "yup"
import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"

export function VerifyEmail() {
  const { t } = useTranslation()
  const schema = yup.object().shape({
    code: yup.string().required().label(t("auth.confirmCode")),
  })
  const form = useForm({
    mode: "uncontrolled",
    initialValues: {
      code: "",
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
              {t("auth.verifyEmail")}
            </Text>

            <Text size="md" mb="sm" c="gray.7" ta={"center"}>
              {t("auth.verificationInstructions")}
            </Text>
            <form
              onSubmit={form.onSubmit(
                async (values) => {
                  console.log("submit values:", values)

                  try {
                    //   await fetchApi(API_URL + "/api/userbase/recover-password/", {
                    //     method: "POST",
                    //     body: JSON.stringify(values),
                    //     responseType: "raw",
                    //     headers: {
                    //       "Content-Type": "application/json",
                    //     },
                    //   }).then(() => {
                    //     setConfirm(true)
                    //   })
                  } catch (error) {
                    console.error("Error while recovering password:", error)
                  }
                },
                (errors) => {
                  console.log("Validation errors:", errors)
                }
              )}
            >
              <Stack gap="md" align="center">
                <PinInput name="code" key={form.key("code")} {...form.getInputProps("code")} />

                <Button type="submit" fullWidth>
                  {t("auth.confirmCode")}
                </Button>
              </Stack>
            </form>
            <Divider my="xl" />
            <Text size="md" mt="sm" c="gray.7" ta={"center"}>
              {t("auth.noEmail")} {" "}
              <Anchor component={Link} to="/" fw={700}>
                {t("auth.sendAgain")}
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
            backgroundColor: 'var(--mantine-color-default-filled)',
          }}
        />
      </Grid.Col>
    </Grid>
  )
}
