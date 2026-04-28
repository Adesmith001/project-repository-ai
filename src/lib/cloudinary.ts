import { appEnv, isCloudinaryConfigured } from './env'

export interface CloudinaryUploadResult {
  secureUrl: string
  publicId: string
}

export async function uploadPdfToCloudinary(
  file: File,
  onProgress?: (progress: number) => void,
): Promise<CloudinaryUploadResult> {
  if (file.type !== 'application/pdf') {
    throw new Error('Only PDF files are supported.')
  }

  if (!isCloudinaryConfigured) {
    throw new Error('Cloudinary configuration is missing. Check your .env values.')
  }

  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', appEnv.cloudinaryUploadPreset)
  formData.append('folder', 'project-repository-ai')

  const endpoint = `https://api.cloudinary.com/v1_1/${appEnv.cloudinaryCloudName}/image/upload`

  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest()
    request.open('POST', endpoint)

    request.upload.addEventListener('progress', (event) => {
      if (!event.lengthComputable || !onProgress) {
        return
      }

      onProgress(Math.round((event.loaded / event.total) * 100))
    })

    request.addEventListener('load', () => {
      if (request.status < 200 || request.status >= 300) {
        try {
          const errorPayload = JSON.parse(request.responseText) as {
            error?: { message?: string }
          }
          const message = errorPayload.error?.message?.trim()
          reject(new Error(message || 'Cloudinary upload failed. Confirm your unsigned preset settings.'))
        } catch {
          reject(new Error('Cloudinary upload failed. Confirm your unsigned preset settings.'))
        }
        return
      }

      try {
        const payload = JSON.parse(request.responseText) as {
          secure_url: string
          public_id: string
        }

        resolve({
          secureUrl: payload.secure_url,
          publicId: payload.public_id,
        })
      } catch {
        reject(new Error('Unexpected Cloudinary response.'))
      }
    })

    request.addEventListener('error', () => {
      reject(new Error('Unable to connect to Cloudinary.'))
    })

    request.send(formData)
  })
}
