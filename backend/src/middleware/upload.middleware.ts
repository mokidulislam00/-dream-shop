import multer from "multer";
import { Request, RequestHandler } from "express";

const storage = multer.memoryStorage();

const createUploadError = (message: string): Error & { statusCode: number } => {
  const error = new Error(message) as Error & { statusCode: number };
  error.statusCode = 400;
  return error;
};

const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  callback: multer.FileFilterCallback
): void => {
  const allowedMimeTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
  ];

  if (allowedMimeTypes.includes(file.mimetype.toLowerCase())) {
    callback(null, true);
  } else {
    callback(
      createUploadError(
        "Only JPG, JPEG, PNG and WEBP images are allowed."
      )
    );
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 5,
  },
});

// Detect image content from its binary signature instead of trusting the
// client-provided multipart MIME type alone.
const detectImageMimeType = (buffer: Buffer): string | null => {
  if (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return "image/jpeg";
  }

  const pngSignature = Buffer.from([
    0x89, 0x50, 0x4e, 0x47,
    0x0d, 0x0a, 0x1a, 0x0a,
  ]);

  if (
    buffer.length >= pngSignature.length &&
    buffer.subarray(0, pngSignature.length).equals(pngSignature)
  ) {
    return "image/png";
  }

  if (
    buffer.length >= 12 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "image/webp";
  }

  return null;
};

export const validateImageSignatures: RequestHandler = (
  req,
  _res,
  next
): void => {
  const files = req.files;

  if (!Array.isArray(files) || files.length === 0) {
    next();
    return;
  }

  for (const file of files) {
    const detectedMimeType = detectImageMimeType(file.buffer);
    const declaredMimeType = file.mimetype.toLowerCase();

    const mimeMatches =
      detectedMimeType === declaredMimeType ||
      (detectedMimeType === "image/jpeg" && declaredMimeType === "image/jpg");

    if (!detectedMimeType || !mimeMatches) {
      next(
        createUploadError(
          "Uploaded file content is not a valid JPEG, PNG, or WEBP image."
        )
      );
      return;
    }
  }

  next();
};

export default upload;
