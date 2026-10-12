import { AlertError } from "@/components/AlertError"
import { FormFooter } from "@/components/FormFooter"
import { GeometryFileInput } from "@/components/Geometry"
import { RevisionConflictAlert } from "@/components/RevisionConflictAlert"
import { areaUsesApi, urbanGreenTypesApi, usageIntensitiesApi } from "@/modules/catalogs/api/catalogs"
import { CatalogSelect } from "@/modules/catalogs/components/CatalogSelect"
import { ClientSelect } from "@/modules/parties/components/ClientSelect"
import { transformErrorsForForm } from "@/utils"
import { isRevisionConflict } from "@/utils/tracking"
import { ApiError } from "@inmagik/react-crud/dist/crud/utils"
import { Box, Button, Checkbox, Group, Select, SimpleGrid, Stack, Text, Textarea, TextInput } from "@mantine/core"
import { DateInput } from "@mantine/dates"
import { useForm } from "@mantine/form"
import type { MultiPolygon, Polygon } from "geojson"
import { yupResolver } from "mantine-form-yup-resolver"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { TbDeviceFloppy } from "react-icons/tb"
import * as yup from "yup"
import { CENSUS_LEVELS, type Area, type AreaPayload, type CensusLevel } from "../types"
import { AreaGeometryCheck } from "./AreaGeometryCheck"
import { ZoneSelect } from "./ZoneSelect"
import { zoneLabel } from "./zoneModals"

type FormValues = {
  client: string | null
  zone: string | null
  number: string
  sub_number: string
  name: string
  is_fictitious: boolean
  urban_green_type: string | null
  area_use: string | null
  usage_intensity: string | null
  management_start: string | null
  management_end: string | null
  municipality_code: string
  street_code: string
  census_level: string | null
  surveyed_on: string | null
  public_excluded: boolean
  notes: string
  /** A new area only: the geometry of an area changes in its own tab. */
  geometry: Polygon | MultiPolygon | null
}

type Props = {
  /** The area shown or changed; none for a new area, whose form also has the geometry. */
  area?: Area
  /** The client of a new area, e.g. the one of the filter of the list. */
  defaultClient?: string | null
  onSubmit: (values: AreaPayload) => Promise<void> | void
  /** Reload the area after a revision conflict; the parent remounts the form with the new values. */
  onReload?: () => void
  readonly?: boolean
  layout?: "modal" | "page"
  onCancel?: () => void
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Stack gap="xs">
      <Text fw={600} size="sm">
        {title}
      </Text>
      {children}
    </Stack>
  )
}

