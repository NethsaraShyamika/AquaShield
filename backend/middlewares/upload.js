import multer from "multer";
import path from "path";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import dotenv from "dotenv";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: (req, file) => {
    const isVideo = file.mimetype.startsWith("video/");
    const isPDF = file.mimetype === "application/pdf";

    return {
      folder: "aquashield/evidence",
      resource_type: isVideo ? "video" : isPDF ? "raw" : "image",
      allowed_formats: ["jpeg", "jpg", "png", "gif", "mp4", "mov", "avi", "pdf"],
      public_id: `${Date.now()}-${Math.round(Math.random() * 1e9)}`,
    };
  },
});

const fileFilter = (req, file, cb) => {
  const allowedExtensions = /jpeg|jpg|png|gif|mp4|mov|avi|pdf/;
  const allowedMimes = /image\/(jpeg|jpg|png|gif)|video\/(mp4|quicktime|x-msvideo)|application\/pdf/;

  const ext = allowedExtensions.test(path.extname(file.originalname).toLowerCase());
  const mime = allowedMimes.test(file.mimetype);

  if (ext && mime) cb(null, true);
  else cb(new Error("Only images, videos, and PDFs are allowed"));
};

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter,
});

export default upload;