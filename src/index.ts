import { PrismaClient } from "@prisma/client";
import express from "express";

const prisma = new PrismaClient();
const app = express();

app.use(express.json());

app.post(`/templates/create`, async (req, res) => {});

app.get(`/templates`, async (req, res) => {
  const templates = await prisma.template.findMany();
  res.json(templates);
});

const APP_PORT = process.env.APP_PORT || 3000;

app.listen(APP_PORT, () =>
  console.log(`🚀 Server ready at: http://localhost:${APP_PORT}`)
);
