import type { User } from "@/auth/types"
import { createTable } from "@/components/Table"
import type { PaginatedDJResponse } from "@inmagik/react-crud/dist/types"
import { Pagination, Text } from "@mantine/core"
import { Link, useSearchParams } from "react-router-dom"
import { RoleUserContextActions } from "./RoleUserContextActions"
import { useTranslation } from "react-i18next"

const Table = createTable<User>()

type Props = {
  usersWithRole: PaginatedDJResponse<User> | undefined
  isLoadingUsers: boolean
  id: number
  selection: number[]
  setSelection: (ids: number[]) => void
  emptyContent?: React.ReactNode
}

export default function RoleUsersTable({ usersWithRole, isLoadingUsers, id, selection, setSelection, emptyContent }: Props) {
  const { t } = useTranslation()
  const [params, setParams] = useSearchParams()

  const page = parseInt(params.get("page") || "1", 10)
  const ordering = params.get("ordering") || ""

  return (
    <Table
      data={usersWithRole?.results || []}
      loading={isLoadingUsers}
      style={{ flexGrow: 1 }}
      orderBy={ordering.replace("-", "")}
      orderDirection={ordering.startsWith("-") ? "desc" : "asc"}
      onOrderChange={(field, direction) => {
        // A new order is a new result set: the selection would hide rows.
        setSelection([])
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
        title="users.fields.fullName"
        name="full_name"
        sortable
        render={(user) => (
          <Link to={`/users/users/${user.id}`}>
            <Text td="underline">{user.full_name}</Text>
          </Link>
        )}
      />

      <Table.Column
        title="fields.actions"
        name="_actions"
        width="80px"
        cellStyle={{ paddingRight: 0 }}
        render={(user) => <RoleUserContextActions roleId={id} user={user} />}
        cellAlign="end"
        headerAlign="end"
      />

      <Table.Selection
        selectionField="id"
        selectedRows={selection}
        onSelectionChange={setSelection}
        getRowLabel={(user) => user.full_name || user.email}
      />

      <Table.Footer.Left>
        <Pagination
          value={page}
          onChange={(newPage) => {
            setSelection([])
            setParams({ ...Object.fromEntries(params), page: newPage.toString() })
          }}
          total={Math.ceil((usersWithRole?.count ?? 0) / 20)}
          radius={100}
        />
      </Table.Footer.Left>

      <Table.Footer.Right>
        <Text size="sm" ta="right">
          {t("users.results", { shown: usersWithRole?.results.length ?? 0, total: usersWithRole?.full_count ?? 0 })}
        </Text>
      </Table.Footer.Right>
    </Table>
  )
}
