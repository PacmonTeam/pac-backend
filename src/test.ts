import { ethers } from 'ethers'
import { readFileSync } from 'fs'
import yaml from 'js-yaml'
import path from 'path'

import { Command, parseCommand } from './lib/commandParser'
import { EthereumService } from './lib/ethereum'

const ethereumService = new EthereumService.Service()

const main = async () => {
  await ethereumService.reset()

  const erc20Source = readFileSync(
    path.resolve(__dirname, '../hardhat/flatten/PacERC20.sol'),
    'utf8',
  )
  const erc20CompileOutput = await ethereumService.compile({
    ['PacERC20']: erc20Source,
  })

  const tpacSource = readFileSync(
    path.resolve(__dirname, '../assets/commands/tpac-deployment.yaml'),
    'utf8',
  )

  const signer = await ethereumService.getDefaultSigner()

  let context = {
    ADMIN: signer.address,
  }

  const tpacDeployCmd = parseCommand<Command.DeployContract>(
    tpacSource,
    context,
  )
  console.log('🚀 turbo ~ file: test.ts:32 ~ tpacDeployCmd:', tpacDeployCmd)

  const deployedTPAC = await ethereumService.deploy({
    contractFactory: erc20CompileOutput.PacERC20.contractFactory,
    constructorArguments: tpacDeployCmd.constructor,
  })
  context[tpacDeployCmd.output] = await deployedTPAC.getAddress()

  console.log('🚀 turbo ~ file: test.ts:42 ~ context:', context)
}

main()
