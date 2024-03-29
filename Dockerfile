FROM python:alpine

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir --no-input -r requirements.txt
RUN pip install --no-cache-dir --no-input uvicorn
RUN rm /app/requirements.txt

COPY . .

EXPOSE 8000
ENTRYPOINT [ "uvicorn", "main:app", "--proxy-headers", "--host=0.0.0.0" ]