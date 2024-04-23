#!/usr/bin/env node
const [, , rootPath = process.cwd(), proxyPort] = process.argv;

// TODO args support
// const argv = require('argv')
// argv.option([
//   // {
//   //   name: 'protocol',
//   //   short: 'pt',
//   //   type: 'string',
//   //   description: 'proxy protocol'
//   // },
//   // {
//   //   name: 'host',
//   //   short: 'ht',
//   //   type: 'string',
//   //   description: 'proxy host'
//   // },
//   {
//     name: 'port',
//     short: 'p',
//     type: 'int',
//     description: 'proxy port'
//   }
// ])

// const args = argv.run()

console.log("rootPath: ", rootPath);

const { download } = require("./download");

download(rootPath, proxyPort).then((errors) => {
  if (errors) {
    process.stdin.resume();
    // process.stdin.setEncoding('utf8')

    // console.log('Error occurred while downloading: ', errors)

    process.stdin.on("data", function () {
      process.exit();
    });
  }
});
