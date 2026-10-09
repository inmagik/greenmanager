import { useTenant } from "@/hooks/useTenant"
import { Box, Group, ScrollArea, Skeleton, Text } from "@mantine/core"
import { useEffect, useState } from "react"
import { TbBriefcase, TbCheck } from "react-icons/tb"
import { useNavigate } from "react-router-dom"

export function TenantSelector() {
  const { tenant, tenants, isLoading, setTenant } = useTenant()
  const [displayTenantSelector, setDisplayTenantSelector] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    if (!displayTenantSelector) {
      return
    }

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest(".tenant-selector")) {
        setDisplayTenantSelector(false)
      }
    }

    document.addEventListener("click", handleClickOutside)

    return () => {
      document.removeEventListener("click", handleClickOutside)
    }
  }, [displayTenantSelector])

  if (isLoading) {
    return <Skeleton height={36} radius="sm" />
  }

  const selector = tenants.length > 1 ? (
    <Box
      style={{ borderTop: "1px solid var(--mantine-color-gray-3)", cursor: "pointer" }}
      pos="relative"
      className="tenant-selector"
    >
      <Group
        p="xs"
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault()
            setDisplayTenantSelector((open) => !open)
          }
        }}
        onClick={() => setDisplayTenantSelector((open) => !open)}
      >
        <Group bdrs="50%" bg="gray.0" w={40} h={40} justify="center" align="center">
          <TbBriefcase size={16} />
        </Group>
        <Text>{tenant?.name}</Text>
      </Group>
      {displayTenantSelector && (
        <ScrollArea
          h={Math.min(tenants.length, 3) * 64}
          style={{ position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 1000 }}
          bg="gray.1"
        >
          {tenants.map((item) => (
            <Group
              key={item.id}
              p="xs"
              style={{ cursor: "pointer" }}
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault()
                  setTenant(item)
                  setDisplayTenantSelector(false)
                  navigate("/")
                }
              }}
              onClick={() => {
                setTenant(item)
                setDisplayTenantSelector(false)
                navigate("/")
              }}
            >
              <Group bdrs="50%" bg="gray.2" w={40} h={40} justify="center" align="center">
                <TbBriefcase size={16} />
              </Group>
              {item.name}
              {item.id === tenant?.id && <TbCheck color="default.6" />}
            </Group>
          ))}
        </ScrollArea>
      )}
    </Box>
  ) : null

  return selector
}
