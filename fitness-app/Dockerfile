# Expo web build (used for browser-based preview in CI/CD)
FROM node:20-alpine AS builder

WORKDIR /app
COPY package.json .
RUN npm install

COPY . .
RUN npx expo export --platform web --output-dir dist

# ── Serve with Nginx ──────────────────────────────────────────────────────────
FROM nginx:alpine AS runtime
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 3000
