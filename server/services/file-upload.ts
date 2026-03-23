import multer from "multer";
import path from "path";
import { randomUUID } from "crypto";
import fs from "fs/promises";

const UPLOAD_DIR = path.resolve("uploads");
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
  "text/csv",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

// Ensure upload directory exists
async function ensureUploadDir() {
  try {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
  } catch {
    // Directory may already exist
  }
}

const storage = multer.diskStorage({
  destination: async (_req, _file, cb) => {
    await ensureUploadDir();
    cb(null, UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = `${randomUUID()}${ext}`;
    cb(null, name);
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} not allowed`));
    }
  },
});

export interface UploadedFile {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  url: string;
}

export function fileToUploadedFile(
  file: Express.Multer.File,
): UploadedFile {
  return {
    id: randomUUID(),
    filename: file.filename,
    originalName: file.originalname,
    mimeType: file.mimetype,
    sizeBytes: file.size,
    url: `/uploads/${file.filename}`,
  };
}

export async function deleteUploadedFile(filename: string): Promise<void> {
  const filePath = path.join(UPLOAD_DIR, filename);
  try {
    await fs.unlink(filePath);
  } catch {
    // File may not exist
  }
}
