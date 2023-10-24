import axios from 'axios'
import fs from 'fs'
import path from 'path'

import { Plugin } from '@/lib/github'
import { ProjectRouter } from '@/router/projects'

// const API_URL = 'https://pacmon.suijin.xyz/api'
const API_URL = 'http://localhost:3033'

const readConfig = (filename: string) =>
  fs.readFileSync(
    path.resolve(__dirname, './assets/commands', filename),
    'utf8',
  )

const createProject = async () => {
  const resp = await axios.get<Plugin[]>(`${API_URL}/plugins/list`)
  const plugins = resp.data

  const erc20Plugin = plugins.find((p) => p.name === 'ERC-20 Token')
  const univ2Plugin = plugins.find((p) => p.name === 'Uniswap V2 Pair')
  const pricefeedPlugin = plugins.find((p) => p.name === 'Price Feed')

  const configBTC = readConfig('seed-0-btc.yaml')
  console.log('🚀 turbo ~ file: seed.ts:26 ~ configBTC:', configBTC)
  const configUSDC = readConfig('seed-1-usdc.yaml')
  const configUniV2 = readConfig('seed-2-univ2.yaml')
  const configPriceFeedBTC = readConfig('seed-3-pricefeed-btc.yaml')
  const configPriceFeedUSDC = readConfig('seed-4-pricefeed-usdc.yaml')

  const projectCreateBody: ProjectRouter.CreateRequestBody = {
    name: 'Sample Project',
    templates: [
      {
        displayName: 'BTC',
        configuration: configBTC,
        script: erc20Plugin?.sampleScript || '',
        sequence: 0,
        status: 'ACTIVE',
        type: erc20Plugin?.name,
      },
      {
        displayName: 'USDC',
        configuration: configUSDC,
        script: erc20Plugin?.sampleScript || '',
        sequence: 1,
        status: 'ACTIVE',
        type: erc20Plugin?.name,
      },
      {
        displayName: 'UNI-V2',
        configuration: configUniV2,
        script: univ2Plugin?.sampleScript || '',
        sequence: 2,
        status: 'ACTIVE',
        type: univ2Plugin?.name,
      },
      {
        displayName: 'Price Feed BTC',
        configuration: configPriceFeedBTC,
        script: pricefeedPlugin?.sampleScript || '',
        sequence: 3,
        status: 'ACTIVE',
        type: pricefeedPlugin?.name,
      },
      {
        displayName: 'Price Feed USDC',
        configuration: configPriceFeedUSDC,
        script: pricefeedPlugin?.sampleScript || '',
        sequence: 4,
        status: 'ACTIVE',
        type: pricefeedPlugin?.name,
      },
    ],
  }

  const createProjectResp = await axios.post<ProjectRouter.MinimalProject>(
    `${API_URL}/projects/create`,
    projectCreateBody,
  )

  const project = createProjectResp.data
  console.log('🚀 turbo ~ file: seed.ts:85 ~ project:', project)

  return project
}

const seed = async () => {
  const project = await createProject()
  // const project = { id: 5 }

  const deployProjectResp = await axios.post<ProjectRouter.DeployResponseBody>(
    `${API_URL}/projects/deploy`,
    {
      deployerAddress: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
      nodeName: 'Sample Node',
      projectId: project.id,
    } as ProjectRouter.DeployRequestBody,
  )

  const deployData = deployProjectResp.data
  console.log('🚀 turbo ~ file: seed.ts:95 ~ deployData:', deployData)
}

seed()
