import { Request, Response } from 'express'

import { EthereumService } from '@/lib/ethereum'
import { getPrisma } from '@/lib/prisma'

import { ErrorResponseBody } from './utils'

const prisma = getPrisma()

export interface Node {
  id: number
  name: string
  privateRpcUrl: string
  publicRpcUrl: string
}

export namespace NodeRouter {
  interface GetInfoRequestParams {
    nodeId: number
  }
  interface GetInfoResponseBody {
    rpc: string
    name: string
    createdAt: Date
    updatedAt: Date
    signers: {
      address: string
      privateKey: string
    }[]
  }
  export async function getInfo(
    req: Request<GetInfoRequestParams>,
    res: Response<GetInfoResponseBody | ErrorResponseBody>,
  ) {
    const { nodeId } = req.params
    const node = await prisma.node.findUnique({
      where: {
        id: Number(nodeId),
      },
    })
    if (!node) {
      return res.status(404).json({
        message: 'Node not found',
      })
    }
    const signers = EthereumService.getSigners()
    res.json({
      rpc: node.publicRpcUrl,
      name: node.name,
      signers,
      createdAt: node.createdAt,
      updatedAt: node.updatedAt,
    })
  }

  interface ResetRequestParams {
    nodeId: number
  }
  interface ResetResponseBody {
    success: boolean
    updatedAt: Date
  }
  export async function reset(
    req: Request<ResetRequestParams>,
    res: Response<ResetResponseBody | ErrorResponseBody>,
  ) {
    const { nodeId } = req.params
    const node = await prisma.node.findUnique({
      where: {
        id: Number(nodeId),
      },
    })
    if (!node) {
      return res.status(404).json({
        message: 'Node not found',
      })
    }
    const ethereumService = new EthereumService.Service(node.privateRpcUrl)
    await ethereumService.reset()
    const updatedNode = await prisma.node.update({
      where: {
        id: Number(nodeId),
      },
      data: {
        updatedAt: new Date(),
      },
    })
    res.json({
      updatedAt: updatedNode.updatedAt,
      success: true,
    })
  }
}
