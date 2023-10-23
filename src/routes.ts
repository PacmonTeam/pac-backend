import express from 'express'

import { NodeRouter } from './router/nodes'
import { PluginRouter } from './router/plugins'
import { ProjectRouter } from './router/projects'

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

router.get('/nodes/:nodeId', errorWrapper(NodeRouter.get))
router.get('/nodes', errorWrapper(NodeRouter.list))
router.post('/nodes/reset', errorWrapper(NodeRouter.reset))
router.post('/nodes/delete', errorWrapper(NodeRouter.deleteNode))
router.post('/nodes/call', errorWrapper(NodeRouter.call))

router.get('/plugins/list', errorWrapper(PluginRouter.list))

export default router
