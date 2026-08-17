# BID Trust web application — built with Vite, served as a static SPA.
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json* tsconfig.base.json ./
COPY packages/core/package.json packages/core/
COPY apps/web/package.json apps/web/
RUN npm install --workspaces --include-workspace-root --no-audit --no-fund

COPY packages/core packages/core
COPY apps/web apps/web
RUN npm run build --workspace @bid/core \
 && npm run build --workspace @bid/web

FROM nginx:1.27-alpine AS runtime
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
