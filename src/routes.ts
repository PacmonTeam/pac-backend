import express from 'express'

import { NodeRouter } from './service/node'
import { ProjectRouter } from './service/projects'

const router = express.Router()

router.post(`/projects/create`, ProjectRouter.create)
router.post(`/projects/update`, ProjectRouter.update)
router.post(`/projects/deploy`, ProjectRouter.deploy)
router.get(`/projects/:projectId`, ProjectRouter.get)
router.get(`/projects`, ProjectRouter.list)

router.get(`/node/info`, NodeRouter.getInfo)
router.post(`/node/reset`, NodeRouter.reset)

export default router
