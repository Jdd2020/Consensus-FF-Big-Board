FROM python:3.11-slim

WORKDIR /app

# Install dependencies early for caching
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the app code (optional for dev — override with volume)
COPY . .

ENV FLASK_APP=app.py
ENV FLASK_RUN_HOST=0.0.0.0
ENV FLASK_ENV=development

CMD ["flask", "run", "--reload"]
