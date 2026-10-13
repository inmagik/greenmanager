import { AlertError } from "@/components/AlertError"
import { FormFooter } from "@/components/FormFooter"
import { RevisionConflictAlert } from "@/components/RevisionConflictAlert"
import { elementClassesApi } from "@/modules/catalogs/api/catalogs"
import { ElementClassSelect } from "@/modules/catalogs/components/ElementClassSelect"
import { SpeciesSelect } from "@/modules/catalogs/components/SpeciesSelect"
import { speciesLabel } from "@/modules/catalogs/fields"
import type { ElementClassChoice, GeometryType, SpeciesMode } from "@/modules/catalogs/types"
import { useHasPermission } from "@/hooks/useHasPermission"
import { ClientSelect } from "@/modules/parties/components/ClientSelect"
import { AreaSelect } from "@/modules/territory/components/AreaSelect"
import { areaLabel } from "@/modules/territory/components/areaModals"
import { useArea } from "@/modules/territory/api/areas"
import { TERRITORY_PERMISSIONS } from "@/modules/territory/permissions"
import { transformErrorsForForm } from "@/utils"
import { isRevisionConflict } from "@/utils/tracking"
import { ApiError } from "@inmagik/react-crud/dist/crud/utils"
import {
  Anchor,
  Box,
  Button,
  Checkbox,
  Group,
  Input,
  NumberInput,
  SegmentedControl,
  SimpleGrid,
  Stack,
  Text,
  Textarea,
  TextInput,
} from "@mantine/core"
import { DateInput } from "@mantine/dates"
import { useForm, type FormErrors } from "@mantine/form"
import { useDebouncedValue } from "@mantine/hooks"
import { yupResolver } from "mantine-form-yup-resolver"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { TFunction } from "i18next"
import { useTranslation } from "react-i18next"
import { TbDeviceFloppy, TbMapPin } from "react-icons/tb"
import { Link } from "react-router-dom"
import * as yup from "yup"
import { attributesPayload, editableAttributes, isEmptyAttribute, type AttributeFormValue } from "../attributes"
import { compositionRow, totalPercentage, type CompositionRow } from "../composition"
import {
  emptyPosition,
  isNumber,
  positionGeometry,
  positionPayload,
  positionSchema,
  type PositionValue,
} from "../position"
import type { Element, ElementPayload } from "../types"
import { AttributesFields } from "./AttributesFields"
import { CompositionEditor } from "./CompositionEditor"
import { ElementGeometryCheck } from "./ElementGeometryCheck"
import { ElementSelect } from "./ElementSelect"
import { PositionInput } from "./PositionInput"

/** How the species of the element is given: none, a single species or a composition, as the class asks. */
type SpeciesInput = "none" | "single" | "composition"

type FormValues = {
  client: string | null
  area: string | null
  element_class: string | null
  tag_number: string
  /** The choice of a class with `single_or_composition`. */
  species_choice: "single" | "composition"
  species: string | null
  composition: CompositionRow[]
  attributes: Record<string, AttributeFormValue>
  estimated_count: number | string
  planted_on: string | null
  planted_on_estimated: boolean
  replaces: string | null
  surveyed_on: string | null
  public_excluded: boolean
  notes: string
  /** A new element only: the position of an element changes in its own tab. */
  position: PositionValue
}

type Props = {
  /** The element shown or changed; none for a new element, whose form also has the position. */
  element?: Element
  /** The client and the area of a new element, e.g. those of the filters of the list or of the area. */
  defaultClient?: string | null
  defaultArea?: string | null
  /**
   * The class of a new element, chosen before the position, e.g. on the map page. With `mapPosition` the form follows
   * it when it changes, and gives the class chosen in the form to `onClassChange`.
   */
  defaultClass?: ElementClassChoice | null
  onClassChange?: (choice: ElementClassChoice) => void
  /**
   * The position of a new element given on the map page: the form shows it, with its check and the button to change
   * it, instead of its inputs. The class changes only among those with its type of geometry.
   */
  mapPosition?: { value: PositionValue; onEdit: () => void }
  onSubmit: (values: ElementPayload) => Promise<void> | void
  /** Reload the element after a revision conflict; the parent remounts the form with the new values. */
  onReload?: () => void
  readonly?: boolean
  /** `panel`: one column, e.g. in the panel of the map page. */
  layout?: "modal" | "page" | "panel"
  onCancel?: () => void
}

