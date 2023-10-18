import { readFileSync } from 'fs'
import { compile } from './contracts/compile'
import path from 'path'

const contractPath = path.resolve(__dirname, '../hardhat/flatten/PacERC20.sol')
const contractSource = readFileSync(contractPath, 'utf8')

const main = async () => {
  const out = await compile({
    ['PacERC20']: contractSource,
  })
  console.log('🚀 turbo ~ file: test.ts:15 ~ out:', out)
}

main()
