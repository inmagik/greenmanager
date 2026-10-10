FROM python:3.14-slim

# The image runs in production: debug off unless DJANGO_DEBUG says otherwise.
ENV PYTHONUNBUFFERED=1 DJANGO_DEBUG=False

# GDAL, GEOS and PROJ are required by GeoDjango.
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        binutils gdal-bin libgdal-dev libgeos-dev libproj-dev && \
    rm -rf /var/lib/apt/lists/*

COPY ./requirements.txt ./requirements_prod.txt /code/

RUN pip install --no-cache-dir -U pip wheel && \
    pip install --no-cache-dir -r /code/requirements_prod.txt -r /code/requirements.txt

COPY scripts /scripts/

COPY ./greenmanager /code

ENV PATH="/scripts:${PATH}"
WORKDIR /code
CMD [ "start" ]
