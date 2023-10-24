import fs from 'fs'
import path from 'path'

export interface ErrorResponseBody {
  message: string
}

export const readCommand = (filename: string) =>
  fs.readFileSync(
    path.resolve(__dirname, '../assets/commands', filename),
    'utf8',
  )
