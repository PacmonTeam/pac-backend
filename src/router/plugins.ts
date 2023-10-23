import { Request, Response } from 'express'
import _ from 'lodash'

import { GitHubService, Plugin } from '@/lib/github'

import { ErrorResponseBody } from './utils'

export namespace PluginRouter {
  export async function list(
    req: Request,
    res: Response<Plugin[] | ErrorResponseBody>,
  ) {
    // TODO: cache
    const github = new GitHubService()
    const pluginsMap = await github.getPlugins()
    const plugins = _.chain(pluginsMap)
      .map((plugin) => plugin)
      .sortBy('info.name')
      .value()
    res.json(plugins)
  }
}
