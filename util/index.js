const fs = require('fs')
const path = require('path')

const {
  specialCharsMap,
  normalMusicSuffixes,
  normalCompressedFileSuffixes
} = require('../constant')

const _dbPath = path.resolve(__dirname, '../db.json');

try {
  fs.accessSync(_dbPath, fs.constants.F_OK)
} catch (err) {
  fs.writeFileSync(_dbPath, '{}', { encoding: 'utf8' });
}

const dbJson = require(_dbPath);

const getProxyConfig = (
  protocol = 'http',
  host = '127.0.0.1',
  port = 7890
) => ({
  protocol,
  host,
  port
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
  fs.writeFileSync(_dbPath, JSON.stringify(dbJson, null, 2))
}

const renameFiles = ({ rjCodes, rjCodeToFileNameMap, rootPath }) => {
  console.log('======= rename start ========')
  rjCodes.forEach((code) => {
    const resultName = dbJson[code]
    if (resultName) {
      const fileNameList = rjCodeToFileNameMap[code]
      if (!fileNameList) {
        console.log(`failed to found file name of ${code}`)
        return
      }
      fileNameList.forEach((fileName) => {
        const filePath = path.resolve(rootPath, fileName)
        const fileStatus = fs.statSync(filePath)
        const fileSuffix = fileName.substr(fileName.lastIndexOf('.') + 1) || ''

        let finalName = ''

        const is7zMultiPartArchive = /\.7z.\d{3}$/.test(fileName);

        if (fileStatus.isDirectory()) {
          finalName = resultName
        } else if (
          normalMusicSuffixes.includes(fileSuffix) ||
          normalCompressedFileSuffixes.includes(fileSuffix) ||
          // 7z Multi-part archive
          is7zMultiPartArchive
        ) {
          // process Multi-part archive
          const rarMultiArchivePartName = fileName.match(/(?<partName>part\d{2})\./i)?.groups.partName;
          if (rarMultiArchivePartName) {
            finalName = `${resultName}.${rarMultiArchivePartName}.${fileSuffix}`
          } else if (is7zMultiPartArchive) {
            finalName = `${resultName}.7z.${fileSuffix}`
          } else {
            finalName = `${resultName}.${fileSuffix}`
          }
        }
        if (finalName) {
          if (fileName === finalName) {
            console.log(`SKIP: ${fileName}`)
            return;
          }
          console.log(`${fileName} -> ${finalName}`)
          fs.renameSync(
            path.resolve(rootPath, fileName),
            path.resolve(rootPath, finalName)
          )
        }
      });
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