function speciesInput(mode: SpeciesMode | undefined, choice: FormValues["species_choice"]): SpeciesInput {
  if (mode === "single_or_composition") return choice
  if (mode === "single" || mode === "composition") return mode
  return "none"
}

function allowsComposition(mode: SpeciesMode | undefined) {
  return mode === "composition" || mode === "single_or_composition"
}

/** The position given on the map page: from the device with its accuracy, a point, or lines and polygons drawn. */
function mapPositionLabel(t: TFunction, value: PositionValue): string {
  if (value.mode === "coordinates" && value.gpsAccuracy !== null) {
    return t("inventory.position.gpsReading", { value: Math.round(value.gpsAccuracy) })
  }
  if (value.geometry?.type === "Point") {
    const [longitude, latitude] = value.geometry.coordinates
    return t("inventory.position.mapPoint", { latitude: latitude.toFixed(7), longitude: longitude.toFixed(7) })
  }
  return t("inventory.position.mapDrawn")
}

function toNumber(value: number | string): number | null {
  if (value === "" || value === null) return null
  const number = Number(value)
  return Number.isFinite(number) ? number : null
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

/** A read-only value with a link, e.g. the area of the element in its detail. */
function LinkValue({ label, to, children }: { label: string; to: string; children: React.ReactNode }) {
  return (
    <Input.Wrapper label={label}>
      <Box py={6}>
        <Anchor component={Link} to={to} size="sm">
          {children}
        </Anchor>
      </Box>
    </Input.Wrapper>
  )
}

/**
 * The form of an element, driven by its class (EL-1, EL-3, EL-5): the species or the composition as the class asks
 * (`species_mode`), and the attributes of the class. A new element has its position too, with the proposed area and
 * the warnings of `geometry-check/`; a saved element changes it in the position tab.
 */
export function ElementForm({
  element,
  defaultClient,
  defaultArea,
  defaultClass,
  onClassChange,
  mapPosition,
  onSubmit,
  onReload,
  readonly = false,
  layout = "modal",
  onCancel,
}: Props) {
  const { t } = useTranslation()
  const [isLoading, setIsLoading] = useState(false)
  const [conflict, setConflict] = useState(false)
  // A part being drawn is not in the geometry yet: saving would lose it.
  const [drawing, setDrawing] = useState(false)
  // The class just chosen: its geometry, species mode and attributes drive the form before its detail loads.
  const [classChoice, setClassChoice] = useState<ElementClassChoice | null>(defaultClass ?? null)
  const isNew = !element
  const canReadAreas = useHasPermission(TERRITORY_PERMISSIONS.READ_AREAS)
  const form = useForm<FormValues>({
    mode: "controlled",
    initialValues: {
      client: element?.client ?? defaultClient ?? null,
      area: element?.area ?? defaultArea ?? null,
      element_class: element?.element_class ?? defaultClass?.id ?? null,
      tag_number: element?.tag_number ?? "",
      species_choice: element?.composition.length ? "composition" : "single",
      species: element?.species ?? null,
      composition: (element?.composition ?? []).map((item) =>
        compositionRow({
          species: item.species,
          species_data: item.species_data,
          quantity: item.quantity ?? "",
          percentage: item.percentage === null ? "" : Number(item.percentage),
        })
      ),
      attributes: element?.attributes ?? {},
      estimated_count: element?.estimated_count ?? "",
      planted_on: element?.planted_on ?? null,
      planted_on_estimated: element?.planted_on_estimated ?? false,
      replaces: element?.replaces ?? null,
      surveyed_on: element?.surveyed_on ?? null,
      public_excluded: element?.public_excluded ?? false,
      notes: element?.notes ?? "",
      position: emptyPosition(element?.element_class_data.geometry_type ?? defaultClass?.geometry_type),
    },
    validate: (values: FormValues): FormErrors => yupResolver(schemaFor(values))(values),
  })
  const { values } = form

  // The class of the form: the one just chosen, its detail, or the summary of the saved one.
  const { data: classEntry } = elementClassesApi.useEntry(values.element_class ?? undefined)
  const chosen = classChoice?.id === values.element_class ? classChoice : null
  const savedClass = values.element_class === element?.element_class ? element?.element_class_data : undefined
  const geometryType: GeometryType | undefined =
    chosen?.geometry_type ?? classEntry?.geometry_type ?? savedClass?.geometry_type
  const speciesMode: SpeciesMode | undefined =
    chosen?.species_mode ?? classEntry?.species_mode ?? savedClass?.species_mode
  const classAttributes = chosen?.class_attributes ?? classEntry?.class_attributes
  const species = speciesInput(speciesMode, values.species_choice)
  function chooseClass(value: string | null, choice: ElementClassChoice | null) {
    form.setFieldValue("element_class", value)
    setClassChoice(choice)
    if (!choice) return
    if (isNew && !mapPosition && choice.geometry_type !== geometryType) {
      form.setFieldValue("position", emptyPosition(choice.geometry_type))
    }
    if (choice.species_mode === "composition") form.setFieldValue("species_choice", "composition")
    if (choice.species_mode === "single") form.setFieldValue("species_choice", "single")
  }

  // On the map page the class changes also in the step before the form, which meanwhile is hidden: the form follows it,
  // only when that class changes.
  const mapClass = mapPosition ? defaultClass : null
  useEffect(() => {
    if (!mapClass || mapClass.id === form.getValues().element_class) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    chooseClass(mapClass.id, mapClass)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapClass])

  // The attributes are sent when they or the class change: a change of other data does not depend on them (D-051).
  const classChanged = !!element && values.element_class !== element.element_class
  // Another area or class changes the warnings of the saved position: they are checked before saving.
  const areaChanged = !!element && values.area !== element.area
  const sendAttributes =
    !!classAttributes &&
    (isNew ||
      classChanged ||
      JSON.stringify(attributesPayload(classAttributes, values.attributes)) !==
        JSON.stringify(attributesPayload(classAttributes, element.attributes)))

  function schemaFor(current: FormValues): yup.AnyObjectSchema {
    const mode = speciesInput(speciesMode, current.species_choice)
    const requiredAttributes = sendAttributes
      ? editableAttributes(classAttributes ?? []).filter((link) => link.required)
      : []
    return yup.object({
      client: yup.string().nullable().required().label(t("inventory.fields.client")),
      area: yup.string().nullable().required().label(t("inventory.fields.area")),
      element_class: yup.string().nullable().required().label(t("inventory.fields.elementClass")),
      tag_number: yup.string().trim().max(50).label(t("inventory.fields.tagNumber")),
      species:
        mode === "single"
          ? yup.string().nullable().required().label(t("inventory.fields.species"))
          : yup.string().nullable(),
      composition:
        mode === "composition"
          ? yup
              .array(
                yup.object({
                  species: yup.string().nullable().required(t("inventory.validation.compositionSpecies")),
                  quantity: yup
                    .mixed()
                    .test(
                      "quantity-or-percentage",
                      t("inventory.validation.compositionQuantity"),
                      (value, context) => isNumber(value) || isNumber(context.parent.percentage)
                    ),
                })
              )
              .test(
                "unique",
                t("inventory.validation.compositionDuplicated"),
                (rows) => new Set(rows?.map((row) => row.species)).size === (rows?.length ?? 0)
              )
              .test(
                "percentages",
                t("inventory.validation.compositionOver100"),
                (rows) => totalPercentage((rows ?? []) as CompositionRow[]) <= 100
              )
          : yup.array(),
      attributes: yup.object(
        Object.fromEntries(
          requiredAttributes.map((link) => [
            link.attribute_data.code,
            yup.mixed().test("required", t("serverErrors.attribute_required"), (value) => !isEmptyAttribute(value)),
          ])
        )
      ),
      estimated_count: yup
        .mixed()
        .test(
          "count",
          t("validation.number.min", { field: t("inventory.fields.estimatedCount"), min: 0 }),
          (value) => value === "" || (isNumber(value) && value >= 0)
        ),
      position: isNew && geometryType && !mapPosition ? positionSchema(t) : yup.mixed(),
    })
  }

  // The position of the map page, or of the inputs of the form.
  const positionValue = mapPosition?.value ?? values.position
  // The position checked with the server: after a pause in the typing of the coordinates, and the same object for
  // the same values, which the key of the check counts.
  const [position] = useDebouncedValue(positionValue, 400)
  const { mode, latitude, longitude, geometry: fileGeometry } = position
  const geometry = useMemo(
    () => positionGeometry({ mode, latitude, longitude, gpsAccuracy: null, geometry: fileGeometry }),
    [mode, latitude, longitude, fileGeometry]
  )
  const { setFieldValue } = form
  const chooseArea = useCallback((area: { id: string }) => setFieldValue("area", area.id), [setFieldValue])
  // A proposal fills an empty area once: an area emptied by the user stays empty until another one is proposed, also
  // when the check is mounted again (e.g. after coordinates not valid for a moment).
  const proposedArea = useRef<string | null>(null)
  const { getValues } = form
  const fillEmptyArea = useCallback(
    (area: { id: string }) => {
      if (proposedArea.current === area.id) return
      proposedArea.current = area.id
      if (!getValues().area) setFieldValue("area", area.id)
    },
    [getValues, setFieldValue]
  )

  const inputVariant = readonly ? "unstyled" : "default"
  const readonlyProps = { readOnly: readonly, variant: inputVariant }
  const readonlySelectProps = readonly ? { readOnly: true, variant: "unstyled", rightSection: null } : {}
  const dateProps = { ...readonlyProps, valueFormat: "DD/MM/YYYY", clearable: !readonly }
  const cols = layout === "page" ? { base: 1, md: 2, lg: 3 } : layout === "panel" ? { base: 1 } : { base: 1, sm: 2 }
  // The area of a new element, under the position drawn on the map, for those who read the areas.
  const { data: areaDetail } = useArea(isNew && canReadAreas && values.area ? values.area : undefined)
  const areaGeometry = areaDetail?.id === values.area ? areaDetail?.geometry : undefined
  const mapContext = useMemo(() => (areaGeometry ? [areaGeometry] : []), [areaGeometry])
  const errors = form.errors

  return (
    <form
      className={layout === "page" ? "h-100" : undefined}
      onSubmit={form.onSubmit(async (values) => {
        setIsLoading(true)
        try {
          // The schema checked the required values.
          await onSubmit({
            ...(isNew ? positionPayload(positionValue) : {}),
            area: values.area!,
            element_class: values.element_class!,
            tag_number: values.tag_number.trim(),
            species: species === "single" ? values.species : null,
            // The composition replaces the whole list: empty, when the element has a single species or none.
            composition:
              species === "composition"
                ? values.composition.map((row) => ({
                    species: row.species!,
                    quantity: toNumber(row.quantity),
                    percentage: toNumber(row.percentage),
                  }))
                : [],
            ...(sendAttributes && classAttributes
              ? { attributes: attributesPayload(classAttributes, values.attributes) }
              : {}),
            estimated_count: allowsComposition(speciesMode) ? toNumber(values.estimated_count) : null,
            planted_on: values.planted_on || null,
            planted_on_estimated: values.planted_on_estimated,
            replaces: values.replaces,
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
          {(conflict && onReload) || errors.non_field_errors ? (
            <Box>
              {conflict && onReload && <RevisionConflictAlert onReload={onReload} mb="xs" />}
              {errors.non_field_errors && (
                <AlertError title={t("common.errorTitle")} message={errors.non_field_errors.toString()} />
              )}
            </Box>
          ) : null}
          <Section title={t("inventory.sections.identification")}>
            <SimpleGrid cols={cols}>
              {element ? (
                <TextInput
                  label={t("inventory.fields.client")}
                  description={readonly ? undefined : t("inventory.clientImmutable")}
                  readOnly
                  variant="unstyled"
                  value={element.client_data.name}
                />
              ) : (
                <ClientSelect
                  activeOnly
                  withAsterisk
                  label={t("inventory.fields.client")}
                  value={values.client}
                  onChange={(value) => {
                    form.setFieldValue("client", value)
                    // The areas and the replaced elements are those of the client.
                    form.setFieldValue("area", null)
                    form.setFieldValue("replaces", null)
                  }}
                  error={errors.client}
                />
              )}
              {readonly && element ? (
                // The detail of the area is for those who read the areas.
                canReadAreas ? (
                  <LinkValue label={t("inventory.fields.area")} to={`/territory/areas/${element.area}`}>
                    {areaLabel(element.area_data)}
                  </LinkValue>
                ) : (
                  <TextInput
                    label={t("inventory.fields.area")}
                    readOnly
                    variant="unstyled"
                    value={areaLabel(element.area_data)}
                  />
                )
              ) : (
                <AreaSelect
                  withAsterisk
                  label={t("inventory.fields.area")}
                  client={values.client}
                  value={values.area}
                  onChange={(value) => form.setFieldValue("area", value)}
                  error={errors.area}
                />
              )}
              <ElementClassSelect
                withAsterisk={!readonly}
                label={t("inventory.fields.elementClass")}
                // The position of a saved element, or given on the map, stays: the class changes among those of the
                // same geometry.
                filters={
                  element
                    ? { geometry_type: element.element_class_data.geometry_type }
                    : mapPosition && defaultClass
                      ? { geometry_type: defaultClass.geometry_type }
                      : undefined
                }
                {...readonlySelectProps}
                value={values.element_class}
                onChange={(value, choice) => {
                  chooseClass(value, choice)
                  if (choice) onClassChange?.(choice)
                }}
                error={errors.element_class}
              />
              {element && (
                <TextInput label={t("inventory.fields.code")} readOnly variant="unstyled" value={element.code} />
              )}
              <TextInput
                label={t("inventory.fields.tagNumber")}
                description={readonly ? undefined : t("inventory.fields.tagNumberDescription")}
                {...readonlyProps}
                {...form.getInputProps("tag_number")}
              />
            </SimpleGrid>
            {element && !readonly && values.element_class && (areaChanged || classChanged) && (
              <ElementGeometryCheck
                elementClass={values.element_class}
                geometry={element.geometry}
                client={element.client}
                area={values.area}
                element={element.id}
                onUseArea={chooseArea}
              />
            )}
          </Section>
          {isNew && geometryType && (
            <Section title={t("inventory.sections.position")}>
              {mapPosition ? (
                <Group gap="xs" justify="space-between">
                  <Text size="sm">{mapPositionLabel(t, mapPosition.value)}</Text>
                  <Button size="compact-sm" variant="light" leftSection={<TbMapPin />} onClick={mapPosition.onEdit}>
                    {t("inventory.position.change")}
                  </Button>
                </Group>
              ) : (
                <PositionInput
                  key={geometryType}
                  geometryType={geometryType}
                  value={values.position}
                  onChange={(value) => form.setFieldValue("position", value)}
                  mapContext={mapContext}
                  onDrawing={setDrawing}
                  errors={{
                    latitude: errors["position.latitude"],
                    longitude: errors["position.longitude"],
                    geometry: errors["position.geometry"] ?? errors.geometry,
                    source: errors.location_source ?? errors.location_accuracy_m,
                  }}
                />
              )}
              {mapPosition && (errors.geometry || errors.location_source) && (
                <Text size="sm" c="red">
                  {errors.geometry ?? errors.location_source}
                </Text>
              )}
              {geometry && values.element_class && (
                <ElementGeometryCheck
                  elementClass={values.element_class}
                  geometry={geometry}
                  client={values.client}
                  area={values.area}
                  onUseArea={chooseArea}
                  onSuggestedArea={fillEmptyArea}
                />
              )}
            </Section>
          )}
          {species !== "none" && (
            <Section title={t("inventory.sections.species")}>
              {speciesMode === "single_or_composition" && !readonly && (
                <SegmentedControl
                  aria-label={t("inventory.sections.species")}
                  data={(["single", "composition"] as const).map((choice) => ({
                    value: choice,
                    label: t(`inventory.speciesModes.${choice}`),
                  }))}
                  value={values.species_choice}
                  onChange={(choice) => form.setFieldValue("species_choice", choice as FormValues["species_choice"])}
                  style={{ alignSelf: "flex-start" }}
                />
              )}
              {species === "single" &&
                (readonly ? (
                  <TextInput
                    label={t("inventory.fields.species")}
                    readOnly
                    variant="unstyled"
                    value={element?.species_data ? speciesLabel(element.species_data) : "—"}
                  />
                ) : (
                  <Box maw={480}>
                    <SpeciesSelect
                      withAsterisk
                      label={t("inventory.fields.species")}
                      value={values.species}
                      onChange={(value) => form.setFieldValue("species", value)}
                      error={errors.species}
                    />
                  </Box>
                ))}
              {species === "composition" && (
                <CompositionEditor
                  label={t("inventory.fields.composition")}
                  value={values.composition}
                  onChange={(rows) => form.setFieldValue("composition", rows)}
                  readonly={readonly}
                  errors={errors}
                />
              )}
              {species !== "composition" && errors.composition && (
                <Text size="sm" c="red">
                  {errors.composition}
                </Text>
              )}
              {allowsComposition(speciesMode) && (
                <SimpleGrid cols={cols}>
                  <NumberInput
                    label={t("inventory.fields.estimatedCount")}
                    description={readonly ? undefined : t("inventory.fields.estimatedCountDescription")}
                    allowDecimal={false}
                    min={0}
                    {...readonlyProps}
                    {...form.getInputProps("estimated_count")}
                  />
                </SimpleGrid>
              )}
            </Section>
          )}
          {values.element_class && (classAttributes === undefined || classAttributes.length > 0) && (
            <Section title={t("inventory.sections.attributes")}>
              <AttributesFields
                classAttributes={classAttributes}
                values={values.attributes}
                saved={element?.attributes ?? {}}
                onChange={(code, value) => form.setFieldValue("attributes", { ...values.attributes, [code]: value })}
                readonly={readonly}
                errors={errors}
                cols={cols}
              />
            </Section>
          )}
          <Section title={t("inventory.sections.planting")}>
            <SimpleGrid cols={cols}>
              <DateInput label={t("inventory.fields.plantedOn")} {...dateProps} {...form.getInputProps("planted_on")} />
              <Checkbox
                mt="md"
                label={t("inventory.fields.plantedOnEstimated")}
                description={readonly ? undefined : t("inventory.fields.plantedOnEstimatedDescription")}
                readOnly={readonly}
                {...form.getInputProps("planted_on_estimated", { type: "checkbox" })}
              />
              {readonly ? (
                element?.replaces_data ? (
                  <LinkValue
                    label={t("inventory.fields.replaces")}
                    to={`/inventory/elements/${element.replaces_data.id}`}
                  >
                    {element.replaces_data.code}
                  </LinkValue>
                ) : (
                  <TextInput label={t("inventory.fields.replaces")} readOnly variant="unstyled" value="—" />
                )
              ) : (
                <ElementSelect
                  label={t("inventory.fields.replaces")}
                  description={t("inventory.fields.replacesDescription")}
                  client={values.client}
                  value={values.replaces}
                  valueCaption={
                    element?.replaces_data && values.replaces === element.replaces
                      ? element.replaces_data.code
                      : undefined
                  }
                  exclude={element?.id}
                  onChange={(value) => form.setFieldValue("replaces", value)}
                  error={errors.replaces}
                />
              )}
              <DateInput
                label={t("inventory.fields.surveyedOn")}
                description={readonly || element ? undefined : t("inventory.fields.surveyedOnDescription")}
                {...dateProps}
                {...form.getInputProps("surveyed_on")}
              />
            </SimpleGrid>
          </Section>
          <Section title={t("inventory.sections.other")}>
            <Checkbox
              label={t("inventory.fields.publicExcluded")}
              readOnly={readonly}
              {...form.getInputProps("public_excluded", { type: "checkbox" })}
            />
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
                    setClassChoice(null)
                    setConflict(false)
                    onCancel?.()
                  }}
                >
                  {t("common.cancel")}
                </Button>
                <Button leftSection={<TbDeviceFloppy />} type="submit" loading={isLoading} disabled={drawing}>
                  {t("common.save")}
                </Button>
              </Group>
            </FormFooter>
          ) : (
            <Group justify="flex-end" pt="sm">
              <Button type="submit" loading={isLoading} disabled={drawing}>
                {t("common.confirm")}
              </Button>
            </Group>
          ))}
      </Stack>
    </form>
  )
}
