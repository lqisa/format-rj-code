const fs = require('fs')
const util = require('util')
const https = require('https')
const SocksProxyAgent = require('socks-proxy-agent')
const url = require('url')
const jsdom = require('jsdom')
const { JSDOM } = jsdom

const readdir = util.promisify(fs.readdir)

const getDLSiteLink = (rjCode) => {
  const proxy = process.env.socks_proxy || 'socks://127.0.0.1:7891'
  const endpoint = `https://www.dlsite.com/maniax/work/=/product_id/${rjCode}.html`
  // const opts = new url.URL(endpoint)
  const opts = url.parse(endpoint)
  // create an instance of the `SocksProxyAgent` class with the proxy server information
  const agent = new SocksProxyAgent(proxy)
  opts.agent = agent
  return opts
}

const opts = getDLSiteLink(curCode)

const arg = process.env.args[2]
