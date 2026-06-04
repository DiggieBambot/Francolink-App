// Google Drive folder helpers — list Google Docs inside a folder via the
// public Drive API v3. Folder must be set to "Anyone with the link can view"
// so an API key can read it (no OAuth).

export interface DriveDoc {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime?: string;
  /** Path of parent folder names from the root, joined with " / ". */
  folderPath?: string;
}

interface DriveListItem {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime?: string;
}

/** Extract a Drive folder ID from a URL or accept a bare ID. */
export function extractFolderId(input: string): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  // Patterns:
  //   https://drive.google.com/drive/folders/<ID>?...
  //   https://drive.google.com/drive/u/0/folders/<ID>
  //   https://drive.google.com/open?id=<ID>
  const m1 = trimmed.match(/\/folders\/([a-zA-Z0-9_-]{10,})/);
  if (m1) return m1[1];
  const m2 = trimmed.match(/[?&]id=([a-zA-Z0-9_-]{10,})/);
  if (m2) return m2[1];
  if (/^[a-zA-Z0-9_-]{20,}$/.test(trimmed)) return trimmed;
  return null;
}

/** Single-folder, single-page-aware listing of ALL items (docs + sub-folders). */
async function listFolderChildren(folderId: string, apiKey: string): Promise<DriveListItem[]> {
  const out: DriveListItem[] = [];
  const q = encodeURIComponent(`'${folderId}' in parents and trashed = false`);
  let pageToken: string | undefined;
  for (let page = 0; page < 50; page++) {
    const url =
      `https://www.googleapis.com/drive/v3/files` +
      `?q=${q}` +
      `&fields=files(id,name,mimeType,modifiedTime),nextPageToken` +
      `&pageSize=1000` +
      `&supportsAllDrives=true&includeItemsFromAllDrives=true` +
      (pageToken ? `&pageToken=${pageToken}` : ``) +
      `&key=${apiKey}`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Drive API HTTP ${res.status}: ${body.slice(0, 200)}`);
    }
    const data = (await res.json()) as { files?: DriveListItem[]; nextPageToken?: string };
    if (data.files) out.push(...data.files);
    if (!data.nextPageToken) break;
    pageToken = data.nextPageToken;
  }
  return out;
}

/**
 * Recursively list all Google Docs reachable from a folder. Walks sub-folders.
 * Each result carries its folderPath so the import UI can show context.
 */
export async function listFolderDocs(folderId: string, apiKey: string): Promise<DriveDoc[]> {
  const docs: DriveDoc[] = [];
  const visited = new Set<string>();

  async function walk(id: string, pathPrefix: string) {
    if (visited.has(id)) return; // guard against cycles
    visited.add(id);
    const children = await listFolderChildren(id, apiKey);
    for (const c of children) {
      if (c.mimeType === "application/vnd.google-apps.folder") {
        const nextPath = pathPrefix ? `${pathPrefix} / ${c.name}` : c.name;
        await walk(c.id, nextPath);
      } else if (
        c.mimeType === "application/vnd.google-apps.document" ||
        c.mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        c.mimeType === "application/vnd.oasis.opendocument.text"
      ) {
        docs.push({
          id: c.id,
          name: c.name,
          mimeType: c.mimeType,
          modifiedTime: c.modifiedTime,
          folderPath: pathPrefix,
        });
      }
    }
  }

  await walk(folderId, "");
  docs.sort((a, b) => {
    const fp = (a.folderPath || "").localeCompare(b.folderPath || "");
    return fp !== 0 ? fp : a.name.localeCompare(b.name);
  });
  return docs;
}
