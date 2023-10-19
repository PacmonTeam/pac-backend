# PAC Backend

## Prerequisites

- [Docker Desktop](https://docs.docker.com/desktop/install/mac-install/)

## Getting Started Locally

- create `.env` file, please refer to `.env.example` for guidance
- run postgres locally using `docker compose up -d`
- install the dependencies with `yarn` or `npm install`
- start an application with `yarn dev` or `npm run dev`

## Initial DB

- run `prisma migrate dev` to create db
- them, run `prisma generate` to generate prisma client

## Access to swagger

- start an ppalication with `yarn dev`
- go to url : `https://localhost:3000/docs`
