import { Request, Response } from 'express'
import _ from 'lodash'

import { GitHubService, Plugin } from '@/lib/github'
import { redis } from '@/lib/redis'

import { ErrorResponseBody } from './utils'

export namespace PluginRouter {
  interface ListRequestQuery {
    forceFetch?: boolean
  }
  export async function list(
    req: Request<{}, any, any, ListRequestQuery>,
    res: Response<Plugin[] | ErrorResponseBody>,
  ) {
    const { forceFetch } = req.query
    if (!forceFetch) {
      const cachePlugins = await redis.getPlugins()
      if (cachePlugins) return res.json(cachePlugins)
    }
    const github = new GitHubService()
    const pluginsMap = await github.getPlugins()
    const plugins = _.chain(pluginsMap)
      .map((plugin) => plugin)
      .sortBy('info.name')
      .value()
    await redis.setPlugins(plugins, {
      EX: 60 * 60 * 24,
    })
    res.json(plugins)
  }
}
