import { CloseButton, Combobox, InputBase, useCombobox } from "@mantine/core"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { TbChevronDown } from "react-icons/tb"

export type AsyncSelectProps = {
  value: string
  searchValue: string | null
  defaultCaption?: string
  onSearchChange: (value: string | null) => void
  onChange: (value: string | null, option: { value: string; label: string } | null) => void
  options: { value: string; label: string }[]
  placeholder?: string
  /** Accessible name of the input, when there is no visible label. By default the placeholder. */
  ariaLabel?: string
  error?: React.ReactNode
  disabled?: boolean
}

export function AsyncSelect({
  searchValue,
  onSearchChange,
  value,
  onChange,
  options,
  defaultCaption,
  placeholder,
  ariaLabel,
  error,
  disabled,
}: AsyncSelectProps) {
  const { t } = useTranslation()
  const [lastValue, setLastValue] = useState<{ value: string; label: string } | null>(null)

  const combobox = useCombobox({
    onDropdownClose: () => {
      combobox.resetSelectedOption()
      combobox.focusTarget()
      onSearchChange(null)
    },

    onDropdownOpen: () => {
      combobox.focusSearchInput()
      onSearchChange("")
    },
  })

  const optNodes = options.map((item) => (
    <Combobox.Option value={item.value} key={item.value}>
      {item.label}
    </Combobox.Option>
  ))

  const valueCaption = lastValue && value?.toString() === lastValue?.value ? lastValue.label : defaultCaption
  const inputCaption = searchValue ?? valueCaption ?? ""

  return (
    <Combobox
      store={combobox}
      withinPortal={false}
      onOptionSubmit={(val) => {
        const opt = options.find((o) => o.value === val) ?? null
        setLastValue(opt)
        onChange(val, opt)
        combobox.closeDropdown()
      }}
    >
      <Combobox.Target>
        <InputBase
          size="sm"
          rightSectionProps={{
            style: {
              width: value ? "3rem" : undefined,
            },
          }}
          rightSection={
            <>
              {!!value && (
                <CloseButton
                  size="sm"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={(event) => {
                    event.stopPropagation()
                    setLastValue(null)
                    onChange(null, null)
                    onSearchChange(null)
                    combobox.closeDropdown()
                  }}
                  aria-label={t("common.clear")}
                />
              )}
              <TbChevronDown
                onClick={(event) => {
                  event.stopPropagation()
                  combobox.toggleDropdown()
                }}
              />
            </>
          }
          onClick={() => combobox.toggleDropdown()}
          onChange={(e) => {
            combobox.openDropdown()
            onSearchChange(e.target.value)
          }}
          value={inputCaption}
          placeholder={placeholder}
          aria-label={ariaLabel ?? placeholder}
          error={error}
          disabled={disabled}
        ></InputBase>
      </Combobox.Target>

      <Combobox.Dropdown>
        <Combobox.Options>
          {optNodes.length > 0 ? optNodes : <Combobox.Empty>{t("common.noResults")}</Combobox.Empty>}
        </Combobox.Options>
      </Combobox.Dropdown>
    </Combobox>
  )
}
