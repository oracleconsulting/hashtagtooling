import { NextRequest, NextResponse } from 'next/server'
// @ts-expect-error no type declarations for heic-convert
import convert from 'heic-convert'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const inputBuffer = new Uint8Array(await file.arrayBuffer())

    const outputBuffer = await convert({
      buffer: inputBuffer,
      format: 'JPEG',
      quality: 0.85,
    })

    return new NextResponse(outputBuffer, {
      headers: {
        'Content-Type': 'image/jpeg',
        'Content-Length': String(outputBuffer.byteLength),
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('Server HEIC conversion failed:', message)
    return NextResponse.json(
      { error: 'Conversion failed', detail: message },
      { status: 500 }
    )
  }
}
