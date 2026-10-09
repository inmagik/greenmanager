import { createTable } from "@/components/Table"
import type { Role } from "../types"
import { Link, useSearchParams } from "react-router-dom"
import type { PaginatedDJResponse } from "@inmagik/react-crud/dist/types"
import { Pagination, Text } from "@mantine/core"
import { RoleContextActions } from "./RoleContextActions"
import { CheckPermission } from "@/components/CheckPermission"
import { AUTH_CORE_PERMISSIONS } from "../permissions"
import { useTranslation } from "react-i18next"

type RolesTableProps = {
  selection: number[]
  setSelection: (ids: number[]) => void
  data: PaginatedDJResponse<Role> | undefined
  isLoadingRoles: boolean
  emptyContent?: React.ReactNode
}

const Table = createTable<Role>()

export default function RolesTable({ selection, setSelection, data, isLoadingRoles, emptyContent }: RolesTableProps) {
  const { t } = useTranslation()
  const [params, setParams] = useSearchParams()

  const page = parseInt(params.get("page") || "1", 10)
  const ordering = params.get("ordering") || ""
  return (
    <Table
      data={data?.results || []}
      loading={isLoadingRoles}
      style={{ flexGrow: 1 }}
      orderBy={ordering.replace("-", "")}
      orderDirection={ordering.startsWith("-") ? "desc" : "asc"}
      onOrderChange={(field, direction) => {
        if (field) {
          if (direction === "desc") {
            setParams({ ...Object.fromEntries(params), ordering: `-${field}` })
          } else {
            setParams({ ...Object.fromEntries(params), ordering: field })
          }
        } else {
          setParams({ ...Object.fromEntries(params), ordering: "" })
        }
      }}
    >
      {emptyContent && <Table.Extra.BeforeContent>{emptyContent}</Table.Extra.BeforeContent>}
      <Table.HeaderConfig sticky />
      <Table.Column
        title="fields.name"
        name="name"
        sortable
        render={(role) => (
          <Link to={`/utenti/ruoli/${role.id}`}>
            <Text td="underline">{role.name}</Text>
          </Link>
        )}
      />
      <Table.Column title="roles.fields.userCount" name="users_count" render={(role) => role.user_count} />
      <Table.Column
        title="fields.actions"
        name="_actions"
        width="80px"
        cellStyle={{ paddingRight: 0 }}
        render={(role) => (
          <CheckPermission permission={AUTH_CORE_PERMISSIONS.SCRITTURA_RUOLI}>
            <RoleContextActions role={role} />
          </CheckPermission>
        )}
        cellAlign="end"
        headerAlign="end"
      />

      <Table.Selection selectionField="id" selectedRows={selection} onSelectionChange={setSelection} />

      <Table.Footer.Left>
        <Pagination
          value={page}
          onChange={(newPage) => setParams({ ...Object.fromEntries(params), page: newPage.toString() })}
          total={Math.ceil((data?.count ?? 0) / 20)}
          radius={100}
        />
      </Table.Footer.Left>

      <Table.Footer.Right>
        <Text size="sm" ta="right">
          {t("users.results", { shown: data?.results.length ?? 0, total: data?.full_count ?? 0 })}
        </Text>
      </Table.Footer.Right>
    </Table>
  )
}
