import { Box } from "@mantine/core"
import type React from "react"

type Props = {
  input: React.ReactNode
  children: React.ReactNode
}

export function InputAccessors({ input, children }: Props) {
  return (
    <Box pos="relative">
      {input}
      <Box pos="absolute" top={0} right={0} style={{ transform: "translateY(-100%)" }}>
        {children}
      </Box>
    </Box>
  )
}
