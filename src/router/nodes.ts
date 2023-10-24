import { NodeContract, Project } from '@prisma/client'
import { Request, Response } from 'express'
import _ from 'lodash'

import { EthereumService } from '@/lib/ethereum'
import { getPrisma } from '@/lib/prisma'

import { ErrorResponseBody } from './utils'

const prisma = getPrisma()

interface NodeResponse {
  id: number
  name: string
  rpc: string
  project: Project
  contracts: NodeContract[]
  createdAt: Date
  updatedAt: Date
}

export namespace NodeRouter {
  interface GetRequestParams {
    nodeId: number
  }
  interface GetResponseBody {
    id: number
    name: string
    rpc: string
    project: Project
    contracts: NodeContract[]
    signers: {
      address: string
      privateKey: string
    }[]
    createdAt: Date
    updatedAt: Date
  }
  export async function get(
    req: Request<GetRequestParams>,
    res: Response<GetResponseBody | ErrorResponseBody>,
  ) {
    const { nodeId } = req.params
    const node = await prisma.node.findUnique({
      where: {
        id: Number(nodeId),
      },
      include: {
        project: true,
        contracts: true,
      },
    })
    if (!node) {
      return res.status(404).json({
        message: 'Node not found',
      })
    }
    const signers = EthereumService.getSigners()
    res.json({
      id: node.id,
      rpc: node.publicRpcUrl,
      name: node.name,
      project: node.project,
      contracts: node.contracts,
      signers,
      createdAt: node.createdAt,
      updatedAt: node.updatedAt,
    })
  }

  interface ListResponseNode {
    id: number
    name: string
    rpc: string
    project: Project
    createdAt: Date
    updatedAt: Date
  }
  export async function list(
    req: Request,
    res: Response<ListResponseNode[] | ErrorResponseBody>,
  ) {
    const { nodeId } = req.params
    const nodes = await prisma.node.findMany({
      include: {
        project: true,
      },
    })
    res.json(
      _.map(nodes, (node) => ({
        id: node.id,
        rpc: node.publicRpcUrl,
        name: node.name,
        project: node.project,
        createdAt: node.createdAt,
        updatedAt: node.updatedAt,
      })),
    )
  }

  interface ResetRequestBody {
    nodeId: number
  }
  interface ResetResponseBody {
    success: boolean
    updatedAt: Date
  }
  export async function reset(
    req: Request<ResetRequestBody>,
    res: Response<ResetResponseBody | ErrorResponseBody>,
  ) {
    const { nodeId } = req.body
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

  interface DeleteRequestBody {
    nodeId: number
  }
  interface DeleteResponseBody {
    id: number
    success: boolean
  }
  export async function deleteNode(
    req: Request<DeleteRequestBody>,
    res: Response<DeleteResponseBody | ErrorResponseBody>,
  ) {
    const { nodeId } = req.body
    const node = await prisma.node.delete({
      where: {
        id: Number(nodeId),
      },
    })
    res.json({
      id: node.id,
      success: true,
    })
  }

  interface CallRequestBody {
    nodeId: number
    contractAddress: string
    encodedData: string
    callerAddress: string
  }
  interface CallResponseBody {
    txHash: string
    blockHash: string
    blockNumber: number
  }
  export async function call(
    req: Request<{}, any, CallRequestBody>,
    res: Response<CallResponseBody | ErrorResponseBody>,
  ) {
    const { nodeId, contractAddress, encodedData, callerAddress } = req.body
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
    const txReceipt = await ethereumService.callRaw(
      contractAddress,
      encodedData,
      callerAddress,
    )
    if (!txReceipt) {
      return res.status(500).json({
        message: 'Transaction failed',
      })
    }

    res.json({
      txHash: txReceipt.hash,
      blockHash: txReceipt.blockHash as string,
      blockNumber: txReceipt.blockNumber as number,
    })
  }
}
