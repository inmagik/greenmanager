import { Box, Flex, Text } from "@mantine/core"

type Props = {
  title: string
  description?: string
  action?: React.ReactNode
}

export function TableEmptyState({ title, description, action }: Props) {
  return (
    <Box h={500}>
      <Flex direction="column" align="center" justify="center" h="100%" gap={10}>
        <Text fz="20" fw={700} c="black" ta="center">
          {title}
        </Text>
        {description && (
          <Text c="gray.7" ta="center">
            {description}
          </Text>
        )}
        {action}
      </Flex>
    </Box>
  )
}
