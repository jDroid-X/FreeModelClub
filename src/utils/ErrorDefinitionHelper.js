/**
 * ErrorDefinitionHelper.js
 * Purpose: Master Error Code Dictionary with Definition Text, Root Causes, and Actionable Guidance Cards.
 */

class ErrorDefinitionHelper {
  static getDictionary() {
    return {
      'ERR_HTTP_401': {
        code: 'ERR_HTTP_401',
        title: 'HTTP 401 Unauthorized (Invalid API Key)',
        definition: 'Upstream AI provider rejected the authorization token or API key header.',
        guidance: 'Verify your API key in the provider\'s Key Portal, ensure no leading/trailing spaces, and paste the valid key in the API Key field.',
        actionBadge: 'Check Key Portal',
        color: 'var(--accent-rose)'
      },
      'ERR_HTTP_403': {
        code: 'ERR_HTTP_403',
        title: 'HTTP 403 Forbidden (Access / Region Restricted)',
        definition: 'Access denied due to plan tier constraints, geographical restrictions, or insufficient key permissions.',
        guidance: 'Check your API key permissions, enable required models in your provider dashboard, or check IP/region restrictions.',
        actionBadge: 'Permissions Check',
        color: 'var(--accent-amber)'
      },
      'ERR_HTTP_404': {
        code: 'ERR_HTTP_404',
        title: 'HTTP 404 Not Found (Invalid Endpoint URL Path)',
        definition: 'Target API endpoint URL path does not exist on the provider gateway.',
        guidance: 'Verify your Base API URL format (e.g., https://api.groq.com/openai/v1 or https://integrate.api.nvidia.com/v1). Ensure no trailing slashes or typos.',
        actionBadge: 'Verify Base URL',
        color: 'var(--accent-rose)'
      },
      'ERR_HTTP_429': {
        code: 'ERR_HTTP_429',
        title: 'HTTP 429 Rate Limit Exceeded (Quota Limits)',
        definition: 'Exceeded free tier Requests Per Minute (RPM) or daily quota (RPD).',
        guidance: 'Wait 60 seconds for quota reset, or create a Model Combo pool with fallback models for zero-downtime routing.',
        actionBadge: 'Quota Exceeded',
        color: 'var(--accent-amber)'
      },
      'ERR_HTTP_500': {
        code: 'ERR_HTTP_500',
        title: 'HTTP 500 Internal Server Error (Upstream Outage)',
        definition: 'Upstream cloud AI provider experienced an unexpected internal server crash.',
        guidance: 'Upstream cloud platform is degraded; wait a few moments or select an alternate free model from the Model Club pyramid.',
        actionBadge: 'Upstream Degraded',
        color: 'var(--accent-rose)'
      },
      'ERR_HTTP_502': {
        code: 'ERR_HTTP_502',
        title: 'HTTP 502 Bad Gateway (Proxy Routing Failure)',
        definition: 'Upstream AI proxy gateway or load balancer received an invalid upstream payload.',
        guidance: 'Upstream provider gateway failure; re-test ping in a few seconds.',
        actionBadge: 'Bad Gateway',
        color: 'var(--accent-rose)'
      },
      'ERR_HTTP_503': {
        code: 'ERR_HTTP_503',
        title: 'HTTP 503 Service Unavailable (Model Overloaded)',
        definition: 'Upstream model server is currently overloaded or undergoing scheduled maintenance.',
        guidance: 'Model server overloaded; switch to a fallback free model or test again shortly.',
        actionBadge: 'Overloaded',
        color: 'var(--accent-amber)'
      },
      'ERR_CONN_REFUSED': {
        code: 'ERR_CONN_REFUSED',
        title: 'Connection Refused (Local Server Daemon Offline)',
        definition: 'Target host actively refused TCP socket connection on the requested port.',
        guidance: 'Ensure your local daemon is running (e.g. run "ollama serve" in terminal for Ollama local API at http://localhost:11434).',
        actionBadge: 'Launch Daemon',
        color: 'var(--accent-rose)'
      },
      'ERR_DNS_NOT_FOUND': {
        code: 'ERR_DNS_NOT_FOUND',
        title: 'DNS Lookup Failed (Domain Host Unreachable)',
        definition: 'Could not resolve domain hostname to an IP address.',
        guidance: 'Check your internet connection, DNS server configuration, or domain spelling in the Base API URL field.',
        actionBadge: 'Check DNS / Internet',
        color: 'var(--accent-rose)'
      },
      'ERR_TIMEOUT': {
        code: 'ERR_TIMEOUT',
        title: 'Connection Timeout (6000ms Limit Exceeded)',
        definition: 'Target API endpoint took longer than 6000ms to complete TCP/TLS handshake.',
        guidance: 'Upstream API server is slow or unresponsive; check network stability or test again shortly.',
        actionBadge: 'Network Timeout',
        color: 'var(--accent-amber)'
      },
      'ERR_DUPLICATE_URL': {
        code: 'ERR_DUPLICATE_URL',
        title: 'Duplicate Base URL Registration Guard',
        definition: 'Another provider is already registered with this exact Base API URL.',
        guidance: 'Edit the existing provider\'s API key in Providers View instead of registering a duplicate Base URL.',
        actionBadge: 'Duplicate Guard',
        color: 'var(--accent-cyan)'
      },
      'ERR_UNKNOWN': {
        code: 'ERR_UNKNOWN',
        title: 'Connection Test Encountered Error',
        definition: 'An unexpected connection error occurred during verification.',
        guidance: 'Check API credentials, Base URL, and network connection.',
        actionBadge: 'Check Setup',
        color: 'var(--accent-amber)'
      }
    };
  }

