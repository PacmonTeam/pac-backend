import { ethers } from 'ethers'

import { getDefaultSigner } from './hardhat'

export interface IDeployContractInput {
  contractFactory: ethers.ContractFactory
  constructorArguments: ethers.ContractMethodArgs<any[]>
}

export const deploy = async (contractInput: IDeployContractInput) => {
  const signer = await getDefaultSigner()

  const contractFactory = contractInput.contractFactory

  const tx = await contractFactory
    .connect(signer)
    .deploy(...contractInput.constructorArguments)
  const contract = await tx.waitForDeployment()
  return contract
}
