import { check, sleep } from 'k6';
import http from 'k6/http';

export const options = {
  duration: '10s',
  vus: 50,
};

export default function () {
  const res = http.post(
    'http://localhost:9010/auth/signup',
    JSON.stringify(
      {
        email: `loadtest.${Date.now()}.${__VU}@test.com`,
        owner_name: 'Full Name',
        password: 'asfi32!aegfimswAesgdfkj',
      },
      {
        headers: { 'Content-Type': 'application/json' },
      }
    )
  );
  check(res, {
    'status is 201': (res) => {
      if (res.status !== 201) {
        console.error(`Failed to sign up: ${res.status} - ${res.body}`);
        return false;
      }
      return true;
    },
  });
  sleep(1);
}
