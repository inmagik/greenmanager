import { FileInput, type FileInputProps } from "@mantine/core"
import type { Geometry } from "geojson"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { TbFileUpload } from "react-icons/tb"
import { GeometryFileError, readGeometryFile, type GeometryKind } from "./readGeometryFile"

type Props = Omit<FileInputProps, "value" | "onChange" | "accept" | "multiple"> & {
  kind: GeometryKind
  /** The geometry read from the file, `null` when the file is removed or cannot be read. */
  onChange: (geometry: Geometry | null) => void
}

/**
 * Read a geometry from a GeoJSON file (`.geojson`, `.json`), in WGS84: the import of a geometry without the map
 * (AR-2). Features of the same kind become one multipart geometry. The server checks the geometry again.
 */
export function GeometryFileInput({ kind, onChange, error, ...props }: Props) {
  const { t } = useTranslation()
  const [file, setFile] = useState<File | null>(null)
  const [readError, setReadError] = useState<string | null>(null)

  return (
    <FileInput
      clearable
      clearButtonProps={{ "aria-label": t("common.clear") }}
      leftSection={<TbFileUpload />}
      placeholder={t("geometry.filePlaceholder")}
      {...props}
      accept=".geojson,.json,application/geo+json,application/json"
      value={file}
      onChange={async (selected) => {
        setFile(selected)
        setReadError(null)
        if (!selected) {
          onChange(null)
          return
        }
        try {
          onChange(await readGeometryFile(selected, kind))
        } catch (exc) {
          const fileError = exc instanceof GeometryFileError ? exc : new GeometryFileError("notJSON")
          setReadError(
            t(`geometry.fileErrors.${fileError.code}`, {
              ...fileError.params,
              kind: t(`geometry.kinds.${kind}`),
            })
          )
          onChange(null)
        }
      }}
      error={readError ?? error}
    />
  )
}
