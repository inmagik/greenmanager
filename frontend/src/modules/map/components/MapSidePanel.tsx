import { Drawer } from "@mantine/core"
import type { ReactNode } from "react"
import classes from "./MapSidePanel.module.css"

/** The height of the drawer on a phone, as a share of the screen: the map stays usable above it. */
export const DRAWER_SHARE = 0.45

type Props = {
  opened: boolean
  /** On a phone a drawer from the bottom, over the map; otherwise a column on the right, next to the map. */
  mobile: boolean
  label: string
  onClose: () => void
  /** The share of the screen of the drawer, on a phone. */
  share?: number
  children: ReactNode
}

/** The panel of the map page: the feature selected, or the new element. */
export function MapSidePanel({ opened, mobile, label, onClose, share = DRAWER_SHARE, children }: Props) {
  if (mobile) {
    // Without the overlay: the map stays usable above the drawer.
    return (
      <Drawer
        opened={opened}
        onClose={onClose}
        position="bottom"
        size={`${share * 100}%`}
        withOverlay={false}
        withCloseButton={false}
        lockScroll={false}
        trapFocus={false}
        closeOnClickOutside={false}
        aria-label={label}
        styles={{
          body: { padding: 0, height: "100%" },
          content: { borderTopLeftRadius: 12, borderTopRightRadius: 12 },
        }}
      >
        {children}
      </Drawer>
    )
  }
  if (!opened) return null
  return (
    <aside className={classes.side} aria-label={label}>
      {children}
    </aside>
  )
}
