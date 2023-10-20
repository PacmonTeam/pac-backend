import cors from 'cors'
import express from 'express'
import fs from 'fs'
import morgan from 'morgan'
import swaggerUi from 'swagger-ui-express'
import YAML from 'yaml'

import { APP_PORT } from './env'
import routers from './routes'

const file = fs.readFileSync('./swagger.yaml', 'utf8')
const swaggerDocument = YAML.parse(file)

const app = express()

app.use(express.json())
app.use(morgan('tiny'))
app.use(cors())
app.use(express.static('public'))
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument))
app.use(routers)
app.use(function (error, request, response, next) {
  console.error('error', error.message)
  response.status(500).send('Internal Server Error')
})

app.listen(APP_PORT, () =>
  console.log(`🚀 Server ready at: http://localhost:${APP_PORT}`),
)
