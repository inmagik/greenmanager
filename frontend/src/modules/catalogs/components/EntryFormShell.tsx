import { AlertError } from "@/components/AlertError"
import { FormFooter } from "@/components/FormFooter"
import { RevisionConflictAlert } from "@/components/RevisionConflictAlert"
import { splitApiErrors } from "@/utils"
import { isRevisionConflict } from "@/utils/tracking"
import { Box, Button, Group, Stack } from "@mantine/core"
import type { UseFormReturnType } from "@mantine/form"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { TbDeviceFloppy } from "react-icons/tb"

type Props<Values extends Record<string, unknown>> = {
  form: UseFormReturnType<Values>
  onSubmit: (values: Values) => Promise<void> | void
  onReload?: () => void
  readonly: boolean
  layout: "modal" | "page"
  onCancel?: () => void
  children: React.ReactNode
}

/**
 * The frame of the forms of the catalogs: submit, errors of the server, revision conflict, buttons.
 *
 * The errors of fields the form has go on the fields; the others, and the errors of the whole request, above the
 * fields.
 */
export function EntryFormShell<Values extends Record<string, unknown>>({
  form,
  onSubmit,
  onReload,
  readonly,
  layout,
  onCancel,
  children,
}: Props<Values>) {
  const { t } = useTranslation()
  const [isLoading, setIsLoading] = useState(false)
  const [conflict, setConflict] = useState(false)

  return (
    <form
      className={layout === "page" ? "h-100" : undefined}
      onSubmit={form.onSubmit(async (values) => {
        setIsLoading(true)
        try {
          await onSubmit(values)
        } catch (error) {
          if (isRevisionConflict(error) && onReload) {
            setConflict(true)
          } else {
            const { fieldErrors, message } = splitApiErrors(error, Object.keys(form.values))
            form.setErrors(message ? { ...fieldErrors, non_field_errors: message } : fieldErrors)
          }
        } finally {
          setIsLoading(false)
        }
      })}
    >
      <Stack justify="space-between" h={layout === "page" ? "100%" : undefined}>
        <Box pb="sm" p={layout === "page" ? "xl" : undefined}>
          {conflict && onReload && <RevisionConflictAlert onReload={onReload} mb="xs" />}
          {form.errors.non_field_errors && (
            <AlertError title={t("common.errorTitle")} message={form.errors.non_field_errors.toString()} mb="xs" />
          )}
          {children}
        </Box>
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
