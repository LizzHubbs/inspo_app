export interface StoredFile {
  key: string;
  url: string;
}

// Every upload path (photos, art) depends on this interface, not on any
// specific storage implementation. Swapping local disk for S3 later means
// writing one new class and changing one import in localStorage.ts's export —
// nothing in modules/ has to change.
export interface StorageAdapter {
  save(buffer: Buffer, originalName: string, mimeType: string): Promise<StoredFile>;
}
