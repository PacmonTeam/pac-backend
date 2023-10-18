import { ethers } from 'ethers'

import { PRIVATE_RPC_URL } from '@/env'

export const provider = new ethers.JsonRpcProvider(PRIVATE_RPC_URL)

export const getDefaultSigner = async () => {
  const signer1 = await provider.getSigner(0)
  return signer1
}
