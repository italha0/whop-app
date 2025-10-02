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
    const expParam = url.searchParams.get('exp')
    let expiryMinutes = 60
    if (expParam) {
      const n = Number(expParam)
      if (Number.isFinite(n)) expiryMinutes = Math.min(1440, Math.max(1, Math.trunc(n)))
    }
    if (!blobName) {
      return NextResponse.json({ error: 'Missing or invalid blobName' }, { status: 400 })
    }

    const downloadUrl = generateSASUrl(blobName, expiryMinutes)
    return NextResponse.json({ downloadUrl, expiresInMinutes: expiryMinutes })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to generate download URL' }, { status: 500 })
  }
}
