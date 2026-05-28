# Build Stage
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
# We need to build the frontend. Vite parses .env files, but we can rely on Nginx or fallback to /api/ route proxies.
# If env variables are required at build time:
ENV VITE_API_BASE_URL=/api
ENV VITE_WS_BASE_URL=ws://localhost:3000

RUN npm run build

# Serve Stage
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]
