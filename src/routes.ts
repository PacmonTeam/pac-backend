import express from 'express'

import { NodeRouter } from './service/node'
import { ProjectRouter } from './service/projects'

const router = express.Router()

const errorWrapper = (fn: any) => async (req: any, res: any, next: any) => {
  try {
    return await fn(req, res, next)
  } catch (error) {
    next(error)
  }
}

router.post('/projects/create', errorWrapper(ProjectRouter.create))
router.post('/projects/update', errorWrapper(ProjectRouter.update))
router.post('/projects/deploy', errorWrapper(ProjectRouter.deploy))
router.post('/projects/delete', errorWrapper(ProjectRouter.deleteProject))
router.get('/projects/:projectId', errorWrapper(ProjectRouter.get))
router.get('/projects', errorWrapper(ProjectRouter.list))

router.get('/node/info', NodeRouter.getInfo)
router.post('/node/reset', NodeRouter.reset)

export default router
