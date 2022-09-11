const fs = require('fs')
const path = require('path')

function rename(rootPath) {
  console.log('======= rename start ========')
  const final = JSON.parse(fs.readFileSync('./final.json', 'utf-8'));
  final.forEach(([originalName, newName]) => {
    fs.stat(path.resolve(rootPath, originalName), (e, stat) => {
      if (e) {
        console.log(e)
        return
      }
      // console.log(stat)
      if (stat.isDirectory()) {
        try {
          fs.renameSync(
            path.resolve(rootPath, originalName),
            path.resolve(rootPath, newName)
          )
        } catch (e) {
          console.log('failedToRename: ', e)
        }
      }
    })
  })
  console.log('======= rename end ========')
  fs.unlinkSync('./final.json')
}

module.exports = {
  rename
}

