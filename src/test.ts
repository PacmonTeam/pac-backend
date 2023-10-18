import { ethers } from 'ethers'
import { readFileSync } from 'fs'
import path from 'path'

import { compile } from './contracts/compile'
import { deploy } from './contracts/deploy'
import { getDefaultSigner } from './contracts/hardhat'

const contractPath = path.resolve(__dirname, '../hardhat/flatten/PacERC20.sol')
const contractSource = readFileSync(contractPath, 'utf8')

const main = async () => {
  const compileOutput = await compile({
    ['PacERC20']: contractSource,
  })
  // console.log('🚀 turbo ~ file: test.ts:15 ~ out:', compileOutput)

  const signer = await getDefaultSigner()

  const deployedContract = await deploy({
    contractFactory: compileOutput.PacERC20.contractFactory,
    constructorArguments: [
      signer.address,
      ethers.parseUnits('1000000', 18),
      'Test PAC Token',
      'tPAC',
      18n,
    ],
  })
  console.log(
    '🚀 turbo ~ file: test.ts:29 ~ deployedContract:',
    deployedContract,
  )
}

main()
