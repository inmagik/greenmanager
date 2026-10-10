import { useAuth, useUpdateMe } from "@/auth/auth"
import { BlockNavigation } from "@/components/BlockNavigation"
import { Header } from "@/components/Header"
import { Page } from "@/components/Page"
import { Button, Loader, ScrollArea } from "@mantine/core"
import { useState } from "react"
import { TbPencil, TbUser } from "react-icons/tb"
import { ProfileContextActions } from "./ProfileContextActions"
import { UpdateProfileForm } from "./UpdateProfileForm"
import { useTranslation } from "react-i18next"

export function Profile() {
  const { user, setUser } = useAuth()
  const { t } = useTranslation()
  const [isEditing, setIsEditing] = useState(false)
  const { mutateAsync: updateMe } = useUpdateMe()

  if (!user) {
    return (
      <Page>
        <Loader />
      </Page>
    )
  }

  const mainActions: React.ReactNode = (
    <>
      <Button
        leftSection={<TbPencil />}
        disabled={isEditing}
        onClick={() => {
          setIsEditing(true)
        }}
      >
        {t("common.edit")}
      </Button>
      <ProfileContextActions user={user} />
    </>
  )

  return (
    <Page>
      <Header
        icon={<TbUser size="1.5rem" />}
        title={user.full_name}
        breadcrumbs={[{ label: t("profile.breadcrumb"), href: "#" }]}
        actions={mainActions}
      />
      <ScrollArea>
        <UpdateProfileForm
          initialValues={user}
          readonly={!isEditing}
          onSubmit={async (values) => {
            // The header and the navigation read the user of AuthProvider.
            const updatedUser = await updateMe({ full_name: values.full_name })
            setUser(updatedUser)
            setIsEditing(false)
          }}
          onCancel={() => {
            setIsEditing(false)
          }}
        />
      </ScrollArea>

      <BlockNavigation
        when={isEditing}
        title={t("profile.unsavedTitle")}
        message={t("profile.unsavedMessage")}
      />
    </Page>
  )
}
