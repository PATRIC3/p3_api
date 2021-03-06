const assert = require('chai').assert
const { httpRequest } = require('../../util/http')
const Http = require('http')
const Config = require('../../config')
const Fs = require('fs')
const Path = require('path')
const MAX_TIMEOUT = 1 * 60 * 1000

const agent = new Http.Agent({
  keepAlive: true,
  maxSockets: 3
})
const requestOptions = {
  port: Config.get('http_port'),
  agent: agent
}
const ExpectedFeatureDnaFasta = Fs.readFileSync(Path.join(__dirname, 'expected.dna_fasta.txt'), {
  encoding: 'utf8'
})

const ExpectedSequenceDnaFasta = Fs.readFileSync(Path.join(__dirname, 'expected.dna_fasta.2.txt'), {
  encoding: 'utf8'
})

describe('Test Media Types: dna+fasta', function () {
  describe('genome_feature', () => {
    it('Test call_method: stream', async function () {
      this.timeout(MAX_TIMEOUT)

      return httpRequest(Object.assign(requestOptions, {
        headers: {
          'Accept': 'application/dna+fasta',
          'Content-Type': 'application/x-www-form-urlencoded',
          'download': true
        },
        method: 'POST',
        path: '/genome_feature/'
      }), 'rql=eq%28feature_id%252CPATRIC.83332.12.NC_000962.CDS.2052.3260.fwd%29%2526sort%28%252Bfeature_id%29%2526limit%281%29')
        .then((body) => {
          assert.equal(body, ExpectedFeatureDnaFasta)
        })
    })

    it('Test call_method: query', async function () {
      this.timeout(MAX_TIMEOUT)

      return httpRequest(Object.assign(requestOptions, {
        headers: {
          'Accept': 'application/dna+fasta',
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        method: 'POST',
        path: '/genome_feature/'
      }), 'rql=eq%28feature_id%252CPATRIC.83332.12.NC_000962.CDS.2052.3260.fwd%29%2526sort%28%252Bfeature_id%29%2526limit%281%29')
        .then((body) => {
          assert.equal(body, ExpectedFeatureDnaFasta)
        })
    })

    it('Test call_method: query. multiple rows', async function () {
      this.timeout(MAX_TIMEOUT)

      return httpRequest(Object.assign(requestOptions, {
        headers: {
          'Accept': 'application/dna+fasta',
          'Content-Type': 'application/rqlquery+x-www-form-urlencoded'
        },
        method: 'POST',
        path: '/genome_feature/'
      }), 'in(feature_id,(PATRIC.83332.12.NC_000962.CDS.18759.20207.rev,PATRIC.83332.12.NC_000962.CDS.17467.18762.rev,PATRIC.83332.12.NC_000962.CDS.15590.17470.rev,PATRIC.83332.12.NC_000962.CDS.14914.15612.fwd,PATRIC.83332.12.NC_000962.CDS.14134.14877.fwd,PATRIC.83332.12.NC_000962.CDS.13714.13995.rev,PATRIC.83332.12.NC_000962.CDS.13133.13447.rev,PATRIC.83332.12.NC_000962.CDS.13024.13176.rev,PATRIC.83332.12.NC_000962.CDS.12486.13016.fwd,PATRIC.83332.12.NC_000962.CDS.11874.12311.rev,PATRIC.83332.12.NC_000962.CDS.11555.11692.rev,PATRIC.83332.12.NC_000962.CDS.10999.11121.fwd,PATRIC.83332.12.NC_000962.CDS.10484.10828.fwd,PATRIC.83332.12.NC_000962.CDS.9963.10160.fwd,PATRIC.83332.12.NC_000962.CDS.7302.9818.fwd,PATRIC.83332.12.NC_000962.CDS.5207.7267.fwd,PATRIC.83332.12.NC_000962.CDS.4497.4997.fwd,PATRIC.83332.12.NC_000962.CDS.3280.4437.fwd,PATRIC.83332.12.NC_000962.CDS.2052.3260.fwd,PATRIC.83332.12.NC_000962.CDS.34.1524.fwd))&sort(+feature_id)&limit(20)')
        .then((body) => {
          assert.isNotEmpty(body)
        })
    })
  })

  describe('genome sequence', function () {
    it('Test call_method: stream', async function () {
      this.timeout(MAX_TIMEOUT)

      return httpRequest(Object.assign(requestOptions, {
        headers: {
          'Accept': 'application/dna+fasta',
          'Content-Type': 'application/x-www-form-urlencoded',
          'download': true
        },
        method: 'POST',
        path: '/genome_sequence/'
      }), 'rql=in%28sequence_id%252C%281765.317.con.0070%29%29%2526sort%28%252Bsequence_id%29%2526limit%282500000%29')
        .then((body) => {
          assert.equal(body, ExpectedSequenceDnaFasta)
        })
    })

    it('Test call_method: query', async function () {
      this.timeout(MAX_TIMEOUT)

      return httpRequest(Object.assign(requestOptions, {
        headers: {
          'Accept': 'application/dna+fasta',
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        method: 'POST',
        path: '/genome_sequence/'
      }), 'rql=in%28sequence_id%252C%281765.317.con.0070%29%29%2526sort%28%252Bsequence_id%29%2526limit%282500000%29')
        .then((body) => {
          assert.equal(body, ExpectedSequenceDnaFasta)
        })
    })
  })
})
