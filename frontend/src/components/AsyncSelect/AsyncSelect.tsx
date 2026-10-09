import { Combobox, InputBase, useCombobox } from "@mantine/core"
import { useState } from "react"
import { TbChevronDown, TbX } from "react-icons/tb"

export type AsyncSelectProps = {
  value: string
  searchValue: string | null
  defaultCaption?: string
  onSearchChange: (value: string | null) => void
  onChange: (value: string | null, option: { value: string; label: string } | null) => void
  options: { value: string; label: string }[]
  placeholder?: string
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
  error,
  disabled,
}: AsyncSelectProps) {
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
                <TbX
                  size="14px"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={(event) => {
                    event.stopPropagation()
                    setLastValue(null)
                    onChange(null, null)
                    onSearchChange(null)
                    combobox.closeDropdown()
                  }}
                  aria-label="Cancella"
                  style={{ color: "var(--mantine-color-gray-7)" }}
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
            onSearchChange(e.target.value)
          }}
          value={inputCaption}
          placeholder={placeholder}
          error={error}
          disabled={disabled}
        ></InputBase>
      </Combobox.Target>

      <Combobox.Dropdown>
        <Combobox.Options>
          {optNodes.length > 0 ? optNodes : <Combobox.Empty>Nessun risultato</Combobox.Empty>}
        </Combobox.Options>
      </Combobox.Dropdown>
    </Combobox>
  )
}
