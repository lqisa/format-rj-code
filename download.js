const fs = require('fs')
const util = require('util')
const https = require('https')
const SocksProxyAgent = require('socks-proxy-agent')
const url = require('url')
const jsdom = require('jsdom')
const { JSDOM } = jsdom

const readdir = util.promisify(fs.readdir)

const maxTry = 2
let curTry = 0
let globalRes = {}

const specialCharsMap = {
  '?': '？',
  '!': '！',
  '\\': '／',
  '\:': '：',
  '*': '×',
  '|': ' ',
  '"': '\'',
  '<': '＜',
  '>': '＞',
  '/': '／',
}

const normalMusicSuffixes = [
  'mp3',
  'm4a',
  'aac',
  'wav',
  'flac',
  'ape',
  'ogg',
  'oga',
  'wma'
]

const getDLSiteLink = (rjCode) => {
  const proxy = process.env.socks_proxy || 'socks://127.0.0.1:7890'
  const endpoint = `https://www.dlsite.com/maniax/work/=/product_id/${rjCode}.html`
  // const opts = new url.URL(endpoint)
  const opts = url.parse(endpoint)
  // create an instance of the `SocksProxyAgent` class with the proxy server information
  const agent = new SocksProxyAgent(proxy)
  opts.agent = agent
  return opts
}



const parseName = (name) => {
  let curName = name;
  Object.keys(specialCharsMap).forEach(c => {
    curName = curName.replaceAll(c, specialCharsMap[c])
  })
  return curName;
}

const initFn = () => {
  curTry = 0
  globalRes = {}
}

const requsetDLSite = (rjCodes) => {
  return new Promise((resolve, reject) => {
    if (curTry < maxTry && rjCodes.length) {
      curTry++
      if (curTry > 1) {
        console.log('\nRetry: \n')
      }
      const codesLength = rjCodes.length
      let totalReqCnt = 0
      const failedCodes = []
      for (let i = 0; i < codesLength; i++) {
        const curCode = rjCodes[i]
        const opts = getDLSiteLink(curCode)
        https.get(opts, (res) => {
          let data = ''
          res.setEncoding('utf8')
          res.on('data', (chunk) => {
            data += chunk
          })
          res.on('end', () => {
            totalReqCnt++
            console.log(`✔️ request ${curCode} ok`)
            globalRes[curCode] = new JSDOM(data, { contentType: 'text/html; charset=utf-8' }).window.document
            // console.log(globalRes)
            if (totalReqCnt === codesLength) {
              if (failedCodes.length) {
                requsetDLSite(failedCodes).then(resolve)
              }
              resolve()
            }
          })
        }).on('error', (e) => {
          totalReqCnt++
          console.log(`❌ request ${curCode} failed: ${e}`)
          failedCodes.push(curCode)
          if (totalReqCnt === codesLength) {
            requsetDLSite(failedCodes).then(resolve)
          }
        })
      }
    } else {
      const errorMessage = `${curTry > maxTry ? 'maxTry reached' : 'input rjcodes'}`
      console.error(errorMessage)
      reject(errorMessage)
    }
  }).catch(e => {
    console.error(e)
  })
}

async function download(rootPath) {
  try {
    const files = await readdir(rootPath, { encoding: 'utf8' })
    // console.log('files: \n', files.toString().replace(/,/g, '\n'))
    // console.log('\n\n Audios: \n')

    const rjCodeToNameMap = {}
    const rjCodes = []
    files.forEach((file) => {
      const rjCode = file.match(/(?<name>rj\d+)/i)?.groups.name
      if (rjCode) {
        // console.log(rjCode + ' ' + file)
        rjCodeToNameMap[rjCode] = file
        rjCodes.push(rjCode)
      }
    })
    initFn()

    await requsetDLSite(rjCodes)

    const finalTitles = {}
    rjCodes.forEach(code => {
      const doc = globalRes[code]
      // 社团
      const brand = doc.querySelector('span[itemprop="brand"]')?.textContent?.trim() || 'error'
      const title = doc.querySelector('#work_name')?.textContent?.trim() || 'error'
      const name = `[${code}][${brand}]${title}`;
      finalTitles[code] = parseName(name);
    })

    console.log('query over~')
    console.log('finalTitles: ', finalTitles)

    // fs.unlinkSync('./final.json')

    fs.writeFileSync('./final.json', '[\n', { flag: 'w' })
    const allCodes = Object.keys(finalTitles)
    allCodes.forEach((code, index) => {
      const fileName = rjCodeToNameMap[code]
      if (fileName) {
        try {
          let suffix = fileName.substr(fileName.lastIndexOf('.') - 1) || ''
          if (suffix && !normalMusicSuffixes.includes(suffix)) suffix = '';
          fs.writeFileSync('./final.json', `  ["${fileName}", "${finalTitles[code]}${suffix}"]${index === allCodes.length - 1 ? '' : ','}\n`, { flag: 'a+' })
          // fs.writeFileSync('./final.json', `  ["${fileName}", "${finalTitles[code]}"]${index === allCodes.length - 1 ? '' : ','}\n`, { flag: 'a+' })
        } catch (e) {
          console.log('failed to write final result:', e)
        }
        // fs.rename(`${rootPath}${fileName}`, `${rootPath}${finalTitles[code]}`, (e) => {
        //   if (e) { console.log(`failed to rename ${code}: ${e}`) }
        // })
        // console.log(`${rootPath}${fileName} -> ${rootPath}${finalTitles[code]}`)
      } else {
        console.error(`faile to found fullname of ${code}`)
      }
    })
    fs.writeFileSync('./final.json', ']\n', { flag: 'a+' })
    // initFn();
  } catch (e) {
    console.error(e)
  }
}

module.exports = {
  download
}
