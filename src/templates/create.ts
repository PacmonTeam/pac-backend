import { getPrisma } from '@lib/prisma'
import { Request, Response } from 'express'
import { ParsedQs } from 'qs'

const prisma = getPrisma()

type CreateTemplateInput = {
  script: string
  configuration: string
  sequence: number
}

function mappingTemplateData(data: any): CreateTemplateInput {
  const script: string = data.script
  const configuration: string = data.configuration
  const sequence: number = data.sequence
  return {
    script,
    configuration,
    sequence,
  }
}

export function createTemplatesMiddleware(
  req: Request<{}, any, any, ParsedQs, Record<string, any>>,
  res: Response,
) {
  const data = req.body.templates
  const templateList = data.map(mappingTemplateData)

  return prisma.template.createMany({
    data: templateList,
  })
}
