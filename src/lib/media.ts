'use client'
// Deixa fotos e vídeos leves antes de subir (cabe no plano grátis do Supabase).

export async function compressImage(file: File, maxSide = 1600, quality = 0.85): Promise<Blob> {
  if (!file.type.startsWith('image/')) return file
  try {
    const bmp = await createImageBitmap(file)
    const scale = Math.min(1, maxSide / Math.max(bmp.width, bmp.height))
    const w = Math.round(bmp.width * scale)
    const h = Math.round(bmp.height * scale)
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    canvas.getContext('2d')!.drawImage(bmp, 0, 0, w, h)
    const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/webp', quality))
    return blob && blob.size < file.size ? blob : file
  } catch {
    return file
  }
}

export function videoDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const v = document.createElement('video')
    v.preload = 'metadata'
    v.onloadedmetadata = () => {
      URL.revokeObjectURL(v.src)
      resolve(v.duration)
    }
    v.onerror = () => resolve(NaN)
    v.src = URL.createObjectURL(file)
  })
}

/**
 * Regrava o vídeo em 720p (~1,5 Mbps, WebM) direto no navegador.
 * Leva o tempo do próprio vídeo. Se o navegador não suportar, devolve o original.
 */
export async function compressVideo(file: File, onProgress?: (p: number) => void, maxSide = 720): Promise<Blob> {
  const canRecord = typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported?.('video/webm')
  if (!canRecord || file.size < 4 * 1024 * 1024) return file
  const video = document.createElement('video')
  video.muted = true
  video.playsInline = true
  video.src = URL.createObjectURL(file)
  await new Promise((r, j) => {
    video.onloadedmetadata = r
    video.onerror = j
  }).catch(() => null)
  if (!video.videoWidth) return file
  const scale = Math.min(1, maxSide / Math.max(video.videoWidth, video.videoHeight))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round((video.videoWidth * scale) / 2) * 2
  canvas.height = Math.round((video.videoHeight * scale) / 2) * 2
  const ctx = canvas.getContext('2d')!
  const stream = canvas.captureStream(30)
  const type = MediaRecorder.isTypeSupported('video/webm;codecs=vp9') ? 'video/webm;codecs=vp9' : 'video/webm'
  const rec = new MediaRecorder(stream, { mimeType: type, videoBitsPerSecond: 1_500_000 })
  const chunks: Blob[] = []
  rec.ondataavailable = (e) => e.data.size && chunks.push(e.data)
  const done = new Promise<void>((r) => (rec.onstop = () => r()))
  let raf = 0
  const draw = () => {
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    onProgress?.(Math.min(0.99, video.currentTime / (video.duration || 1)))
    if (!video.ended) raf = requestAnimationFrame(draw)
  }
  rec.start(500)
  await video.play().catch(() => null)
  draw()
  await new Promise<void>((r) => (video.onended = () => r()))
  cancelAnimationFrame(raf)
  rec.stop()
  await done
  URL.revokeObjectURL(video.src)
  onProgress?.(1)
  const out = new Blob(chunks, { type: 'video/webm' })
  return out.size > 0 && out.size < file.size ? out : file
}
