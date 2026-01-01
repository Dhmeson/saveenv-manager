import { NextRequest } from 'next/server'
import { redirectToLoginClearingSession } from '@/app/utils/redirectToLoginClearingSession'

type SuspicionResult = {
  suspicious: boolean
  reasons: string[]
}

function parseAllowedOrigins(): Set<string> {
  const raw = process.env.ALLOWED_ORIGINS || ''
  return new Set(
    raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  )
}

export function detectSuspiciousRequest(req: NextRequest): SuspicionResult {
  const reasons: string[] = []

  // Toggle via env; default to off
  const guardEnabled = String(process.env.BLOCK_SUSPICIOUS_REQUESTS || '').toLowerCase() === 'true'
  if (!guardEnabled) return { suspicious: false, reasons }

  const userAgent = req.headers.get('user-agent') || ''
  const origin = req.headers.get('origin') || ''
  const referer = req.headers.get('referer') || ''
  const host = req.headers.get('host') || ''
  const secFetchSite = req.headers.get('sec-fetch-site') || ''

  // 1) Very common non-browser clients / scrapers
  const disallowedUaRegex = new RegExp(
    (process.env.DISALLOWED_UA_REGEX || [
      'curl',
      'wget',
      'postman',
      'insomnia',
      'python-requests',
      'httpclient',
      'okhttp',
      'libwww-perl',
      'java',
      'go-http-client',
      'node-fetch',
      'restsharp',
      'undici'
    ].join('|')),
    'i'
  )
  if (!userAgent || disallowedUaRegex.test(userAgent)) {
    reasons.push('disallowed_or_missing_user_agent')
  }

  // 2) Origin/Referer must match allowed origins, when configured
  const allowed = parseAllowedOrigins()
  if (allowed.size > 0) {
    const isAllowed = (val: string) => {
      try {
        if (!val) return false
        const u = new URL(val)
        return allowed.has(u.origin)
      } catch {
        return false
      }
    }
    // Prefer origin; fallback to referer
    if (!(isAllowed(origin) || isAllowed(referer) || allowed.has(`https://${host}`) || allowed.has(`http://${host}`))) {
      reasons.push('origin_not_allowed')
    }
  }

  // 3) Missing site context hints typical of non-browser tools
  if (!secFetchSite) {
    reasons.push('missing_sec_fetch_site')
  }

  return { suspicious: reasons.length > 0, reasons }
}

export function enforceRequestGuardOrRedirect(req: NextRequest) {
  const result = detectSuspiciousRequest(req)
  if (result.suspicious) {
    return redirectToLoginClearingSession(req)
  }
  return null
}


