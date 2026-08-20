/**
 * KeepAliveAgent.js
 * Purpose: High-performance HTTP and HTTPS Keep-Alive connection pooling
 *          Reduces proxy connection latency by reusing socket connections.
 * Dependencies: http, https
 */

const http = require('http');
const https = require('https');

class KeepAliveAgent {
  constructor() {
    this.httpAgent = new http.Agent({
      keepAlive: true,
      maxSockets: 100,
      maxFreeSockets: 10,
      timeout: 30000
    });

    this.httpsAgent = new https.Agent({
      keepAlive: true,
      maxSockets: 100,
      maxFreeSockets: 10,
      timeout: 30000
    });
  }

  getAgent(urlStr) {
    if (urlStr.startsWith('https:')) {
      return this.httpsAgent;
    }
    return this.httpAgent;
  }
}

module.exports = new KeepAliveAgent();
