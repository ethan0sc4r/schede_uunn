# Dockerfile per il backend (simple_main.py)
FROM python:3.10-slim

# Imposta la directory di lavoro
WORKDIR /app

# Copia requirements.txt e installa le dipendenze
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copia il codice dell'applicazione
COPY . .

# Crea la directory per i file statici e uploads
RUN mkdir -p data/uploads
RUN mkdir -p static

# Esponi la porta 8001
EXPOSE 8001

# Comando per avviare l'applicazione
CMD ["python", "simple_main.py"]