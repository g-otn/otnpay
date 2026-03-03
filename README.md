# otnpay

A simple bank account system which allows account creation, user authentication and
balance deposit and withdraws.

This repo contains the Nx monorepo with all the packages needed to run the whole platform.

## Objective

This was made for learning purposes and to deepen technical knowledge.
For example to test the tradeoffs of using a serveless microsservice architecture, and for manual implementation of some concepts such as BFF Token Bearer.

## Running (via Docker compose)

1. Clone the repository:

```bash
git clone https://github.com/g-otn/otnpay.git
cd otnpay
```

2. Start docker compose

```
docker compose up
```

This will also build a image of the workspace locally,
used by the worker services.

3. After startup, for now, you can access the API docs for each microsservice:
   - Auth: http://localhost:9010
   - Account: http://localhost:9510

## Running tests

### Unit tests

TODO

### Integration tests

TODO

### End-to-end tests

TODO

### Load tests

1. Make sure the application is running using the docker compose setup

2. Choose a service and navigate to the load tests folder:

```bash
cd apps/service-auth/tests/load
# or
cd apps/account-service/tests/load
```

3. Choose and execute a load test type:

```bash
k6 run smoke.js
k6 run load.js
k6 run stress.js
k6 run spike.js
```

## Endpoint examples

### Scalar API Registry

Please access the **"Scalar API Reference"**, the web interface for API documentation hosted by the services:

- Auth: https://otnpay-auth-service.g0tn.workers.dev/scalar
- Balance: https://otnpay-account-service.g0tn.workers.dev/scalar

There you will find documented request/response bodies, status codes and generated examples.

### Auth

<details>
  <summary>cURL snippets</summary>

Register a new user

```bash
curl https://otnpay-auth-service.g0tn.workers.dev/auth/signup \
  --request POST \
  --header 'Content-Type: application/json' \
  --data '{
  "email": "",
  "ownerName": "",
  "password": ""
}'
```

Login with email and password

```bash
curl https://otnpay-auth-service.g0tn.workers.dev/auth/login \
  --request POST \
  --header 'Content-Type: application/json' \
  --data '{
  "email": "",
  "password": ""
}'
```

Logout

```bash
curl https://otnpay-auth-service.g0tn.workers.dev/auth/logout \
  --request POST \
  --header 'Content-Type: application/json' \
  --data '{
  "refreshToken": ""
}'
```

Exchange refresh token for new token pair

```bash
curl https://otnpay-auth-service.g0tn.workers.dev/auth/refresh \
  --request POST \
  --header 'Content-Type: application/json' \
  --data '{
  "refreshToken": ""
}'
```

Health check

```bash
curl https://otnpay-auth-service.g0tn.workers.dev/health
```

</details>

### Account

<details>
  <summary>cURL snippets</summary>

Deposit funds into account

```bash
curl http://localhost:9510/accounts/deposit \
  --request POST \
  --header 'Content-Type: application/json' \
  --header 'Authorization: Bearer YOUR_SECRET_TOKEN' \
  --data '{
  "amount": ""
}'
```

Withdraw funds from account

```bash
curl http://localhost:9510/accounts/withdraw \
  --request POST \
  --header 'Content-Type: application/json' \
  --header 'Authorization: Bearer YOUR_SECRET_TOKEN' \
  --data '{
  "amount": ""
}'
```

Get account balance

```bash
curl http://localhost:9510/accounts/balance \
  --header 'Authorization: Bearer YOUR_SECRET_TOKEN'
```

Health check

```bash
curl http://localhost:9510/health
```

</details>

## Architecture

![Architecture diagram](https://iili.io/qB0PP1I.png)

- This is optimized for a single region (not global)
- Microsservices implement hexagonal (ports and adapters) architecture
- We're using a BFF Token Handler pattern:
  - Backend For Frontend (BFF) exists so tokens can be stored securely.
    - Tokens will be saved on Redis
    - Similarly, this allows queue messages to be published and consumed without exposing secrets to the client.
  - Client will only know the BFF and the session cookie, and never interact with the tokens directly.
- HTTP proxy is required so serveless environments can access an external Redis instance. Upstash provides this already.
- Postgres connection pooler is there to ease the load on the DB since each request would be a different connection. Supabase provides this already.
- Account microsservice hashes the transaction payload to avoid repeated transactions and uses database transaction to avoid acting upon stale data.
- Account microsservice will consume and produce Queue messages
