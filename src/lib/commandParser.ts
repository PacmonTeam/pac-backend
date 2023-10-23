import Handlebars from 'handlebars'
import YAML from 'yaml'

export namespace Command {
  export type DeployContractFunction = {
    name: string
    arguments: any[]
  }

  export type DeployContract = {
    contractName: string
    constructor: any[]
    functions?: DeployContractFunction[]
    output: string
  }
}

export const parseCommand = <T = Command.DeployContract>(
  commandString: string,
  context: any,
): T => {
  const template = Handlebars.compile(commandString)
  const commandWithArguments = template(context)
  return YAML.parse(commandWithArguments, {
    intAsBigInt: true,
  })
}
