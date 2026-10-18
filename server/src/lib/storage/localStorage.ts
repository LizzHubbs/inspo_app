import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { env } from "../../config/env";
import { StorageAdapter, StoredFile } from "./storageAdapter";

export class LocalStorageAdapter implements StorageAdapter {
  async save(buffer: Buffer, originalName: string, mimeType: string): Promise<StoredFile> {
    await fs.mkdir(env.storageDir, { recursive: true });
    const ext = path.extname(originalName) || guessExt(mimeType);
    const key = `${randomUUID()}${ext}`;
    await fs.writeFile(path.join(env.storageDir, key), buffer);
    return { key, url: `/uploads/${key}` };
  }
}

function guessExt(mimeType: string): string {
  if (mimeType === "image/png") return ".png";
  if (mimeType === "image/webp") return ".webp";
  return ".jpg";
}

// Single place the rest of the app imports from. Change this one line to
// point at an S3Adapter later — see storageAdapter.ts for why that's safe.
export const storage: StorageAdapter = new LocalStorageAdapter();
