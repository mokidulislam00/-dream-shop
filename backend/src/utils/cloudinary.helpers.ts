
import { Readable } from "stream";

import type { UploadApiResponse } from "cloudinary";
import cloudinary from "../config/cloudinary";

// Upload image buffer to Cloudinary
export const uploadToCloudinary = (
  buffer: Buffer,
  folder = "minimart/products"
): Promise<UploadApiResponse> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }

        if (!result) {
          return reject(
            new Error("Cloudinary image upload failed.")
          );
        }

        resolve(result);
      }
    );

    Readable.from(buffer).pipe(uploadStream);
  });
};

// Delete image from Cloudinary
export const deleteFromCloudinary = async (
  publicId: string
): Promise<void> => {
  const result = await cloudinary.uploader.destroy(publicId);

  if (
    result.result !== "ok" &&
    result.result !== "not found"
  ) {
    throw new Error(
      `Cloudinary image deletion failed: ${result.result}`
    );
  }
};
