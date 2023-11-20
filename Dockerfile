FROM python:3.12-alpine

WORKDIR /usr/src/app

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install --no-cache-dir 'uvicorn[standard]'

COPY . .

EXPOSE 8000

CMD [ "uvicorn", "main:app", "--host=0.0.0.0" ]