import { $Enums } from '@prisma/client'
import { Request, Response } from 'express'
import _ from 'lodash'

import { PRIVATE_RPC_URL, PUBLIC_RPC_URL } from '@/env'
import { Command, parseCommand } from '@/lib/commandParser'
import { EthereumService } from '@/lib/ethereum'
import { GitHubService } from '@/lib/github'
import { getPrisma } from '@/lib/prisma'
import { redis } from '@/lib/redis'

import { ErrorResponseBody, readCommand } from './utils'

const prisma = getPrisma()

const SEED_CONFIG = {
  configBTC:
    '"contractName: \\"PacERC20\\"\\nconstructor:\\n  - \\"Test BTC\\"\\n  - \\"tBTC\\"\\n  - 18\\nfunctions:\\n  - name: mint\\n    arguments:\\n      - \\"{{ADMIN}}\\"\\n      - 100000000000000000000000\\nmanage:\\n  functions:\\n    - name: mint\\n      arguments:\\n        - name: to\\n          type: address\\n        - name: amount\\n          type: uint256\\n    - name: transfer\\n      arguments:\\n        - name: to\\n          type: address\\n        - name: amount\\n          type: uint256\\noutput: \\"BTC\\"\\n"',
  configUSDC:
    '"contractName: \\"PacERC20\\"\\nconstructor:\\n  - \\"Test USDC\\"\\n  - \\"tUSDC\\"\\n  - 6\\nfunctions:\\n  - name: mint\\n    arguments:\\n      - \\"{{ADMIN}}\\"\\n      - 100000000000000000000000\\nmanage:\\n  functions:\\n    - name: mint\\n      arguments:\\n        - name: to\\n          type: address\\n        - name: amount\\n          type: uint256\\n    - name: transfer\\n      arguments:\\n        - name: to\\n          type: address\\n        - name: amount\\n          type: uint256\\noutput: \\"USDC\\"\\n"',
  configUniV2:
    '"contractName: \\"PacUniswapV2Pair\\"\\nconstructor:\\nfunctions:\\n  - name: initialize\\n    arguments:\\n      - \\"{{BTC}}\\"\\n      - \\"{{USDC}}\\"\\n  - name: setTokenAmounts\\n    arguments:\\n      - 1000000000000000000000\\n      - 35000000000000\\nmanage:\\n  functions:\\n    - name: setTokenAmounts\\n      arguments:\\n        - name: amount0\\n          type: uint256\\n        - name: amount1\\n          type: uint256\\noutput: \\"PAIR_BTC_USDC\\"\\n"',
  configPriceFeedBTC:
    '"contractName: \\"PacPriceFeed\\"\\nconstructor:\\n  - BTC/USD\\n  - 8\\nfunctions:\\n  - name: setLatestAnswer\\n    arguments:\\n      - 3500000000000\\nmanage:\\n  functions:\\n    - name: setLatestAnswer\\n      arguments:\\n        - name: answer (decimals 8)\\n          type: uint256\\noutput: \\"PRICEFEED_BTC\\"\\n"',
  configPriceFeedUSDC:
    '"contractName: \\"PacPriceFeed\\"\\nconstructor:\\n  - USDC/USD\\n  - 8\\nfunctions:\\n  - name: setLatestAnswer\\n    arguments:\\n      - 100000000\\nmanage:\\n  functions:\\n    - name: setLatestAnswer\\n      arguments:\\n        - name: answer (decimals 8)\\n          type: uint256\\noutput: \\"PRICEFEED_USDC\\"\\n"',
}

export namespace AdminRouter {
  interface SeedResponseBody {
    success: boolean
  }

