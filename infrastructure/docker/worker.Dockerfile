FROM node:22-alpine AS build
WORKDIR /app
RUN corepack enable
COPY . .
RUN pnpm install --frozen-lockfile && pnpm exec turbo build --filter=@future-fit/worker

FROM node:22-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
RUN corepack enable
COPY --from=build /app /app
USER node
CMD ["pnpm", "--filter", "@future-fit/worker", "start"]
