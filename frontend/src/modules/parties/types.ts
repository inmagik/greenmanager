import type { TrackedRecord } from "@/utils/tracking"

export const CLIENT_KINDS = ["public_body", "public_company", "condominium", "company", "private", "other"] as const
export type ClientKind = (typeof CLIENT_KINDS)[number]

// Reference systems of the CAM export (RDN2008), as EPSG codes.
export const CAM_EXPORT_SRIDS = [6706, 7791, 7792, 7793, 7794] as const
export type CamExportSrid = (typeof CAM_EXPORT_SRIDS)[number]

export type Client = TrackedRecord & {
  id: string
  name: string
  kind: ClientKind
  istat_code: string
  tax_code: string
  managing_organization: number
  managing_organization_data: { id: number; name: string }
  contacts: string
  cam_export_srid: CamExportSrid | null
  active: boolean
  notes: string
}

/** The data of the form; `active` changes with the deactivate and reactivate actions. */
export type ClientPayload = Pick<
  Client,
  "name" | "kind" | "istat_code" | "tax_code" | "contacts" | "cam_export_srid" | "notes"
>

/** A client in the selects (`choices/`). */
export type ClientChoice = Pick<Client, "id" | "name" | "kind" | "istat_code" | "active">
