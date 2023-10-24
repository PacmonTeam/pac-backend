import { ethers } from 'ethers'
import { readFileSync } from 'fs'
import yaml from 'js-yaml'
import _ from 'lodash'
import path from 'path'

import { PRIVATE_RPC_URL } from '@/env'

import { Command, parseCommand } from '../src/lib/commandParser'
import { EthereumService } from '../src/lib/ethereum'

const ethereumService = new EthereumService.Service(PRIVATE_RPC_URL)

const main = async () => {
  await ethereumService.reset()

  const code = readFileSync(
    path.resolve(__dirname, '../hardhat/flatten/PacERC20.sol'),
    'utf8',
  )

  const tpacDeployCommands = readFileSync(
    path.resolve(__dirname, './tpac-deployment.yaml'),
    'utf8',
  )
  const code1 = JSON.stringify(code)
  console.log('🚀 turbo ~ file: example.ts:23 ~ code:', code1)

  const tpac1 = JSON.stringify(tpacDeployCommands)
  console.log('🚀 turbo ~ file: example.ts:23 ~ cmd:', tpac1)
  const tpacp = JSON.parse(tpac1)
  console.log('🚀 turbo ~ file: example.ts:23 ~ cmd:', tpacp)

  const erc20CompileOutput = await ethereumService.compile({
    ['PacERC20']: readFileSync(
      path.resolve(__dirname, '../hardhat/flatten/PacERC20.sol'),
      'utf8',
    ),
  })
  const encoded =
    erc20CompileOutput.PacERC20.contractFactory.interface.encodeFunctionData(
      'mint',
      ['0x70997970C51812dc3A010C7d01b50e0d17dc79C8', 1000000n],
    )
  console.log('🚀 turbo ~ file: example.ts:46 ~ encoded:', encoded)

  // const tpacDeployCommands = readFileSync(
  //   path.resolve(__dirname, './assets/commands/tpac-deployment.yaml'),
  //   'utf8',
  // )

  // const signer = await ethereumService.getDefaultSigner()
  // let context = {
  //   ADMIN: signer.address,
  // }

  // const tpacDeployCmd = parseCommand<Command.DeployContract>(
  //   tpacDeployCommands,
  //   context,
  // )
  // console.log('🚀 turbo ~ file: test.ts:32 ~ tpacDeployCmd:', tpacDeployCmd)

  // const deployedTPAC = await ethereumService.deploy({
  //   contractFactory: erc20CompileOutput.PacERC20.contractFactory,
  //   constructorArguments: tpacDeployCmd.constructor,
  // })
  // context[tpacDeployCmd.output] = await deployedTPAC.getAddress()

  // console.log('🚀 turbo ~ file: test.ts:42 ~ context:', context)

  // if (tpacDeployCmd.functions) {
  //   for (const func of tpacDeployCmd.functions) {
  //     const tx = await ethereumService.call(
  //       deployedTPAC,
  //       func.name,
  //       func.arguments,
  //     )
  //     console.log('🚀 turbo ~ file: example.ts:48 ~ tx:', tx)
  //   }
  // }
}

main()
