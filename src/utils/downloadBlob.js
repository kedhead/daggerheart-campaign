// Trigger a browser download for a Blob or a remote URL.
//
// Two details matter and are easy to get wrong:
//  · The anchor must be in the document. A detached <a> doesn't fire its click
//    in every browser.
//  · The object URL must be revoked LATE. Revoking immediately after click()
//    races the download in Firefox and Safari and can produce a 0-byte file.

const REVOKE_DELAY_MS = 4000;

/** Turn a display name into a safe filename stem. */
export function slugify(name, fallback = 'download') {
  const slug = String(name || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || fallback;
}

export function downloadBlob(blob, filename) {
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = objectUrl;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(objectUrl), REVOKE_DELAY_MS);
}

/** Fetch a URL and save the response under `filename`. */
export async function downloadUrlAs(url, filename) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Download failed (${response.status})`);
  downloadBlob(await response.blob(), filename);
}
