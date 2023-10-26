import axios from 'axios'
import _ from 'lodash'

import { PRIVATE_RPC_URL } from '@/env'
import { EthereumService } from '@/lib/ethereum'

const main = async () => {
  const resp = await axios.get('https://o.pacmon.suijin.xyz/api/projects/17')
  console.log('🚀 turbo ~ file: example.ts:8 ~ resp:', resp.data)
  const project = resp.data
  const t = project.templates[0]
  console.log(t.script)

  const ethereumService = new EthereumService.Service(PRIVATE_RPC_URL)
  const compileOutput = await ethereumService.compile({
    ['PacERC20']: t.script,
  })
  console.log('🚀 turbo ~ file: example.ts:18 ~ compileOutput:', compileOutput)
}

main()
