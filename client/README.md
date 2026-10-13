# Fastor restaurant discovery (React)

React/Vite frontend for the React developer task. It requests an OTP, verifies the OTP to get a JWT, then sends that token as a Bearer credential when it fetches the restaurant list for city `118`.

## Run locally

```sh
npm install
npm run dev
```

Open the Vite URL shown in the terminal. The development server proxies `/v1/*` requests to `https://staging.fastor.ai`, avoiding browser CORS restrictions during local development. For a deployed frontend, set `VITE_API_BASE_URL=https://staging.fastor.ai` and configure the API to allow the deployed origin.

## Flow

1. Select **Sign in**, enter a 10-digit Indian mobile number, and submit. The app sends `POST /v1/pwa/user/register` as URL-encoded `phone` and `dial_code=+91`.
2. Enter the task's default OTP `123456`. The app sends `POST /v1/pwa/user/login` as URL-encoded `phone`, `otp`, and `dial_code=+91`.
3. The JWT from `data.token` is stored in local storage and sent as `Authorization: Bearer <token>` to `GET /v1/m/restaurant?city_id=118`.

The Figma source is not bundled in this workspace. This interface follows the restaurant discovery flow and is responsive across desktop and mobile widths.
