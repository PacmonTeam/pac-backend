require('dotenv').config()

export const PRIVATE_RPC_URL = process.env.PRIVATE_RPC_URL || ''
export const PUBLIC_RPC_URL = process.env.PUBLIC_RPC_URL || ''
export const DATABASE_URL = process.env.DATABASE_URL || ''
export const APP_PORT = process.env.APP_PORT || 3033

export const GITHUB_ACCESS_TOKEN = process.env.GITHUB_ACCESS_TOKEN || ''
export const GITHUB_PLUGIN_OWNER = process.env.GITHUB_PLUGIN_OWNER || ''
export const GITHUB_PLUGIN_REPO = process.env.GITHUB_PLUGIN_REPO || ''
export const GITHUB_PLUGIN_PATH = process.env.GITHUB_PLUGIN_PATH || ''

export const REDIS_URL = process.env.REDIS_URL || ''
