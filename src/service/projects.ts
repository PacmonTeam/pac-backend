import { $Enums } from '@prisma/client'
import { Request, Response } from 'express'
import _ from 'lodash'
import { ParsedQs } from 'qs'

import { Command, parseCommand } from '@/lib/commandParser'
import { ethereumService } from '@/lib/ethereum'
import { getPrisma } from '@/lib/prisma'

import { ErrorResponseBody } from './utils'

const prisma = getPrisma()

interface Template {
  id: number
  script: string
  configuration: string
  sequence: number
  projectId: number
  address: string | null
  status: $Enums.Status
}

interface Project {
  id: number
  name: string
  templates: Template[]
}

interface MinimalTemplate {
  id: number
  sequence: number
  address: string | null
  status: $Enums.Status
}

interface MinimalProject {
  id: number
  name: string
  templates: MinimalTemplate[]
}

export namespace ProjectRouter {
  function mapMinimalTemplate(t: Template): MinimalTemplate {
    return {
      id: t.id,
      sequence: t.sequence,
      address: t.address,
      status: t.status,
    }
  }
  interface CreateRequestBody {
    name: string
    templates: {
      script: string
      configuration: string
      sequence: number
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
            configuration: template.configuration,
            script: template.script,
            sequence: template.sequence,
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

  interface UpdateRequestBody {
    id: number
    name: string
    templates: {
      script: string
      configuration: string
      sequence: number
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

    await prisma.template.deleteMany({
      where: {
        projectId: id,
      },
    })

    const createdTemplates: Template[] = await prisma.$transaction(
      _.map(templates, (template) =>
        prisma.template.create({
          data: {
            configuration: template.configuration,
            script: template.script,
            sequence: template.sequence,
            address: null,
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

  interface GetRequestParams {
    projectId: number
  }

  export async function get(
    req: Request<GetRequestParams, any, any, ParsedQs, Record<string, any>>,
    res: Response<Project | ErrorResponseBody>,
  ) {
    const { projectId } = req.params
    const result = await prisma.project.findUnique({
      where: {
        id: Number(projectId),
      },
      include: {
        templates: true,
      },
    })

    if (!result) {
      return res.status(404).json({
        message: 'Project not found',
      })
    }

    res.json({
      id: result.id,
      name: result.name,
      templates: _.map(result.templates),
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
      })),
    )
  }

  interface DeleteRequestBody {
    projectId: number
  }
  interface DeleteResponseBody {
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

  interface DeployRequestBody {
    projectId: number
  }

  export async function deploy(
    req: Request<{}, any, DeployRequestBody, ParsedQs, Record<string, any>>,
    res: Response<Project | ErrorResponseBody>,
  ) {
    const { projectId } = req.body
    const project = await prisma.project.findUnique({
      where: {
        id: Number(projectId),
      },
      include: {
        templates: true,
      },
    })

    if (!project) {
      return res.status(404).json({
        message: 'Project not found',
      })
    }

    try {
      const signer = await ethereumService.getDefaultSigner()
      let context = {
        ADMIN: signer.address,
      }
      // TODO: batch transactions
      for (const template of project.templates) {
        const script = template.script.trim()
        const configuration = template.configuration.trim()
        const deployCmd = parseCommand<Command.DeployContract>(
          configuration,
          context,
        )
        const compileOutput = await ethereumService.compile({
          [deployCmd.name]: script,
        })
        const contract = await ethereumService.deploy({
          contractFactory: compileOutput[deployCmd.name].contractFactory,
          constructorArguments: deployCmd.constructor,
        })
        const address = await contract.getAddress()
        context[deployCmd.output] = address
        if (deployCmd.functions) {
          for (const func of deployCmd.functions) {
            const tx = await ethereumService.call(
              contract,
              func.name,
              func.arguments,
            )
          }
        }
        await prisma.template.update({
          where: {
            id: template.id,
          },
          data: {
            address: address,
          },
        })
      }
    } catch (e: any) {
      return res.status(500).json({
        message: e.message,
      })
    }

    const projectResult = await prisma.project.findUnique({
      where: {
        id: Number(projectId),
      },
      include: {
        templates: true,
      },
    })
    if (!projectResult) {
      return res.status(500).json({
        message: 'Project not found, wtf?',
      })
    }
    res.json(projectResult)
  }
}
