import http from 'k6/http';
import { sleep } from 'k6';

export const options = {
    vus: 100,
    duration: '30s',
};

export default function () {
  http.get('http://localhost:8000/?title=luckyv,lucky%20v&lang=de');
  sleep(1);
}