import { v2 as cloudinary } from "cloudinary"

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
})

export { cloudinary }

interface UploadOptions {
  folder: string
  publicId?: string
}

export async function uploadImage(base64OrUrl: string, { folder, publicId }: UploadOptions) {
  const result = await cloudinary.uploader.upload(base64OrUrl, {
    folder,
    public_id: publicId,
    overwrite: true,
    resource_type: "image",
  })
  return { url: result.secure_url, publicId: result.public_id }
}

export async function deleteImage(publicId: string) {
  await cloudinary.uploader.destroy(publicId)
}
