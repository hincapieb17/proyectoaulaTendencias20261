import os

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "GestionPedidos.settings")

from GestionPedidos.wsgi import application as app
