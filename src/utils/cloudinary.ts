import { CONFIG } from '@/constants/config'

export async function uploadImageToCloudinary(uri: string): Promise<string> {
  const formData = new FormData()
  formData.append('file', { uri, type: 'image/jpeg', name: 'upload.jpg' } as any)
  formData.append('upload_preset', CONFIG.CLOUDINARY_UPLOAD_PRESET)

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CONFIG.CLOUDINARY_CLOUD_NAME}/image/upload`,
    { method: 'POST', body: formData }
  )

  if (!res.ok) throw new Error('Upload ảnh thất bại')

  const data = await res.json()
  return data.secure_url as string
}
