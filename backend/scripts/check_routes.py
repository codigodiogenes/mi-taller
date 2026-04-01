import main
from fastapi.routing import APIRoute

for route in main.app.routes:
    if isinstance(route, APIRoute):
        print(f"{list(route.methods)} {route.path} -> {route.name}")
