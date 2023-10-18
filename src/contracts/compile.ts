import _ from 'lodash'
import solc from 'solc'

export interface ICompileContractInput {
  [name: string]: string
}

export interface ICompileContractOutput {
  [name: string]: string
}

interface ICompileSource {
  [name: string]: {
    content: string
  }
}

interface ICompileOutputSelection {
  [name: string]: {
    [contractName: string]: string[]
  }
}

export const compile = async (contracts: ICompileContractInput) => {
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
      prev[name] = bytecode
      return prev
    },
    {} as ICompileContractOutput,
  )

  return out
}
