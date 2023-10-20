FROM node:18 AS builder

ARG DATABASE_URL

WORKDIR /app

COPY package.json ./
COPY yarn.lock ./
COPY prisma ./prisma/

RUN yarn --frozen-lockfile

COPY . .
RUN yarn build



FROM node:18

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/swagger.yaml ./

EXPOSE 3000

CMD [ "yarn", "start:prod" ]
