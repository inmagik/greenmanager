import { useTenant } from "@/hooks/useTenant"
import { Group, Menu, ScrollArea, Skeleton, Text, UnstyledButton } from "@mantine/core"
import { useTranslation } from "react-i18next"
import { TbBriefcase, TbCheck, TbSelector } from "react-icons/tb"
import { useNavigate } from "react-router-dom"

// Mantine Menu: keyboard navigation, Escape and ARIA attributes come with it.
export function TenantSelector() {
  const { tenant, tenants, isLoading, setTenant } = useTenant()
  const navigate = useNavigate()
  const { t } = useTranslation()

  if (isLoading) {
    return <Skeleton height={36} radius="sm" />
  }

  if (tenants.length < 2) {
    return null
  }

  return (
    <Menu position="top-start" width="target" withinPortal={false}>
      <Menu.Target>
        <UnstyledButton
          p="xs"
          w="100%"
          style={{ borderTop: "1px solid var(--mantine-color-gray-3)" }}
          aria-label={`${t("tenants.switchTenant")}. ${t("tenants.currentTenant", { name: tenant?.name ?? "" })}`}
        >
          <Group wrap="nowrap">
            <Group bdrs="50%" bg="gray.0" w={40} h={40} justify="center" align="center" style={{ flexShrink: 0 }}>
              <TbBriefcase size={16} />
            </Group>
            <Text flex={1} truncate>
              {tenant?.name}
            </Text>
            <TbSelector size={16} />
          </Group>
        </UnstyledButton>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Label>{t("tenants.switchTenant")}</Menu.Label>
        <ScrollArea.Autosize mah={3 * 48}>
          {tenants.map((item) => (
            <Menu.Item
              key={item.id}
              leftSection={<TbBriefcase size={16} />}
              rightSection={item.id === tenant?.id ? <TbCheck size={16} /> : null}
              aria-current={item.id === tenant?.id ? "true" : undefined}
              onClick={() => {
                setTenant(item)
                navigate("/")
              }}
            >
              {item.name}
            </Menu.Item>
          ))}
        </ScrollArea.Autosize>
      </Menu.Dropdown>
    </Menu>
  )
}
