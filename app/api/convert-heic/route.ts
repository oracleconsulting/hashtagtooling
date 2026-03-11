import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())

    const jpegBuffer = await sharp(buffer)
      .jpeg({ quality: 85 })
      .toBuffer()

    return new NextResponse(new Uint8Array(jpegBuffer), {
      headers: {
        'Content-Type': 'image/jpeg',
        'Content-Length': String(jpegBuffer.length),
      },
    })
  } catch (err) {
    console.error('Server HEIC conversion failed:', err)
    return NextResponse.json(
      { error: 'Conversion failed' },
      { status: 500 }
    )
  }
}
