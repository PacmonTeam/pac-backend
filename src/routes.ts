import express from 'express'

import { ProjectRouter } from './service/projects'

const router = express.Router()

router.post(`/projects/create`, ProjectRouter.create)
router.post(`/projects/update`, ProjectRouter.update)
router.post(`/projects/deploy`, ProjectRouter.deploy)
router.get(`/projects/:projectId`, ProjectRouter.get)
router.get(`/projects`, ProjectRouter.list)

export default router
