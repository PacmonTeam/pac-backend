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

export async function create(
  req: Request<{}, any, any, ParsedQs, Record<string, any>>,
  res: Response,
) {
  const data = req.body.templates
  const templateList = data.map(mappingTemplateData)

  const result = await prisma.template.createMany({
    data: templateList,
  })

  res.json(result)
}

export async function getAll(
  req: Request<{}, any, any, ParsedQs, Record<string, any>>,
  res: Response,
) {
  const result = await prisma.template.findMany()

  res.json(result)
}
