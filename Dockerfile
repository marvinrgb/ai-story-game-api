# Build image
FROM alpine:latest AS builder
# USER root
RUN apk update
RUN apk upgrade
RUN apk add nodejs npm

WORKDIR /build-env
COPY src ./src
COPY package.json .
COPY package-lock.json .
COPY tsconfig.json .
COPY prisma/ ./prisma

RUN npm ci --development
RUN npm run build
RUN rm -rf node_modules
RUN npm ci --production
RUN npx prisma generate


# Production image
FROM alpine:latest

RUN apk update
RUN apk upgrade
RUN apk add nodejs
RUN rm -rf /var/cache/apk/*

WORKDIR /app
COPY src/prompts/ ./src/prompts/
COPY --from=builder /build-env/dist/ ./src
COPY --from=builder /build-env/node_modules/ ./node_modules
COPY --from=builder /build-env/package.json .
COPY --from=builder /build-env/package-lock.json .

ENV NODE_ENV=production

RUN adduser --disabled-password user user &&\
    chown -R user:user /app

USER user

CMD ["node", "src/main.js"]