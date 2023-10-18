import { ethers } from 'ethers'
import { readFileSync } from 'fs'
import yaml from 'js-yaml'
import _ from 'lodash'
import path from 'path'

import { Command, parseCommand } from './lib/commandParser'
import { EthereumService } from './lib/ethereum'

const ethereumService = new EthereumService.Service()

const main = async () => {
  await ethereumService.reset()

  const signers = await ethereumService.getSigners()
  console.log('🚀 turbo ~ file: example.ts:15 ~ signer:', signers)

  const erc20CompileOutput = await ethereumService.compile({
    ['PacERC20']: readFileSync(
      path.resolve(__dirname, '../hardhat/flatten/PacERC20.sol'),
      'utf8',
    ),
  })

  const tpacDeployCommands = readFileSync(
    path.resolve(__dirname, '../assets/commands/tpac-deployment.yaml'),
    'utf8',
  )

  const signer = await ethereumService.getDefaultSigner()
  let context = {
    ADMIN: signer.address,
  }

  const tpacDeployCmd = parseCommand<Command.DeployContract>(
    tpacDeployCommands,
    context,
  )
  console.log('🚀 turbo ~ file: test.ts:32 ~ tpacDeployCmd:', tpacDeployCmd)

  const deployedTPAC = await ethereumService.deploy({
    contractFactory: erc20CompileOutput.PacERC20.contractFactory,
    constructorArguments: tpacDeployCmd.constructor,
  })
  context[tpacDeployCmd.output] = await deployedTPAC.getAddress()

  console.log('🚀 turbo ~ file: test.ts:42 ~ context:', context)

  if (tpacDeployCmd.functions) {
    for (const func of tpacDeployCmd.functions) {
      const tx = await ethereumService.call(
        deployedTPAC,
        func.name,
        func.arguments,
      )
      console.log('🚀 turbo ~ file: example.ts:48 ~ tx:', tx)
    }
  }
}

main()
