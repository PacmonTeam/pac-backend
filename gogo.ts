import fs from 'fs'
import path from 'path'
import solc from 'solc'

const main = async () => {
  const PacERC20 = fs.readFileSync(
    path.join(__dirname, '../flatten/PacERC20.sol'),
    'utf8'
  )
  var input = {
    language: 'Solidity',
    sources: {
      'PacERC20.sol': {
        content: PacERC20,
      },
    },
    settings: {
      outputSelection: {
        '*': {
          '*': ['*'],
        },
      },
    },
  }

  // console.log('🚀 turbo ~ file: gogo.ts:5 ~ PacERC20:', PacERC20)
  const compiled = solc.compile(JSON.stringify(input))

  // console.log('🚀 turbo ~ file: gogo.ts:13 ~ compiled:', compiled)

  var output = JSON.parse(compiled)

  // `output` here contains the JSON output as specified in the documentation
  for (var contractName in output.contracts['PacERC20.sol']) {
    console.log(
      contractName +
        ': ' +
        output.contracts['PacERC20.sol'][contractName].evm.bytecode.object
    )
  }
}

main()
