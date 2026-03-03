import { check, group, sleep } from 'k6';
import http from 'k6/http';

export const options = {
  stages: [
    { duration: '1m', target: 10 },
    { duration: '30s', target: 500 },
    { duration: '30s', target: 10 },
    { duration: '1m', target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.10'],
  },
};

const BASE_URL = 'http://localhost:9010';
const TEST_EMAIL = 'loadtest@test.com';
const TEST_PASSWORD = 'asfi32!aegfimswAesgdfkj';

export function setup() {
  http.post(
    `${BASE_URL}/auth/signup`,
    JSON.stringify({
      email: TEST_EMAIL,
      ownerName: 'Load Test User',
      password: TEST_PASSWORD,
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );
}

export default function () {
  group('health', () => {
    const res = http.get(`${BASE_URL}/health`);
    check(res, { 'status is 200': (r) => r.status === 200 });
  });

  group('login', () => {
    const res = http.post(
      `${BASE_URL}/auth/login`,
      JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
      { headers: { 'Content-Type': 'application/json' } }
    );
    check(res, {
      'has access_token': (r) => JSON.parse(r.body).access_token?.length > 0,
      'status is 200': (r) => {
        if (r.status !== 200) {
          console.error(`Login failed: ${r.status} - ${r.body}`);
          return false;
        }
        return true;
      },
    });
  });

  sleep(1);
}
