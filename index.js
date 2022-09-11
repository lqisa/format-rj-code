#!/usr/bin/env node
const [, , rootPath = process.cwd()] = process.argv;
console.log('rootPath: ', rootPath);

const { download } = require('./download')
const { rename } = require('./rename');

(async () => {
  await download(rootPath)
  console.log('download over~')

  rename(rootPath)
})()
