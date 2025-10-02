import { NextRequest, NextResponse } from 'next/server'
import { generateSASUrl } from '@/lib/azure-blob'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function validateBlobName(input: unknown): string | null {
  if (typeof input !== 'string') return null
  const name = input.trim()
  if (!name || name.includes('..')) return null
  return name
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const blobName = validateBlobName(url.searchParams.get('blobName'))
    const filename = (url.searchParams.get('filename') || 'chat-video.mp4').replace(/[^A-Za-z0-9_.-]/g, '')
    const expParam = url.searchParams.get('exp')
    let expiryMinutes = 60
    if (expParam) {
      const n = Number(expParam)
      if (Number.isFinite(n)) expiryMinutes = Math.min(1440, Math.max(1, Math.trunc(n)))
    }
    if (!blobName) {
      return NextResponse.json({ error: 'Missing or invalid blobName' }, { status: 400, headers: { 'Cache-Control': 'no-store' } })
    }

    const sas = generateSASUrl(blobName, expiryMinutes)
    const azureResp = await fetch(sas, { cache: 'no-store' })
    if (!azureResp.ok || !azureResp.body) {
      const txt = await azureResp.text().catch(() => '')
      return NextResponse.json({ error: 'Blob fetch failed', status: azureResp.status, details: txt.slice(0, 200) }, { status: 502, headers: { 'Cache-Control': 'no-store' } })
    }

    const headers = new Headers()
    headers.set('Content-Type', azureResp.headers.get('content-type') || 'video/mp4')
    const len = azureResp.headers.get('content-length')
    if (len) headers.set('Content-Length', len)
    headers.set('Cache-Control', 'no-store')
    headers.set('Content-Disposition', `attachment; filename="${filename}"`)

    return new Response(azureResp.body, { status: 200, headers })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Download failed' }, { status: 500, headers: { 'Cache-Control': 'no-store' } })
  }
}
