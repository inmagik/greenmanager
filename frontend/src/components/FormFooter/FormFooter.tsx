import { Box } from "@mantine/core"
import { useElementSize } from "@mantine/hooks"

type Props = {
  children: React.ReactNode
}

export function FormFooter({ children }: Props) {
  const { ref, height } = useElementSize()
  return (
    <>
      <Box h={height} />
      <Box
        ref={ref}
        pos="absolute"
        bottom={0}
        left={0}
        right={0}
        style={{ zIndex: 1, backgroundColor: "var(--mantine-color-body)" }}
      >
        {children}
      </Box>
    </>
  )
}