  export async function seed(
    req: Request,
    res: Response<SeedResponseBody | ErrorResponseBody>,
  ) {
    const github = new GitHubService()
    const pluginsMap = await github.getPlugins()
    const plugins = _.chain(pluginsMap)
      .map((plugin) => plugin)
      .sortBy('info.name')
      .value()
    await redis.setPlugins(plugins, {
      EX: 60 * 60 * 24,
    })
    const erc20Plugin = plugins.find((p) => p.name === 'ERC-20 Token')
    const univ2Plugin = plugins.find((p) => p.name === 'Uniswap V2 Pair')
    const pricefeedPlugin = plugins.find((p) => p.name === 'Price Feed')

    const templates = [
      {
        displayName: 'BTC',
        configuration: JSON.parse(SEED_CONFIG.configBTC),
        script: erc20Plugin?.sampleScript || '',
        sequence: 0,
        status: $Enums.Status.ACTIVE,
        type: erc20Plugin?.name,
      },
      {
        displayName: 'USDC',
        configuration: JSON.parse(SEED_CONFIG.configUSDC),
        script: erc20Plugin?.sampleScript || '',
        sequence: 1,
        status: $Enums.Status.ACTIVE,
        type: erc20Plugin?.name,
      },
      {
        displayName: 'UNI-V2',
        configuration: JSON.parse(SEED_CONFIG.configUniV2),
        script: univ2Plugin?.sampleScript || '',
        sequence: 2,
        status: $Enums.Status.ACTIVE,
        type: univ2Plugin?.name,
      },
      {
        displayName: 'Price Feed BTC',
        configuration: JSON.parse(SEED_CONFIG.configPriceFeedBTC),
        script: pricefeedPlugin?.sampleScript || '',
        sequence: 3,
        status: $Enums.Status.ACTIVE,
        type: pricefeedPlugin?.name,
      },
      {
        displayName: 'Price Feed USDC',
        configuration: JSON.parse(SEED_CONFIG.configPriceFeedUSDC),
        script: pricefeedPlugin?.sampleScript || '',
        sequence: 4,
        status: $Enums.Status.ACTIVE,
        type: pricefeedPlugin?.name,
      },
    ]

    const project = await prisma.project.create({
      data: {
        name: 'Sample Project',
      },
    })

    await prisma.$transaction(
      _.map(templates, (template) =>
        prisma.template.create({
          data: {
            displayName: template.displayName,
            configuration: template.configuration,
            script: template.script,
            sequence: template.sequence,
            status: template.status,
            type: template.type,
            projectId: project.id,
          },
        }),
      ),
    )
    const node = await prisma.node.create({
      data: {
        projectId: project.id,
        privateRpcUrl: PRIVATE_RPC_URL,
        publicRpcUrl: PUBLIC_RPC_URL,
        name: 'Sample Node',
      },
    })

    const ethereumService = new EthereumService.Service(node.privateRpcUrl)
    const signer = await ethereumService.getDefaultSigner()
    const deployerAddress = signer.address

    try {
      let context = {
        ADMIN: signer.address,
      }
      for (const template of templates) {
        const script = template.script.trim()
        const configuration = template.configuration.trim()
        const deployCmd = parseCommand<Command.DeployContract>(
          configuration,
          context,
        )
        console.log('deployCmd:', JSON.stringify(deployCmd))
        const contractName = deployCmd.contractName
        const compileOutput = await ethereumService.compile({
          [contractName]: script,
        })
        const contract = await ethereumService.deploy({
          contractFactory: compileOutput[contractName].contractFactory,
          constructorArguments: deployCmd.constructor || [],
          deployerAddress,
        })
        const address = await contract.getAddress()
        console.log('contract deployed', address, contractName)
        context[deployCmd.output] = address
        await prisma.nodeContract.create({
          data: {
            address,
            configuration,
            script,
            sequence: template.sequence,
            name: template.displayName,
            nodeId: node.id,
          },
        })

        if (deployCmd.functions) {
          for (const func of deployCmd.functions) {
            await ethereumService.call(
              contract,
              func.name,
              func.arguments,
              deployerAddress,
            )
          }
        }
      }
    } catch (e: any) {
      return res.status(500).json({
        message: e.message,
      })
    }

    const nodeResult = await prisma.node.findUnique({
      where: {
        id: Number(node.id),
      },
      include: {
        project: true,
        contracts: true,
      },
    })
    if (!nodeResult) {
      return res.status(500).json({
        message: 'Node not found, wtf?',
      })
    }

    res.json({
      success: true,
    })
  }
}
