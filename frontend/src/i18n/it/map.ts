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
    create: {
      step: "Passo {{number}} di {{total}}",
      steps: { class: "Classe", position: "Posizione", form: "Dati" },
      classDescription: "La classe dice se l'elemento è un punto, una linea o un poligono.",
      pointHint:
        "Tocca la mappa dove si trova l'elemento, porta il mirino sul punto e premi Usa il mirino, oppure usa la posizione del dispositivo.",
      noPoint: "Nessun punto scelto.",
      back: "Indietro",
      next: "Avanti",
      close: "Chiudi il nuovo elemento",
      discardTitle: "Lasciare il nuovo elemento?",
      discardMessage: "La posizione e i dati inseriti non sono salvati e andranno persi.",
      discard: "Lascia",
      clientsError: "Senza i committenti il nuovo elemento non si salva. La posizione resta: riprova.",
      retry: "Riprova",
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
