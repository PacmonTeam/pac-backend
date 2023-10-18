import { ethers } from 'ethers'
import { readFileSync } from 'fs'
import yaml from 'js-yaml'
import path from 'path'

import { Command, parseCommand } from './lib/commandParser'
import { compile } from './lib/contracts/compile'
import { deploy } from './lib/contracts/deploy'
import { getDefaultSigner, provider } from './lib/contracts/hardhat'

const main = async () => {
  const resetResp = await provider.send('hardhat_reset', [])
  console.log('🚀 turbo ~ file: test.ts:13 ~ resetResp:', resetResp)

  const erc20Source = readFileSync(
    path.resolve(__dirname, '../hardhat/flatten/PacERC20.sol'),
    'utf8',
  )
  const erc20CompileOutput = await compile({
    ['PacERC20']: erc20Source,
  })

  const tpacSource = readFileSync(
    path.resolve(__dirname, '../assets/commands/tpac-deployment.yaml'),
    'utf8',
  )

  const signer = await getDefaultSigner()

  let context = {
    ADMIN: signer.address,
  }

  const tpacDeployCmd = parseCommand<Command.DeployContract>(
    tpacSource,
    context,
  )
  console.log('🚀 turbo ~ file: test.ts:32 ~ tpacDeployCmd:', tpacDeployCmd)

  const deployedTPAC = await deploy({
    contractFactory: erc20CompileOutput.PacERC20.contractFactory,
    constructorArguments: tpacDeployCmd.constructor,
  })
  context[tpacDeployCmd.output] = await deployedTPAC.getAddress()

  console.log('🚀 turbo ~ file: test.ts:42 ~ context:', context)
}

main()
