import { ethers } from 'ethers'
import _ from 'lodash'
import solc from 'solc'

import { PRIVATE_RPC_URL } from '@/env'

export namespace EthereumService {
  export interface IDeployContractInput {
    contractFactory: ethers.ContractFactory
    constructorArguments: ethers.ContractMethodArgs<any[]>
  }

  export interface ICompileContractInput {
    [name: string]: string
  }

  export interface ICompileContractOutput {
    [name: string]: {
      bytecode: string
      contractFactory: ethers.ContractFactory
    }
  }

  export interface ICompileSource {
    [name: string]: {
      content: string
    }
  }

  export interface ICompileOutputSelection {
    [name: string]: {
      [contractName: string]: string[]
    }
  }

  export class Service {
    private _provider: ethers.JsonRpcProvider

    constructor() {
      this._provider = new ethers.JsonRpcProvider(PRIVATE_RPC_URL)
    }

    getDefaultSigner = async () => {
      const signer = await this._provider.getSigner(0)
      return signer
    }

    reset = () => this._provider.send('hardhat_reset', [])

    deploy = async (contractInput: IDeployContractInput) => {
      const signer = await this.getDefaultSigner()
      const contractFactory = contractInput.contractFactory
      const tx = await contractFactory
        .connect(signer)
        .deploy(...contractInput.constructorArguments)
      const contract = await tx.waitForDeployment()
      return contract
    }

    compile = async (contracts: ICompileContractInput) => {
      const sources = _.reduce(
        contracts,
        (prev, code, name) => {
          prev[name] = {
            content: code,
          }
          return prev
        },
        {} as ICompileSource,
      )
      const outputSelection = _.reduce(
        contracts,
        (prev, code, name) => {
          prev[name] = {
            [name]: ['*'],
          }
          return prev
        },
        {} as ICompileOutputSelection,
      )

      var input = {
        language: 'Solidity',
        sources: sources,
        settings: {
          outputSelection: outputSelection,
        },
      }

      const compiled = solc.compile(JSON.stringify(input))

      var output = JSON.parse(compiled)

      const out = _.reduce(
        contracts,
        (prev, code, name) => {
          const bytecode = output.contracts[name][name].evm.bytecode.object
          prev[name] = {
            bytecode,
            contractFactory: ethers.ContractFactory.fromSolidity(
              output.contracts[name][name],
            ),
          }
          return prev
        },
        {} as ICompileContractOutput,
      )

      return out
    }
  }
}
