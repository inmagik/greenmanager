import { Header } from "@/components/Header/Header"
import { Page } from "@/components/Page"
import { TableEmptyState } from "@/components/Table"
import { Alert, Box, Button, Group, Text, TextInput } from "@mantine/core"
import { useDebouncedValue } from "@mantine/hooks"
import { modals } from "@mantine/modals"
import { useMemo, useState } from "react"
import { TbSearch, TbVectorBezierCircle } from "react-icons/tb"
import { useSearchParams } from "react-router-dom"
import { useRoles, useBulkDeleteRoles } from "../api/roles"
import { CreateRoleAction } from "../components/CreateRoleAction"
import RolesTable from "../components/RolesTable"
import { CheckPermission } from "@/components/CheckPermission"
import { AUTH_CORE_PERMISSIONS } from "../permissions"
import { useTranslation } from "react-i18next"
import { notifyApiError } from "@/utils"

export function RolesList() {
  const { t } = useTranslation()
  // Query params
  const [params, setParams] = useSearchParams()
  const search = params.get("search") || ""
  const page = parseInt(params.get("page") || "1", 10)
  const ordering = params.get("ordering") || ""
  // Local state
  const [selection, setSelection] = useState<number[]>([])

  // React query
  const [debSearch] = useDebouncedValue(search, 300)
  const filters = useMemo(() => ({ page, ordering, search: debSearch }), [debSearch, page, ordering])
  const { data, isLoading: isLoadingRoles } = useRoles(filters)
  const { mutateAsync: bulkDeleteRoles } = useBulkDeleteRoles()

  // Computed values
  const selectedRoles = useMemo(() => {
    if (!data) return []
    return data.results.filter((role) => selection.includes(role.id))
  }, [data, selection])

  const emptyContent =
    data?.full_count === 0 ? (
      <TableEmptyState
        title={t("roles.list.emptyTitle")}
        description={t("roles.list.emptyDescription")}
        action={
          <CheckPermission permission={AUTH_CORE_PERMISSIONS.WRITE_ROLES}>
            <CreateRoleAction />
          </CheckPermission>
        }
      />
    ) : null

  let mainActions: React.ReactNode = (
    <CheckPermission permission={AUTH_CORE_PERMISSIONS.WRITE_ROLES}>
      <CreateRoleAction />
    </CheckPermission>
  )
  if (selection.length > 0) {
    mainActions = (
      <>
        <Button
          variant="subtle"
          color="gray"
          onClick={() => {
            setSelection([])
          }}
        >
          {t("common.cancel")}
        </Button>
        <CheckPermission permission={AUTH_CORE_PERMISSIONS.WRITE_ROLES}>
          <Button
            color="red.8"
            onClick={() => {
              modals.openConfirmModal({
                title: t("roles.list.deleteTitle"),
                children: (
                  <>
                    <Alert
                      color="red"
                      title={
                        <Text size="sm" c="red.9">
                          {t("roles.list.deletePrompt")} <b>{selectedRoles.map((r) => r.name).join(", ")}</b>
                        </Text>
                      }
                    >
                      <Text size="sm">{t("users.irreversible")}</Text>
                    </Alert>
                  </>
                ),
                labels: { confirm: t("common.confirm"), cancel: t("common.cancel") },
                confirmProps: { color: "red.9" },
                cancelProps: { color: "gray", variant: "subtle" },
                onConfirm: async () => {
                  try {
                    await bulkDeleteRoles({ ids: selectedRoles.map((r) => r.id) })
                    setSelection([])
                  } catch (error) {
                    notifyApiError(error)
                  }
                },
              })
            }}
          >
            {t("roles.list.deleteTitle")}
          </Button>
        </CheckPermission>
      </>
    )
  }

  return (
    <Page>
      <Header
        icon={<TbVectorBezierCircle size="1.5rem" />}
        title={t("roles.list.title")}
        breadcrumbs={[{ label: t("roles.list.breadcrumb"), href: "#" }]}
        actions={mainActions}
      />
      <Box py="xs" px="sm">
        <Group justify="flex-start" align="center" gap="xs">
          <TextInput
            size="sm"
            leftSectionPointerEvents="none"
            leftSection={<TbSearch />}
            placeholder={t("common.search")}
            aria-label={t("common.searchLabel")}
            value={search}
            onChange={(e) => setParams({ ...Object.fromEntries(params), search: e.currentTarget.value, page: "1" })}
          />
        </Group>
      </Box>
      <RolesTable selection={selection} setSelection={setSelection} data={data} isLoadingRoles={isLoadingRoles} emptyContent={emptyContent} />
    </Page>
  )
}
