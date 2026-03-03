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

const AUTH_URL = 'http://localhost:9010';
const ACCOUNT_URL = 'http://localhost:9510';
const TEST_EMAIL = 'loadtest.account@test.com';
const TEST_PASSWORD = 'asfi32!aegfimswAesgdfkj';

export function setup() {
  http.post(
    `${AUTH_URL}/auth/signup`,
    JSON.stringify({
      email: TEST_EMAIL,
      ownerName: 'Load Test User',
      password: TEST_PASSWORD,
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );

  const loginRes = http.post(
    `${AUTH_URL}/auth/login`,
    JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
    { headers: { 'Content-Type': 'application/json' } }
  );

  if (loginRes.status !== 200) {
    throw new Error(
      `Setup failed — could not login: ${loginRes.status} - ${loginRes.body}`
    );
  }

  const { access_token } = JSON.parse(loginRes.body);

  http.post(
    `${ACCOUNT_URL}/accounts/deposit`,
    JSON.stringify({ amount: '100.00' }),
    {
      headers: {
        Authorization: `Bearer ${access_token}`,
        'Content-Type': 'application/json',
      },
    }
  );

  return { access_token };
}

export default function ({ access_token }) {
  group('health', () => {
    const res = http.get(`${ACCOUNT_URL}/health`);
    check(res, { 'status is 200': (r) => r.status === 200 });
  });

  group('balance', () => {
    const res = http.get(`${ACCOUNT_URL}/accounts/balance`, {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    check(res, {
      'has balance field': (r) =>
        typeof JSON.parse(r.body).balance === 'string',
      'status is 200': (r) => {
        if (r.status !== 200) {
          console.error(`Balance check failed: ${r.status} - ${r.body}`);
          return false;
        }
        return true;
      },
    });
  });

  sleep(1);
}
