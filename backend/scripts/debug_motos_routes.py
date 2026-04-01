from routers.motorcycles import router
with open('routes_debug.txt', 'w') as f:
    for r in router.routes:
        f.write(f"{r.path}\n")
