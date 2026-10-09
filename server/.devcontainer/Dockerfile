FROM python:3.14-slim

ENV PYTHONUNBUFFERED=1

# GDAL, GEOS and PROJ are required by GeoDjango.
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        libssl-dev git libpq-dev openssh-client \
        binutils gdal-bin libgdal-dev libgeos-dev libproj-dev && \
    pip install --no-cache-dir -U pip wheel && \
    rm -rf /var/lib/apt/lists/*
