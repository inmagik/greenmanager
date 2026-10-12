export default {
  map: {
    title: "Mappa",
    label: "Mappa delle aree e degli elementi",
    layers: {
      title: "Livelli",
      show: "Mostra i livelli",
      hide: "Nascondi i livelli",
      areas: "Aree",
      elements: "Elementi",
    },
    status: {
      zoomIn: {
        areas: "Avvicina la mappa, o scegli un committente, per vedere le aree.",
        elements: "Avvicina la mappa, o scegli un committente, per vedere gli elementi.",
      },
      truncated: {
        areas: "Non tutte le aree sono nella mappa: avvicinala.",
        elements: "Non tutti gli elementi sono nella mappa: avvicinala.",
      },
      tooMany: {
        areas: "Il committente ha più aree di quelle che la mappa può mostrare.",
      },
      error: {
        areas: "Impossibile caricare le aree.",
        elements: "Impossibile caricare gli elementi.",
      },
    },
    legend: {
      provisional: "Posizione provvisoria",
    },
    panel: {
      label: "Dati dell'elemento o dell'area scelti sulla mappa",
      loading: "Caricamento...",
      notAvailable: "Dati non disponibili",
      loadError: "Impossibile caricare i dati.",
      close: "Chiudi",
      open: "Apri la scheda",
      fit: "Inquadra",
      length: "Lunghezza",
    },
  },
} as const
