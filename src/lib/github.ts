import _ from 'lodash'
import { Octokit } from 'octokit'

import {
  GITHUB_ACCESS_TOKEN,
  GITHUB_PLUGIN_OWNER,
  GITHUB_PLUGIN_PATH,
  GITHUB_PLUGIN_REPO,
} from '@/env'

interface PluginInformation {
  name: string
  defaultDisplayName: string
  description: string
  owner: string
  url: string
}
export interface Plugin extends PluginInformation {
  sampleScript: string
  sampleConfiguration: string
}
interface Plugins {
  [name: string]: Plugin
}

const GITHUB_API_VERSION = '2022-11-28'

export class GitHubService {
  private _octokit: Octokit

  constructor() {
    this._octokit = new Octokit({
      auth: GITHUB_ACCESS_TOKEN,
    })
  }

  private _decodeBase64 = (data: string) => {
    return Buffer.from(data, 'base64').toString('utf-8')
  }

  // TODO: use github tree, or something else that's better than this sheit
  getPlugins = async (): Promise<Plugins> => {
    const dirsResp = await this._octokit.request(
      `GET /repos/${GITHUB_PLUGIN_OWNER}/${GITHUB_PLUGIN_REPO}/contents/${GITHUB_PLUGIN_PATH}`,
      {
        owner: GITHUB_PLUGIN_OWNER,
        repo: GITHUB_PLUGIN_REPO,
        path: GITHUB_PLUGIN_PATH,
        headers: {
          'X-GitHub-Api-Version': GITHUB_API_VERSION,
        },
      },
    )

    const plugins: Plugins = {}

    const dirResps = await Promise.all(
      _.map(dirsResp.data, async (dir) => {
        plugins[dir.name] = {} as Plugin
        return this._octokit.request(
          `GET /repos/${GITHUB_PLUGIN_OWNER}/${GITHUB_PLUGIN_REPO}/contents/${dir.path}`,
          {
            owner: GITHUB_PLUGIN_OWNER,
            repo: GITHUB_PLUGIN_REPO,
            path: dir.path,
            headers: {
              'X-GitHub-Api-Version': GITHUB_API_VERSION,
            },
          },
        )
      }),
    )

    const filePaths = _.reduce(
      dirResps,
      (prev, dirResp) => {
        return _.concat(
          prev,
          _.map(dirResp.data, (file) => file.path),
        )
      },
      [] as string[],
    )

    for (const filePath of filePaths) {
      const pluginName = filePath.split('/')[1]
      if (!plugins[pluginName]) {
        plugins[pluginName] = {} as Plugin
      }
    }

    await Promise.all(
      _.map(filePaths, async (filePath) => {
        const resp = await this._octokit.request(
          `GET /repos/${GITHUB_PLUGIN_OWNER}/${GITHUB_PLUGIN_REPO}/contents/${filePath}`,
          {
            owner: GITHUB_PLUGIN_OWNER,
            repo: GITHUB_PLUGIN_REPO,
            path: filePath,
            headers: {
              'X-GitHub-Api-Version': GITHUB_API_VERSION,
            },
          },
        )
        const fileData = resp.data
        const pluginName = filePath.split('/')[1]
        if (fileData.name === 'plugin.json') {
          const info = JSON.parse(
            this._decodeBase64(fileData.content),
          ) as PluginInformation
          plugins[pluginName].defaultDisplayName = info.defaultDisplayName
          plugins[pluginName].description = info.description
          plugins[pluginName].name = info.name
          plugins[pluginName].owner = info.owner
          plugins[pluginName].url = info.url
        } else if (fileData.name === 'contract.sol') {
          plugins[pluginName].sampleScript = this._decodeBase64(
            fileData.content,
          )
        } else if (fileData.name === 'configuration.yaml') {
          plugins[pluginName].sampleConfiguration = this._decodeBase64(
            fileData.content,
          )
        }
      }),
    )

    return plugins
  }
}
