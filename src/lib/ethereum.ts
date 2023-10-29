import { Contract, ethers } from 'ethers'
import _ from 'lodash'
import solc from 'solc'

// This is public knowledge, no security risk
const FIXED_WALLETS = [
  {
    address: '0x67b1d87101671b127f5f8714789C7192f7ad340e',
    privateKey:
      '26e86e45f6fc45ec6e2ecd128cec80fa1d1505e5507dcd2ae58c3130a7a97b48',
  },
  {
    address: '0xa94f5374Fce5edBC8E2a8697C15331677e6EbF0B',
    privateKey:
      '45a915e4d060149eb4365960e6a7a45f334393093061116b197e3240065ff2d8',
  },
]

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

    constructor(rpcUrl: string) {
      this._provider = new ethers.JsonRpcProvider(rpcUrl)
    }

    getDefaultSigner = async () => {
      const wallet = new ethers.Wallet(FIXED_WALLETS[0].privateKey)
      const signer = wallet.connect(this._provider)
      return signer
    }

    deploy = async (contractInput: IDeployContractInput) => {
      const signer = await this.getDefaultSigner()
      const contractFactory = contractInput.contractFactory
      const tx = await contractFactory
        .connect(signer)
        .deploy(...contractInput.constructorArguments)
      const contract = (await tx.waitForDeployment()) as Contract
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
      const compiled = solc.compile(JSON.stringify(input), {
        evmVersion: 'paris',
      })
      const output = JSON.parse(compiled)

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

    call = async (contract: ethers.Contract, method: string, args: any[]) => {
      const signer = await this.getDefaultSigner()
      const tx: ethers.ContractTransactionResponse = await contract
        .connect(signer)
        [method](...args)
      const receipt = await tx.wait()
      return receipt
    }

    callRaw = async (contractAddress: string, encodedCallData: string) => {
      const signer = await this.getDefaultSigner()
      const txCount = await this._provider.getTransactionCount(signer.address)
      const tt = await signer.estimateGas({
        data: encodedCallData,
        to: contractAddress,
        from: signer.address,
        nonce: txCount,
      })
      const tx: ethers.TransactionResponse = await signer.sendTransaction({
        data: encodedCallData,
        to: contractAddress,
        from: signer.address,
        nonce: txCount,
      })
      const receipt = await tx.wait()
      return receipt
    }

    getContract = async (address: string): Promise<ethers.Contract> => {
      return new ethers.Contract(address, [], this._provider)
    }
  }

  export const getSigners = () => {
    return FIXED_WALLETS
  }
}
