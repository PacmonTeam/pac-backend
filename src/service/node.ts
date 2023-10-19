import { Request, Response } from 'express'

import { ethereumService } from '@/lib/ethereum'

import { ErrorResponseBody } from './utils'

export namespace NodeRouter {
  interface GetInfoResponseBody {
    rpc: string
    signers: {
      address: string
      privateKey: string
    }[]
  }
  export async function getInfo(
    req: Request,
    res: Response<GetInfoResponseBody | ErrorResponseBody>,
  ) {
    const rpc = process.env.NODE_RPC_URL || ''
    const signers = ethereumService.getSigners()
    res.json({
      rpc,
      signers,
    })
  }

  interface ResetResponseBody {
    success: boolean
  }
  export async function reset(
    req: Request,
    res: Response<ResetResponseBody | ErrorResponseBody>,
  ) {
    ethereumService.reset()
    res.json({
      success: true,
    })
  }
}
