import express from 'express'

import * as templates from './templates'

const router = express.Router()

router.post(`/template`, templates.create)
router.get(`/templates`, templates.getAll)

export default router
