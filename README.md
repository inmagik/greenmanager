# GreenManager

Webapp per il censimento e la gestione del verde: inventario georeferenziato degli elementi vegetali, registro degli interventi e registro dello stato della vegetazione.

| Cartella | Contenuto |
|---|---|
| [designdocs/](designdocs/README.md) | specifica del dominio e architettura tecnica |
| [server/](server/AGENTS.md) | API REST: Django, Django REST Framework, GeoDjango e PostGIS |
| [frontend/](frontend/AGENTS.md) | interfaccia: React, Vite, TypeScript e Mantine |

## Avvio in sviluppo

Servono Docker, Python 3.14 con GDAL, Node 22 e yarn.

```bash
# server
cd server
docker compose up -d db redis
python3.14 -m venv env && source env/bin/activate
pip install -r requirements.txt -r requirements-dev.txt
cd greenmanager
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver

# frontend, in un altro terminale
cd frontend
yarn install
yarn dev
```

L'interfaccia è su http://localhost:5173. Per accedere, il superuser deve appartenere a un'organizzazione: si crea dall'admin, su http://localhost:8000/admin/. I dettagli sono in [server/AGENTS.md](server/AGENTS.md).
