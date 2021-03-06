const assert = require('chai').assert
const { httpGet } = require('../../util/http')
const Http = require('http')
const Fs = require('fs')
const Config = require('../../config')
const TREE_DIRECTORY = Config.get('treeDirectory')
const Path = require('path')

const agent = new Http.Agent({
  keepAlive: true,
  maxSockets: 3
})
const requestOptions = {
  port: Config.get('http_port'),
  agent: agent
}

describe('Test Media Types: newick+json', function () {
  it('Test media type: newick+json', async function () {
    return httpGet(Object.assign(requestOptions, {
      headers: {
        'Accept': 'application/newick+json',
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      path: '/taxonomy/1763'
    }))
      .then((body) => {
        const path = Path.join(TREE_DIRECTORY, '2037.json')
        const expected = Fs.readFileSync(path, {
          encoding: 'utf8'
        })
        assert.equal(body.trimEnd(), expected.trimEnd())
      })
  })

  it('Test 404 Error', async function () {
    return httpGet(Object.assign(requestOptions, {
      headers: {
        'Accept': 'application/newick+json',
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      path: '/taxonomy/10239'
    }))
      .then((body) => {
        assert.deepEqual(JSON.parse(body), {})
      })
  })
})
