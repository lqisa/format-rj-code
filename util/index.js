const fs = require('fs')
const path = require('path')

const {
  specialCharsMap,
  normalMusicSuffixes,
  normalCompressedFileSuffixes
} = require('../constant')
const dbJson = require('../db/code2NameMap.json')

const getProxyConfig = (
  protocol = 'http',
  host = '127.0.0.1',
  port = 7890
) => ({
  proxy: {
    protocol,
    host,
    port
  }
})

const getDLSiteLink = (code) =>
  `https://www.dlsite.com/maniax/work/=/product_id/${code}.html`

const parseName = (name) => {
  let curName = name
  Object.keys(specialCharsMap).forEach((c) => {
    curName = curName.replaceAll(c, specialCharsMap[c])
  })
  return curName
}

const updateDB = (newMap) => {
  const keys = Object.keys(newMap)
  if (!keys.length) return
  keys.forEach((code) => {
    dbJson[code] = newMap[code]
  })
  fs.writeFileSync('./db/code2NameMap.json', JSON.stringify(dbJson, null, 2))
}

const renameFiles = ({ rjCodes, rjCodeToFileNameMap, rootPath }) => {
  console.log('======= rename start ========')
  rjCodes.forEach((code) => {
    const resultName = dbJson[code]
    if (resultName) {
      const fileName = rjCodeToFileNameMap[code]
      if (!fileName) {
        console.log(`failed to found file name of ${code}`)
        return
      }
      const filePath = path.resolve(rootPath, fileName)
      const fileStatus = fs.statSync(filePath)
      const fileSuffix = fileName.substr(fileName.lastIndexOf('.') - 1) || ''

      let finalName = ''

      if (fileStatus.isDirectory()) {
        finalName = resultName
      } else if (
        normalMusicSuffixes.includes(fileSuffix) ||
        normalCompressedFileSuffixes.includes(fileSuffix)
      ) {
        finalName = `${resultName}.${fileSuffix}`
      }
      if (finalName) {
        console.log(`${rootPath}/${fileName} -> ${rootPath}/${finalName}`)
        fs.renameSync(
          path.resolve(rootPath, fileName),
          path.resolve(rootPath, finalName)
        )
      }
    }
  })
  console.log('======= rename end ========')
}

module.exports = {
  getProxyConfig,
  getDLSiteLink,
  updateDB,
  parseName,
  renameFiles
}
