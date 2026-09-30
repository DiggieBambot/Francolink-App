// Where profile photos live. Shared by the avatar route and account deletion.

export const AVATAR_BUCKET = "assets";
export const AVATAR_FOLDER = "avatars";

/** Storage path of an avatar we host, from its public URL; null for anything else. */
export function avatarStoragePath(url: string | null | undefined): string | null {
  if (!url) return null;
  // public URL looks like: <base>/storage/v1/object/public/assets/avatars/<id>.<ext>
  const marker = `/object/public/${AVATAR_BUCKET}/`;
  const i = url.indexOf(marker);
  if (i < 0) return null;
  return url.slice(i + marker.length);
}
