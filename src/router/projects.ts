import { $Enums, Node, NodeContract, Project, Template } from '@prisma/client'
import { Request, Response } from 'express'
import _ from 'lodash'
import { ParsedQs } from 'qs'

import { PRIVATE_RPC_URL, PUBLIC_RPC_URL } from '@/env'
import { Command, parseCommand } from '@/lib/commandParser'
import { EthereumService } from '@/lib/ethereum'
import { getPrisma } from '@/lib/prisma'

import { ErrorResponseBody } from './utils'

const prisma = getPrisma()

export namespace ProjectRouter {
  export interface MinimalTemplate {
    id: number
    displayName: string
    sequence: number
    status: $Enums.Status
  }

  export interface MinimalProject {
    id: number
    name: string
    templates: MinimalTemplate[]
  }

  function mapMinimalTemplate(t: Template): MinimalTemplate {
    return {
      id: t.id,
      displayName: t.displayName,
      sequence: t.sequence,
      status: t.status,
    }
  }
  export interface CreateRequestBody {
    name: string
    templates: {
      script: string
      displayName: string
      type: string | undefined
      configuration: string
      sequence: number
      status: $Enums.Status
    }[]
  }

  export async function create(
    req: Request<{}, any, CreateRequestBody, ParsedQs>,
    res: Response<MinimalProject | ErrorResponseBody>,
  ) {
    const { templates, name } = req.body

    const project = await prisma.project.create({
      data: {
        name,
      },
    })

    const createdTemplates = await prisma.$transaction(
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

    res.json({
      id: project.id,
      name,
      templates: _.map(createdTemplates, mapMinimalTemplate),
    })
  }

  export interface UpdateRequestBody {
    id: number
    name: string
    templates: {
      script: string
      displayName: string
      configuration: string
      type: string | undefined
      sequence: number
      status: $Enums.Status
    }[]
  }

  export async function update(
    req: Request<{}, any, UpdateRequestBody, ParsedQs>,
    res: Response<MinimalProject | ErrorResponseBody>,
  ) {
    const { templates, name, id } = req.body

    const project = await prisma.project.update({
      where: {
        id: Number(id),
      },
      data: {
        name,
      },
    })

    const sequences = _.map(templates, (template) => template.sequence)

    await prisma.template.deleteMany({
      where: {
        projectId: id,
      },
    })

    const createdTemplates: Template[] = await prisma.$transaction(
      _.map(templates, (template) =>
        prisma.template.upsert({
          where: {
            projectId_sequence: {
              projectId: project.id,
              sequence: template.sequence,
            },
          },
          create: {
            displayName: template.displayName,
            configuration: template.configuration,
            script: template.script,
            sequence: template.sequence,
            status: template.status,
            type: template.type,
            projectId: project.id,
          },
          update: {
            displayName: template.displayName,
            configuration: template.configuration,
            script: template.script,
            sequence: template.sequence,
            type: template.type,
            status: template.status,
          },
        }),
      ),
    )

    res.json({
      id: project.id,
      name,
      templates: _.map(createdTemplates, mapMinimalTemplate),
    })
  }

  export interface GetRequestParams {
    projectId: number
  }
  export interface GetResponseBody extends Project {
    templates: Template[]
  }

  export async function get(
    req: Request<GetRequestParams>,
    res: Response<GetResponseBody | ErrorResponseBody>,
  ) {
    const { projectId } = req.params
    const project = await prisma.project.findUnique({
      where: {
        id: Number(projectId),
      },
      include: {
        templates: {
          orderBy: {
            sequence: 'asc',
          },
        },
      },
    })

    if (!project) {
      return res.status(404).json({
        message: 'Project not found',
      })
    }

    res.json({
      id: project.id,
      name: project.name,
      templates: project.templates,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    })
  }

  export async function list(
    req: Request<{}, any, any, ParsedQs, Record<string, any>>,
    res: Response<MinimalProject[] | ErrorResponseBody>,
  ) {
    const result = await prisma.project.findMany({
      include: {
        templates: true,
      },
    })

    if (!result) {
      return res.status(404).json({
        message: 'Project not found',
      })
    }

    res.json(
      _.map(result, (project) => ({
        id: project.id,
        name: project.name,
        templates: _.map(project.templates, mapMinimalTemplate),
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
      })),
    )
  }

  export interface DeleteRequestBody {
    projectId: number
  }
  export interface DeleteResponseBody {
    success: boolean
  }
  export async function deleteProject(
    req: Request<{}, any, DeleteRequestBody, ParsedQs, Record<string, any>>,
    res: Response<DeleteResponseBody | ErrorResponseBody>,
  ) {
    const { projectId } = req.body
    await prisma.project.delete({
      where: {
        id: Number(projectId),
      },
    })
    res.json({
      success: true,
    })
  }

  export interface DeployRequestBody {
    nodeName: string
    projectId: number
    deployerAddress: string
  }

  export interface DeployResponseBody extends Node {
    project: Project
    contracts: NodeContract[]
  }

  export async function deploy(
    req: Request<{}, any, DeployRequestBody, ParsedQs, Record<string, any>>,
    res: Response<DeployResponseBody | ErrorResponseBody>,
  ) {
    const { projectId, nodeName, deployerAddress } = req.body
    const project = await prisma.project.findUnique({
      where: {
        id: Number(projectId),
      },
      include: {
        templates: {
          where: {
            status: 'ACTIVE',
          },
          orderBy: {
            sequence: 'asc',
          },
        },
      },
    })

    if (!project) {
      return res.status(404).json({
        message: 'Project not found',
      })
    }

    // TODO: (not in poc) open a node and use its rpcs
    const node = await prisma.node.create({
      data: {
        projectId: project.id,
        privateRpcUrl: PRIVATE_RPC_URL,
        publicRpcUrl: PUBLIC_RPC_URL,
        name: nodeName,
      },
    })

    const ethereumService = new EthereumService.Service(node.privateRpcUrl)

    try {
      const deployer = await ethereumService.getDefaultSigner()
      let context = {
        ADMIN: deployer.address,
      }
      const templates = _.sortBy(project.templates, 'sequence')
      // TODO: batch transactions
      for (const template of templates) {
        const script = template.script.trim()
        const configuration = template.configuration.trim()
        const deployCmd = parseCommand<Command.DeployContract>(
          configuration,
          context,
        )
        console.log('deployCmd:', deployCmd)
        const contractName = deployCmd.contractName
        const compileOutput = await ethereumService.compile({
          [contractName]: script,
        })
        const contract = await ethereumService.deploy({
          contractFactory: compileOutput[contractName].contractFactory,
          constructorArguments: deployCmd.constructor || [],
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
            const tx = await ethereumService.call(
              contract,
              func.name,
              func.arguments,
            )
            console.log(
              'contract called',
              contractName,
              address,
              func.name,
              tx?.hash,
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
        contracts: {
          orderBy: {
            sequence: 'asc',
          },
        },
      },
    })
    if (!nodeResult) {
      return res.status(500).json({
        message: 'Node not found, wtf?',
      })
    }
    res.json({
      id: nodeResult.id,
      name: nodeResult.name,
      privateRpcUrl: nodeResult.privateRpcUrl,
      publicRpcUrl: nodeResult.publicRpcUrl,
      projectId: nodeResult.projectId,
      project: nodeResult.project,
      contracts: nodeResult.contracts,
      createdAt: nodeResult.createdAt,
      updatedAt: nodeResult.updatedAt,
    })
  }
}
