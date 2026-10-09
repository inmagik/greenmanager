import { Select } from "@mantine/core"
import { useTranslation } from "react-i18next"
import { supportedLanguages, type SupportedLanguage } from "@/i18n"

type Props = { compact?: boolean; className?: string; size?: "xs" | "sm" }

const languageLabels: Record<SupportedLanguage, string> = {
  it: "🇮🇹 Italiano",
}

export function LanguageSelector({ compact = false, className, size = "xs" }: Props) {
  const { t, i18n } = useTranslation()
  const language = (i18n.resolvedLanguage ?? "it") as SupportedLanguage

  // Hidden while the interface has a single language (frontend.md §6).
  if (supportedLanguages.length < 2) {
    return null
  }

  return (
    <Select
      className={className}
      size={size}
      w={compact ? 100 : "100%"}
      aria-label={t("language.label")}
      label={compact ? undefined : t("language.label")}
      allowDeselect={false}
      value={language}
      data={supportedLanguages.map((value) => ({ value, label: languageLabels[value] }))}
      onChange={(value) => value && void i18n.changeLanguage(value)}
    />
  )
}
