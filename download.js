const fs = require('node:fs')
const util = require('node:util')
const jsdom = require('jsdom')
const { JSDOM } = jsdom
const {
  getProxyConfig,
  getDLSiteLink,
  parseName,
  updateDB,
  renameFiles
} = require('./util')
const db = require('./db.json')

const readdir = util.promisify(fs.readdir)

const axios = require('axios')

const requestDLSite = async ({
  rjCodes,
  curTry = 0,
  maxReTry = 3,
  redirectUrlMap = {},
  proxyConfig: axiosProxyConfig,
  rjCode2DocumentMap = {}
}) => {
  let _rjCodes = [...rjCodes]
  if (!rjCodes.length) return rjCode2DocumentMap
  if (curTry < maxReTry + 1) {
    if (curTry >= 1) {
      console.log(`\nRetry Times: ${curTry}\n`)
    }
    try {
      const _redirectUrlMap = redirectUrlMap
      const res = await Promise.allSettled(
        rjCodes.map((c) =>
          axios.get(redirectUrlMap[c] || getDLSiteLink(c), {
            proxy: axiosProxyConfig,
            headers: {
              cookie: 'locale=zh-cn'
            }
          })
        )
      )
      res.forEach((r, i) => {
        if (r.status === 'fulfilled') {
          const curCode = rjCodes[i]
          const data = r.value
          const statusCode = data.status
          if (statusCode === 200) {
            rjCode2DocumentMap[curCode] = new JSDOM(data.data, {
              contentType: 'text/html; charset=utf-8'
            }).window.document
            _rjCodes = _rjCodes.filter((i) => i !== curCode)
            console.log(`OK: request ${curCode}`)
          } else if (statusCode === 302) {
            _redirectUrlMap[curCode] = data.headers.location
            console.log(`Redirect: request ${curCode}`)
          } else {
            console.log(`Failed: request ${curCode}`)
          }
        }
      })
      if (_rjCodes.length) {
        return requestDLSite({
          rjCodes: _rjCodes,
          curTry: curTry + 1,
          maxTry: maxReTry,
          redirectUrlMap: _redirectUrlMap,
          proxyConfig: axiosProxyConfig,
          rjCode2DocumentMap
        })
      } else {
        return rjCode2DocumentMap
      }
    } catch (e) {
      console.log(e.message)
    }
  } else {
    const errorMessage = rjCodes.length ? 'maxTry reached' : 'no rjCodes error'
    console.error(errorMessage)
    return rjCode2DocumentMap
  }
}

const getRjCode2NameMap = ({ rjCodes, code2DocMap, code2NameMap = {} }) => {
  rjCodes.forEach((code) => {
    const doc = code2DocMap[code]
    // 社团
    const brand = doc
      ?.querySelector?.('span[itemprop="brand"]')
      ?.textContent?.trim()
    const title = doc?.querySelector?.('#work_name')?.textContent?.trim()
    if (brand && title) {
      const name = `[${code}][${brand}]${title}`
      code2NameMap[code] = parseName(name)
    } else {
      console.error(`${code} parse ERROR: failed to get info from document`)
    }
  })
  return code2NameMap
}

async function download (rootPath) {
  try {
    const files = await readdir(rootPath, { encoding: 'utf8' })
    const rjCodeToFileNameMap = {}
    let rjCodes = []
    let toQueryRjCodes = []
    files.forEach((file) => {
      const rjCode = file.match(/(?<name>(r|v)j\d+)/i)?.groups.name
      if (rjCode) {
        // console.log(rjCode + ' ' + file)
        rjCodeToFileNameMap[rjCode] = rjCodeToFileNameMap[rjCode] || [];
        rjCodeToFileNameMap[rjCode].push(file)
        rjCodes.push(rjCode)
        if (db[rjCode]) {
          console.log(`✔️ found ${rjCode} in db`)
        } else {
          toQueryRjCodes.push(rjCode)
        }
      }
    })

    const proxyConfig = getProxyConfig()

    // uniq
    rjCodes = [...new Set(rjCodes)];
    toQueryRjCodes = [...new Set(toQueryRjCodes)];

    const code2DocMap = await requestDLSite({
      rjCodes: toQueryRjCodes,
      proxyConfig
    })

    console.log('query over~')

    const rjCode2NameMap = getRjCode2NameMap({
      rjCodes: toQueryRjCodes,
      code2DocMap
    })

    updateDB(rjCode2NameMap)

    console.log('update db over~')

    renameFiles({ rjCodes, rjCodeToFileNameMap, rootPath })
  } catch (e) {
    console.error(e)
    return e
  }
}

module.exports = {
  download
}
