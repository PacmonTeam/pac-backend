import { RedisClientType, SetOptions, createClient } from 'redis'

import { Plugin } from './github'

export class RedisService {
  private _client: RedisClientType
  constructor() {
    this._client = createClient({
      url: process.env.REDIS_URL,
    })
    this._client.on('error', (err) => {
      console.error('Redis error: ', err)
    })
  }

  private _connect = async () => {
    await this._client.connect()
  }

  private _disconnect = async () => {
    await this._client.disconnect()
  }

  setPlugins = async (plugins: Plugin[], options?: SetOptions) => {
    await this._connect()
    await this._client.set('plugins', JSON.stringify(plugins), options)
    await this._disconnect()
  }

  getPlugins = async (): Promise<Plugin[] | null> => {
    await this._connect()
    const plugins = await this._client.get('plugins')
    await this._disconnect()
    if (!plugins) {
      return null
    }
    return JSON.parse(plugins) as Plugin[]
  }
}

export const redis = new RedisService()