export function AreaForm({
  area,
  defaultClient,
  onSubmit,
  onReload,
  readonly = false,
  layout = "modal",
  onCancel,
}: Props) {
  const { t } = useTranslation()
  const [isLoading, setIsLoading] = useState(false)
  const [conflict, setConflict] = useState(false)
  const isNew = !area
  const schema = yup.object({
    client: yup.string().nullable().required().label(t("territory.fields.client")),
    number: yup.string().trim().required().max(20).label(t("territory.fields.number")),
    sub_number: yup.string().trim().max(20).label(t("territory.fields.subNumber")),
    name: yup.string().trim().required().max(255).label(t("fields.name")),
    urban_green_type: yup.string().nullable().required().label(t("territory.fields.urbanGreenType")),
    area_use: yup.string().nullable().required().label(t("territory.fields.areaUse")),
    usage_intensity: yup.string().nullable().required().label(t("territory.fields.usageIntensity")),
    management_start: yup.string().nullable().required().label(t("territory.fields.managementStart")),
    management_end: yup
      .string()
      .nullable()
      .test(
        "after-start",
        t("territory.validation.managementEnd"),
        (value, context) => !value || !context.parent.management_start || value >= context.parent.management_start
      ),
    municipality_code: yup
      .string()
      .trim()
      .matches(/^(\d{5,6})?$/, t("territory.validation.municipalityCode")),
    street_code: yup.string().trim().max(30).label(t("territory.fields.streetCode")),
    geometry: isNew ? yup.mixed().nullable().required(t("territory.validation.geometry")) : yup.mixed().nullable(),
  })
  const form = useForm<FormValues>({
    mode: "controlled",
    initialValues: {
      client: area?.client ?? defaultClient ?? null,
      zone: area?.zone ?? null,
      number: area?.number ?? "",
      sub_number: area?.sub_number ?? "",
      name: area?.name ?? "",
      is_fictitious: area?.is_fictitious ?? false,
      urban_green_type: area?.urban_green_type ?? null,
      area_use: area?.area_use ?? null,
      usage_intensity: area?.usage_intensity ?? null,
      management_start: area?.management_start ?? null,
      management_end: area?.management_end ?? null,
      municipality_code: area?.municipality_code ?? "",
      street_code: area?.street_code ?? "",
      census_level: area?.census_level?.toString() ?? null,
      surveyed_on: area?.surveyed_on ?? null,
      public_excluded: area?.public_excluded ?? false,
      notes: area?.notes ?? "",
      geometry: null,
    },
    validate: yupResolver(schema),
  })
  const inputVariant = readonly ? "unstyled" : "default"
  const readonlyProps = { readOnly: readonly, variant: inputVariant }
  // A select in read-only mode, without the arrow; the selects keep their loader otherwise.
  const readonlySelectProps = readonly ? { readOnly: true, variant: "unstyled", rightSection: null } : {}
  const dateProps = { ...readonlyProps, valueFormat: "DD/MM/YYYY", clearable: !readonly }
  const cols = layout === "page" ? { base: 1, md: 2, lg: 3 } : { base: 1, sm: 2 }
  const { values } = form

  return (
    <form
      className={layout === "page" ? "h-100" : undefined}
      onSubmit={form.onSubmit(async (values) => {
        setIsLoading(true)
        try {
          // The schema checked the required values.
          await onSubmit({
            // The client does not change after the creation, and the geometry of an area changes in its own tab.
            ...(isNew ? { client: values.client!, geometry: values.geometry! } : {}),
            zone: values.zone,
            number: values.number.trim(),
            sub_number: values.sub_number.trim(),
            name: values.name.trim(),
            is_fictitious: values.is_fictitious,
            urban_green_type: values.urban_green_type!,
            area_use: values.area_use!,
            usage_intensity: values.usage_intensity!,
            management_start: values.management_start!,
            management_end: values.management_end || null,
            municipality_code: values.municipality_code.trim(),
            street_code: values.street_code.trim(),
            census_level: values.census_level ? (Number(values.census_level) as CensusLevel) : null,
            surveyed_on: values.surveyed_on || null,
            public_excluded: values.public_excluded,
            notes: values.notes,
          })
        } catch (error) {
          if (isRevisionConflict(error) && onReload) {
            setConflict(true)
          } else {
            form.setErrors(
              error instanceof ApiError
                ? transformErrorsForForm(error.data)
                : { non_field_errors: t("common.unexpectedError") }
            )
          }
        } finally {
          setIsLoading(false)
        }
      })}
    >
      <Stack justify="space-between" h={layout === "page" ? "100%" : undefined}>
        <Stack gap="lg" pb="sm" p={layout === "page" ? "xl" : undefined}>
          {(conflict && onReload) || form.errors.non_field_errors ? (
            <Box>
              {conflict && onReload && <RevisionConflictAlert onReload={onReload} mb="xs" />}
              {form.errors.non_field_errors && (
                <AlertError title={t("common.errorTitle")} message={form.errors.non_field_errors.toString()} />
              )}
            </Box>
          ) : null}
          <Section title={t("territory.sections.identification")}>
            <SimpleGrid cols={cols}>
              {area ? (
                <TextInput
                  label={t("territory.fields.client")}
                  description={readonly ? undefined : t("territory.clientImmutable")}
                  readOnly
                  variant="unstyled"
                  value={area.client_data.name}
                />
              ) : (
                <ClientSelect
                  activeOnly
                  withAsterisk
                  label={t("territory.fields.client")}
                  value={values.client}
                  onChange={(value) => {
                    form.setFieldValue("client", value)
                    // The zones are those of the client.
                    form.setFieldValue("zone", null)
                  }}
                  error={form.errors.client}
                />
              )}
              {readonly ? (
                <TextInput
                  label={t("territory.fields.zone")}
                  {...readonlyProps}
                  value={area?.zone_data ? zoneLabel(area.zone_data) : "—"}
                />
              ) : (
                <ZoneSelect
                  label={t("territory.fields.zone")}
                  client={values.client}
                  value={values.zone}
                  onChange={(value) => form.setFieldValue("zone", value)}
                  error={form.errors.zone}
                />
              )}
              <TextInput
                withAsterisk={!readonly}
                label={t("territory.fields.number")}
                {...readonlyProps}
                {...form.getInputProps("number")}
              />
              <TextInput
                label={t("territory.fields.subNumber")}
                description={readonly ? undefined : t("territory.fields.subNumberDescription")}
                {...readonlyProps}
                {...form.getInputProps("sub_number")}
              />
              <TextInput
                withAsterisk={!readonly}
                label={t("fields.name")}
                {...readonlyProps}
                {...form.getInputProps("name")}
              />
            </SimpleGrid>
          </Section>
          {isNew && (
            <Section title={t("territory.sections.geometry")}>
              <GeometryFileInput
                kind="polygon"
                withAsterisk
                label={t("territory.fields.geometryFile")}
                description={t("territory.fields.geometryFileDescription")}
                onChange={(geometry) => form.setFieldValue("geometry", geometry as Polygon | MultiPolygon | null)}
                error={form.errors.geometry}
              />
              {values.geometry && (
                <AreaGeometryCheck
                  geometry={values.geometry}
                  client={values.client}
                  managementStart={values.management_start}
                  managementEnd={values.management_end}
                  isFictitious={values.is_fictitious}
                />
              )}
            </Section>
          )}
          <Section title={t("territory.sections.classification")}>
            <SimpleGrid cols={cols}>
              <CatalogSelect
                api={urbanGreenTypesApi}
                withAsterisk={!readonly}
                label={t("territory.fields.urbanGreenType")}
                {...readonlySelectProps}
                value={values.urban_green_type}
                onChange={(value) => form.setFieldValue("urban_green_type", value)}
                error={form.errors.urban_green_type}
              />
              <CatalogSelect
                api={areaUsesApi}
                withAsterisk={!readonly}
                label={t("territory.fields.areaUse")}
                {...readonlySelectProps}
                value={values.area_use}
                onChange={(value) => form.setFieldValue("area_use", value)}
                error={form.errors.area_use}
              />
              <CatalogSelect
                api={usageIntensitiesApi}
                withAsterisk={!readonly}
                label={t("territory.fields.usageIntensity")}
                {...readonlySelectProps}
                value={values.usage_intensity}
                onChange={(value) => form.setFieldValue("usage_intensity", value)}
                error={form.errors.usage_intensity}
              />
              <Checkbox
                mt="md"
                label={t("territory.fields.isFictitious")}
                description={readonly ? undefined : t("territory.fields.isFictitiousDescription")}
                readOnly={readonly}
                {...form.getInputProps("is_fictitious", { type: "checkbox" })}
              />
            </SimpleGrid>
          </Section>
          <Section title={t("territory.sections.management")}>
            <SimpleGrid cols={cols}>
              <DateInput
                withAsterisk={!readonly}
                label={t("territory.fields.managementStart")}
                {...dateProps}
                {...form.getInputProps("management_start")}
              />
              <DateInput
                label={t("territory.fields.managementEnd")}
                description={readonly ? undefined : t("territory.fields.managementEndDescription")}
                {...dateProps}
                {...form.getInputProps("management_end")}
              />
              <TextInput
                label={t("territory.fields.municipalityCode")}
                description={readonly ? undefined : t("territory.fields.municipalityCodeDescription")}
                inputMode="numeric"
                {...readonlyProps}
                {...form.getInputProps("municipality_code")}
              />
              <TextInput
                label={t("territory.fields.streetCode")}
                {...readonlyProps}
                {...form.getInputProps("street_code")}
              />
              <Select
                label={t("territory.fields.censusLevel")}
                data={CENSUS_LEVELS.map((level) => ({
                  value: level.toString(),
                  label: t(`territory.censusLevels.${level}`),
                }))}
                clearable={!readonly}
                {...readonlyProps}
                rightSection={readonly ? null : undefined}
                {...form.getInputProps("census_level")}
              />
              <DateInput
                label={t("territory.fields.surveyedOn")}
                {...dateProps}
                {...form.getInputProps("surveyed_on")}
              />
              <Checkbox
                mt="md"
                label={t("territory.fields.publicExcluded")}
                description={readonly ? undefined : t("territory.fields.publicExcludedDescription")}
                readOnly={readonly}
                {...form.getInputProps("public_excluded", { type: "checkbox" })}
              />
            </SimpleGrid>
            <Textarea
              label={t("fields.notes")}
              autosize
              minRows={2}
              {...readonlyProps}
              {...form.getInputProps("notes")}
            />
          </Section>
        </Stack>
        {!readonly &&
          (layout === "page" ? (
            <FormFooter>
              <Group justify="space-between" p="sm" className="standard-border-top">
                <Button
                  variant="subtle"
                  color="gray.7"
                  onClick={() => {
                    form.reset()
                    setConflict(false)
                    onCancel?.()
                  }}
                >
                  {t("common.cancel")}
                </Button>
                <Button leftSection={<TbDeviceFloppy />} type="submit" loading={isLoading}>
                  {t("common.save")}
                </Button>
              </Group>
            </FormFooter>
          ) : (
            <Group justify="flex-end" pt="sm">
              <Button type="submit" loading={isLoading}>
                {t("common.confirm")}
              </Button>
            </Group>
          ))}
      </Stack>
    </form>
  )
}