  static getByStatusCode(statusCode, rawErrorStr = '') {
    const dict = this.getDictionary();
    const errUpper = String(rawErrorStr).toUpperCase();

    if (errUpper.includes('ECONNREFUSED') || errUpper.includes('11434')) return dict['ERR_CONN_REFUSED'];
    if (errUpper.includes('ENOTFOUND') || errUpper.includes('DNS')) return dict['ERR_DNS_NOT_FOUND'];
    if (errUpper.includes('ETIMEDOUT') || errUpper.includes('TIMEOUT')) return dict['ERR_TIMEOUT'];
    if (errUpper.includes('DUPLICATE') || errUpper.includes('ALREADY REGISTERED')) return dict['ERR_DUPLICATE_URL'];

    if (statusCode === 401) return dict['ERR_HTTP_401'];
    if (statusCode === 403) return dict['ERR_HTTP_403'];
    if (statusCode === 404) return dict['ERR_HTTP_404'];
    if (statusCode === 429) return dict['ERR_HTTP_429'];
    if (statusCode === 500) return dict['ERR_HTTP_500'];
    if (statusCode === 502) return dict['ERR_HTTP_502'];
    if (statusCode === 503) return dict['ERR_HTTP_503'];

    const fallback = { ...dict['ERR_UNKNOWN'] };
    if (statusCode) fallback.title = `HTTP ${statusCode} Error`;
    if (rawErrorStr) fallback.definition = rawErrorStr;
    return fallback;
  }

  static renderErrorCardHtml(errInfo) {
    const info = typeof errInfo === 'string' ? this.getByStatusCode(null, errInfo) : (errInfo.code ? errInfo : this.getByStatusCode(errInfo.statusCode, errInfo.error || errInfo.message));
    const color = info.color || 'var(--accent-rose)';

    return `
      <div class="glass-panel" style="border: 1px solid ${color}; background: rgba(15, 23, 42, 0.95); padding: 12px; border-radius: 8px; margin-top: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.4);">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px; flex-wrap: wrap; gap: 6px;">
          <strong style="color: ${color}; font-size: 0.88rem; display: flex; align-items: center; gap: 6px;">
            <i class="fa-solid fa-triangle-exclamation"></i> ${info.code}: ${info.title}
          </strong>
          <span class="badge" style="font-size: 0.68rem; padding: 2px 8px; background: rgba(225,29,72,0.15); border: 1px solid ${color}; color: ${color};">
            <i class="fa-solid fa-shield-cat"></i> ${info.actionBadge || 'Error'}
          </span>
        </div>
        
        <div style="font-size: 0.8rem; color: #f8fafc; margin-bottom: 8px; line-height: 1.4;">
          <strong style="color: var(--accent-cyan);">Definition:</strong> ${info.definition}
        </div>

        <div style="background: rgba(0,0,0,0.3); padding: 8px 10px; border-radius: 6px; border: 1px solid var(--border-glow); font-size: 0.78rem; color: var(--accent-amber); line-height: 1.4;">
          <i class="fa-solid fa-lightbulb" style="margin-right: 4px;"></i> <strong>Guidance Action:</strong> ${info.guidance}
        </div>
      </div>
    `;
  }
}

module.exports = ErrorDefinitionHelper;
