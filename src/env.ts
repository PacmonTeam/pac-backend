require('dotenv').config()

export const PRIVATE_RPC_URL = process.env.PRIVATE_RPC_URL || ''
export const PUBLIC_RPC_URL = process.env.PUBLIC_RPC_URL || ''
export const DATABASE_URL = process.env.DATABASE_URL || ''
export const APP_PORT = process.env.APP_PORT || 3000
