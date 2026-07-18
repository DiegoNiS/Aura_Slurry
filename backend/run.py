import uvicorn
import os
from dotenv import load_dotenv

# Cargar las variables desde el archivo .env
load_dotenv()

if __name__ == "__main__":
    # Si no existen en el .env, usa estos valores por defecto
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", 8000))
    
    print(f"Iniciando Aura-Slurry Backend en {host}:{port}")
    
    # Inicia el servidor con recarga en vivo activada para facilitar el desarrollo
    uvicorn.run("main:app", host=host, port=port, reload=True)
