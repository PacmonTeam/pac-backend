import express from 'express'

import * as template from './templates'

const app = express()

app.use(express.json())

app.post(`/templates/create`, template.createTemplatesMiddleware)

app.get(`/templates`, async (req, res) => {
  res.json([{ a: 1 }])
})

const APP_PORT = process.env.APP_PORT || 3000

app.listen(APP_PORT, () =>
  console.log(`🚀 Server ready at: http://localhost:${APP_PORT}`),
)
