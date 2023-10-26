import fs from 'fs'
import path from 'path'

const main = async () => {
  const pacDemoSrc = fs
    .readFileSync(path.resolve(__dirname, '../hardhat/flatten/PacDemo.sol'))
    .toString()
  const pacDemoConfig = fs
    .readFileSync(path.resolve(__dirname, './PacDemo.yaml'))
    .toString()

  const data = {
    script: pacDemoSrc,
    configuration: pacDemoConfig,
  }

  fs.writeFileSync(
    path.resolve(__dirname, './generated.json'),
    JSON.stringify(data),
  )
}

main()
