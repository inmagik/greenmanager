import { FormFooter } from "@/components/FormFooter"
import { uniqBy } from "@/utils"
import { Box, Button, Checkbox, Group, Pill, SimpleGrid, Stack, Text } from "@mantine/core"
import { useForm } from "@mantine/form"
import { modals } from "@mantine/modals"
import classNames from "classnames"
import { useState } from "react"
import { TbDeviceFloppy, TbId, TbPlus } from "react-icons/tb"
import { usePermissions } from "../api/permissions"
import type { Permission, Role } from "../types"
import { PermissionTooltip } from "./PermissionTooltip"
import { PickRolesForm } from "./PickRolesForm"
import { CheckPermission } from "@/components/CheckPermission"
import { AUTH_CORE_PERMISSIONS } from "../permissions"
import { useTranslation } from "react-i18next"

type Form = {
  permissions: string[]
  roles: Pick<Role, "id" | "name" | "permissions">[]
}

type Props = {
  initialValues: Form
  readonly?: boolean
  onCancel?: () => void
  onSubmit?: (values: Form) => Promise<void> | void
}

export function RolesPermissionsForm({ initialValues, readonly, onCancel, onSubmit }: Props) {
  const { t } = useTranslation()
  const [isLoading, setIsLoading] = useState(false)

  // Local data
  const { data: availablePermissions } = usePermissions()

  const groupedPermissions =
    availablePermissions?.reduce(
      (groups, permission) => {
        groups[permission.module] = (groups[permission.module] || []).concat(permission)
        return groups
      },
      {} as Record<string, Permission[]>
    ) ?? {}

  const form = useForm({
    mode: "controlled",
    initialValues,
  })

  return (
    <form
      className="h-100"
      onSubmit={form.onSubmit(async () => {
        setIsLoading(true)
        try {
          await onSubmit?.(form.values)
        } finally {
          setIsLoading(false)
        }
      })}
    >
      <Stack justify="space-between" h="100%">
        <div>
          <CheckPermission permission={AUTH_CORE_PERMISSIONS.LETTURA_RUOLI}>
            <Stack p="lg" className="standard-border-bottom" gap="sm">
              <Group justify="space-between">
                <Text size="md">{t("users.fields.roles")}</Text>
                <Button
                  size="xs"
                  leftSection={<TbPlus />}
                  disabled={readonly}
                  onClick={() => {
                    const modalId = modals.open({
                      title: t("roles.detail.assignUsers"),
                      children: (
                        <PickRolesForm
                          onSubmit={(roles) => {
                            modals.close(modalId)
                            form.setFieldValue(
                              "roles",
                              uniqBy([...form.values.roles, ...roles], (r) => r.id)
                            )
                          }}
                        />
                      ),
                    })
                  }}
                >
                  {t("roles.detail.assign")}
                </Button>
              </Group>
              <Group gap="xxs">
                {form.values.roles.map((role, index) => {
                  return (
                    <Pill
                      key={index}
                      size="sm"
                      withRemoveButton={!readonly}
                      removeButtonProps={{
                        onClick: () =>
                          form.setFieldValue(
                            "roles",
                            form.values.roles.filter((item) => item.id !== role.id)
                          ),
                      }}
                      disabled={readonly}
                    >
                      {role.name}
                    </Pill>
                  )
                })}
              </Group>
            </Stack>
          </CheckPermission>
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
                      const itComesFromRole = form.values.roles.find((role) =>
                        role.permissions.includes(permission.code)
                      )
                      const isActive = !!itComesFromRole || form.values.permissions.includes(permission.code)
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
                            disabled={readonly || !!itComesFromRole}
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
                          <PermissionTooltip permission={permission} enablingRole={itComesFromRole} />
                        </Group>
                      )
                    })}
                  </Stack>
                </Box>
              ))}
            </SimpleGrid>
          </Stack>
        </div>
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
