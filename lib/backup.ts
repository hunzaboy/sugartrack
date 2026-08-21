import * as SQLite from 'expo-sqlite';
import { zip, unzip } from 'react-native-zip-archive';
import { File, Directory, Paths } from 'expo-file-system';
import { closeDatabase, getDatabase, DATABASE_NAME } from './db';
import type { PreparedExport } from './export';

const PHOTOS_DIR_NAME = 'photos';
const BACKUP_DB_ENTRY_NAME = 'sugartrack.db';

function toFsPath(uri: string): string {
  return uri.startsWith('file://') ? uri.slice('file://'.length) : uri;
}

function toFileUri(pathOrUri: string): string {
  return pathOrUri.startsWith('file://') ? pathOrUri : `file://${pathOrUri}`;
}

function freshTempDirectory(name: string): Directory {
  const dir = new Directory(Paths.cache, name);
  if (dir.exists) {
    dir.delete();
  }
  dir.create({ intermediates: true });
  return dir;
}

export async function prepareBackup(): Promise<PreparedExport> {
  await getDatabase();

  const stagingDir = freshTempDirectory('sugartrack-backup-staging');

  const destDb = await SQLite.openDatabaseAsync(BACKUP_DB_ENTRY_NAME, undefined, stagingDir.uri);
  const sourceDb = await getDatabase();
  await SQLite.backupDatabaseAsync({ sourceDatabase: sourceDb, destDatabase: destDb });
  await destDb.closeAsync();

  const photosDir = new Directory(Paths.document, PHOTOS_DIR_NAME);
  const stagedPhotosDir = new Directory(stagingDir, PHOTOS_DIR_NAME);
  if (photosDir.exists) {
    await photosDir.copy(stagedPhotosDir);
  } else {
    stagedPhotosDir.create({ intermediates: true });
  }

  const dateStr = new Date().toISOString().slice(0, 10);
  const filename = `sugartrack-backup-${dateStr}.zip`;
  const zipFile = new File(Paths.cache, filename);
  if (zipFile.exists) zipFile.delete();

  // Zip the staging directory itself (not an array of its contents) so entry
  // paths stay relative to it, preserving the "photos/" subfolder structure.
  await zip(toFsPath(stagingDir.uri), toFsPath(zipFile.uri));

  stagingDir.delete();

  return { file: zipFile, filename, mimeType: 'application/zip' };
}

export async function importBackup(zipUri: string): Promise<void> {
  const extractDir = freshTempDirectory('sugartrack-restore-staging');
  await unzip(toFsPath(zipUri), toFsPath(extractDir.uri));

  const extractedDb = new File(extractDir, BACKUP_DB_ENTRY_NAME);
  const extractedPhotos = new Directory(extractDir, PHOTOS_DIR_NAME);
  if (!extractedDb.exists) {
    extractDir.delete();
    throw new Error('This backup file does not contain a valid SugarTrack database.');
  }

  await closeDatabase();

  const dbDestination = new File(toFileUri(SQLite.defaultDatabaseDirectory), DATABASE_NAME);
  if (dbDestination.exists) dbDestination.delete();
  dbDestination.parentDirectory.create({ intermediates: true, idempotent: true });
  await extractedDb.copy(dbDestination);

  const photosDestination = new Directory(Paths.document, PHOTOS_DIR_NAME);
  if (photosDestination.exists) photosDestination.delete();
  if (extractedPhotos.exists) {
    await extractedPhotos.copy(photosDestination);
  }

  extractDir.delete();

  await getDatabase();
}
