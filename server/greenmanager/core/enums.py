from django.db import models


class GeometryType(models.TextChoices):
    """Geometry of the elements of a class (D-035): lines and polygons can be
    multipart, points cannot."""

    POINT = "point", "Punto"
    LINE = "line", "Linea"
    POLYGON = "polygon", "Poligono"
