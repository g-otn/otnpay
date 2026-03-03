import { check, sleep } from 'k6';
import http from 'k6/http';

export const options = {
  duration: '10s',
  vus: 100,
};

export default function () {
  const res = http.get('http://localhost:9010/health');
  check(res, { 'status is 200': (res) => res.status === 200 });
  sleep(1);
}
