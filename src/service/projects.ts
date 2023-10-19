import { $Enums } from '@prisma/client'
import { Request, Response } from 'express'
import _ from 'lodash'
import { ParsedQs } from 'qs'

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
            ...template,
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
        id: id,
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
            ...template,
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
        id: projectId,
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
        id: projectId,
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
    res: Response<MinimalProject | ErrorResponseBody>,
  ) {
    const { projectId } = req.body
    const result = await prisma.project.findUnique({
      where: {
        id: projectId,
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

    // TODO: Deploy project
    throw new Error('Not implemented')
  }
}
