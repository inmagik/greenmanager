import type { Permission, Role } from "../types"
import { Button, Group, SimpleGrid, Stack, TextInput, Text, Box, Checkbox } from "@mantine/core"
import { useForm } from "@mantine/form"
import { yupResolver } from "mantine-form-yup-resolver"
import { useState } from "react"
import { TbDeviceFloppy, TbId } from "react-icons/tb"
import * as yup from "yup"
import { ApiError } from "@inmagik/react-crud/dist/crud/utils"
import { transformErrorsForForm } from "@/utils"
import { AlertError } from "@/components/AlertError"
import classNames from "classnames"
import { PermissionTooltip } from "./PermissionTooltip"
import { usePermissions } from "../api/permissions"
import { FormFooter } from "@/components/FormFooter"
import { useTranslation } from "react-i18next"

type Props = {
  initialValues: Role
  readonly?: boolean
  onCancel?: () => void
  onSubmit?: (values: Role) => Promise<void> | void
}

export function UpdateRoleForm({ initialValues, readonly, onCancel, onSubmit }: Props) {
  const [isLoading, setIsLoading] = useState(false)
  const { t } = useTranslation()
  const schema = yup.object().shape({ name: yup.string().required().label(t("fields.name")) })

  const form = useForm({
    mode: "controlled",
    initialValues,
    validate: yupResolver(schema),
  })

  const { data: availablePermissions } = usePermissions()

  const groupedPermissions =
    availablePermissions?.reduce(
      (groups, permission) => {
        groups[permission.module] = (groups[permission.module] || []).concat(permission)
        return groups
      },
      {} as Record<string, Permission[]>
    ) ?? {}

  return (
    <form
      className="h-100"
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
      <Stack justify="space-between" h="100%">
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
              label={t("fields.name")}
              placeholder={t("fields.name")}
              key={form.key("name")}
              {...form.getInputProps("name")}
              variant={readonly ? "unstyled" : "default"}
              readOnly={readonly}
            />
          </SimpleGrid>
          <Stack p="lg" gap="sm">
            <Group justify="space-between">
              <Text size="md">{t("roles.fields.permissions")}</Text>
            </Group>
            <SimpleGrid cols={{ base: 1, md: 2, lg: 3, xl: 4 }}>
              {Object.entries(groupedPermissions).map(([module, permissions]) => (
                <Box key={module} bg="gray.0" p="sm" bdrs="sm" bd="1px solid gray.2">
                  <Group mb="md" gap="xs">
                    <Box bg="gray.2" p="xxs" bdrs="xs" lh={1}>
                      <TbId size="1.5rem" />
                    </Box>
                    <Text size="md" fw="600" flex={1}>
                      {module}
                    </Text>
                  </Group>
                  <Stack gap={0}>
                    {permissions.map((permission, i, lst) => {
                      const isActive = form.values.permissions.includes(permission.code)
                      return (
                        <Group
                          key={permission.code}
                          wrap="nowrap"
                          py="xxs"
                          className={classNames({ "standard-border-bottom": i < lst.length - 1 })}
                        >
                          <Checkbox
                            size="xs"
                            checked={isActive}
                            disabled={readonly}
                            onChange={() => {
                              if (isActive) {
                                form.setFieldValue(
                                  "permissions",
                                  form.values.permissions.filter((p) => p !== permission.code)
                                )
                              } else {
                                form.setFieldValue("permissions", [...form.values.permissions, permission.code])
                              }
                            }}
                          />
                          <Text size="sm" flex={1} lineClamp={1}>
                            {permission.name}
                          </Text>
                          <PermissionTooltip permission={permission} />
                        </Group>
                      )
                    })}
                  </Stack>
                </Box>
              ))}
            </SimpleGrid>
          </Stack>
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
