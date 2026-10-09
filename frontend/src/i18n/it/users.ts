const users = {
  fields: {
    fullName: "Nome completo",
    email: "Email",
    users: "Utenti",
    roles: "Ruoli",
    selectableUsers: "Utenti selezionabili",
    assignableRoles: "Ruoli assegnabili",
    activationDate: "Data di attivazione",
    lastLogin: "Ultimo accesso",
  },
  status: { active: "Attivo", inactive: "Disattivato", locked: "Bloccato" },
  list: {
    title: "Elenco utenti",
    breadcrumb: "Gestione utenti",
    emptyTitle: "Non è stato ancora creato alcun utente",
    emptyDescription: "Crea un utente per iniziare a gestire accessi, ruoli e permessi.",
    deleteTitle: "Elimina utenti",
    deletePrompt: "Stai per eliminare i seguenti utenti:",
    newUser: "Nuovo utente",
  },
  detail: {
    tab: "Dettagli utente",
    rolesTab: "Ruoli e permessi",
    disabledTitle: "Questo utente è disattivato",
    disabledMessage: "Riattiva l'utente per consentirgli di usare l'applicazione",
    reactivate: "Riattiva utente",
    lockedTitle: "Questo utente è bloccato",
    lockedMessage:
      "Sono stati rilevati troppi tentativi di accesso non riusciti. L'utente verrà sbloccato automaticamente dopo alcuni minuti.",
    unlock: "Sblocca utente",
    noTenants: "Nessun tenant associato",
    noTenantsDescription: "Questo utente non appartiene attualmente ad alcun tenant.",
    tenants: "Tenant ({{count}})",
  },
  actions: {
    dangerZone: "Zona pericolosa",
    deactivate: "Disattiva utente",
    deactivatePrompt: "Stai per disattivare questo utente",
    deactivateWarning:
      "L'utente non potrà più accedere o operare nel sistema finché non verrà riattivato. Vuoi continuare?",
    delete: "Elimina utente",
    deletePrompt: "Stai per eliminare questo utente",
    deleteWarning:
      "L'utente non potrà più accedere o operare nel sistema. Questa azione non può essere annullata. Vuoi continuare?",
  },
  filters: { status: "Filtra per stato", role: "Filtra per ruolo" },
  results: "Visualizzati {{shown}} risultati su {{total}}",
  irreversible: "Questa azione non può essere annullata. Vuoi continuare?",
} as const
const roles = {
  list: {
    title: "Elenco ruoli",
    breadcrumb: "Gestione ruoli",
    emptyTitle: "Non è stato ancora creato alcun ruolo",
    emptyDescription: "Crea un ruolo per iniziare ad assegnare permessi agli utenti.",
    deleteTitle: "Elimina ruoli",
    deletePrompt: "Stai per eliminare i seguenti ruoli:",
    newRole: "Nuovo ruolo",
  },
  detail: {
    tab: "Dettagli ruolo",
    usersTab: "Utenti assegnati al ruolo",
    emptyTitle: "Nessun utente è assegnato a questo ruolo",
    emptyDescription: "Assegna utenti al ruolo per gestirne i permessi come gruppo.",
    assignUsers: "Assegna il ruolo ad altri utenti",
    assign: "Assegna a un nuovo utente",
    removeSelected: "Rimuovi il ruolo dagli utenti selezionati",
    removeSelectedPrompt: "Stai per rimuovere il ruolo dagli utenti selezionati:",
    removeSelectedWarning: "Gli utenti perdono i permessi del ruolo. Potrai assegnarglielo di nuovo.",
  },
  actions: {
    label: "Azioni",
    edit: "Modifica ruolo",
    delete: "Elimina ruolo",
    deletePrompt: "Stai per eliminare questo ruolo",
    deleteWarning:
      "Questo ruolo non potrà più essere assegnato agli utenti. L'azione non può essere annullata. Vuoi continuare?",
    remove: "Rimuovi ruolo dall'utente",
    removeButton: "Rimuovi utente dal ruolo",
    removePrompt: "Stai per rimuovere questo ruolo dall'utente",
    removeWarning:
      "L'utente perderà i permessi associati al ruolo finché non verrà assegnato di nuovo. Vuoi continuare?",
  },
  fields: { permissions: "Permessi", userCount: "Numero di utenti" },
} as const
const profile = {
  breadcrumb: "Profilo utente",
  dangerZone: "Zona riservata",
  changePassword: "Cambia password",
  unsavedTitle: "Modifiche non salvate",
  unsavedMessage: "Sono presenti modifiche non salvate. Vuoi davvero uscire senza salvarle?",
} as const
export default { users, roles, profile } as const
