import { File, Directory, Paths } from 'expo-file-system';

const PHOTOS_DIR_NAME = 'photos';

function getPhotosDirectory(): Directory {
  const dir = new Directory(Paths.document, PHOTOS_DIR_NAME);
  if (!dir.exists) {
    dir.create({ intermediates: true, idempotent: true });
  }
  return dir;
}

export async function savePhotoFromUri(sourceUri: string): Promise<string> {
  const dir = getPhotosDirectory();
  const extMatch = sourceUri.match(/\.(\w+)(?:\?.*)?$/);
  const ext = extMatch ? extMatch[1] : 'jpg';
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const sourceFile = new File(sourceUri);
  const destFile = new File(dir, filename);
  await sourceFile.copy(destFile);
  return destFile.uri;
}

export function deletePhoto(uri: string | null): void {
  if (!uri) return;
  try {
    const file = new File(uri);
    if (file.exists) {
      file.delete();
    }
  } catch {
    // ignore - photo may already be gone
  }
}
