import { useEffect, useMemo, useRef, useState } from 'react';

// Everything a reel plays, downloaded before it starts.
//
// A reel that streams each clip as its shot begins stalls on every cut when
// the connection is slow: the picture freezes while the next clip buffers.
// So the clips, pictures and voices are fetched whole first and played from
// memory. They are also kept in the browser's cache storage, so the same
// recap played again on that device (a rehearsal, then game night) starts
// at once and needs no connection for its media.

const CACHE_NAME = 'recap-media-v1';
// Old recaps are cleared out once the cache holds more than this many files.
const CACHE_LIMIT = 150;
const AT_ONCE = 4;

const isRemote = (url) => /^https?:\/\//i.test(String(url || ''));

async function openCache() {
  try { return typeof caches !== 'undefined' ? await caches.open(CACHE_NAME) : null; } catch { return null; }
}

/** One file as a Blob: from the cache if it is there, else downloaded (and kept). */
async function fetchBlob(url, cache, signal) {
  const kept = cache ? await cache.match(url).catch(() => null) : null;
  if (kept) return kept.blob();
  const res = await fetch(url, { mode: 'cors', signal });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  // Keeping it is a bonus: a full disk or a private window must not stop the reel.
  if (cache) cache.put(url, res.clone()).catch(() => {});
  return res.blob();
}

/** Drop files that are not part of this reel once the cache has grown past its limit. */
async function prune(cache, keep) {
  try {
    const keys = await cache.keys();
    if (keys.length <= CACHE_LIMIT) return;
    await Promise.all(keys.filter(k => !keep.has(k.url)).map(k => cache.delete(k)));
  } catch { /* housekeeping only */ }
}

/**
 * Download `urls` and hand back in-memory addresses for them.
 *
 * @param {string[]} urls - every clip, picture and sound the reel will play
 * @param {object} [opts]
 * @param {number} [opts.patienceMs] - start anyway after this long, with whatever has arrived
 * @returns {{ ready: boolean, loaded: number, total: number, local: (url: string) => string, start: () => void }}
 *   `local(url)` is the in-memory address once the file has arrived, else the
 *   URL itself (so a file that could not be fetched still streams, as before).
 *   `start()` stops waiting.
 */
export default function useReelMedia(urls, { patienceMs = 90000 } = {}) {
  const list = useMemo(() => [...new Set((urls || []).filter(isRemote))], [urls]);
  const [loaded, setLoaded] = useState(0);
  const [ready, setReady] = useState(list.length === 0);
  const held = useRef(new Map()); // url → blob: address

  useEffect(() => {
    if (!list.length) { setReady(true); return undefined; }
    let live = true;
    const abort = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const made = held.current;
    setLoaded(0);
    setReady(false);
    // A slow link should not hold the table hostage: after a long wait, play with what there is.
    const patience = setTimeout(() => { if (live) setReady(true); }, patienceMs);

    (async () => {
      const cache = await openCache();
      let next = 0;
      const worker = async () => {
        while (live && next < list.length) {
          const url = list[next++];
          try {
            const blob = await fetchBlob(url, cache, abort?.signal);
            if (!live) return;
            made.set(url, URL.createObjectURL(blob));
          } catch { /* this one streams from its URL instead */ }
          if (live) setLoaded(n => n + 1);
        }
      };
      await Promise.all(Array.from({ length: Math.min(AT_ONCE, list.length) }, worker));
      if (!live) return;
      setReady(true);
      if (cache) prune(cache, new Set(list));
    })();

    return () => {
      live = false;
      clearTimeout(patience);
      abort?.abort();
      made.forEach(address => URL.revokeObjectURL(address));
      made.clear();
    };
  }, [list, patienceMs]);

  return {
    ready,
    loaded,
    total: list.length,
    local: (url) => held.current.get(url) || url,
    start: () => setReady(true)
  };
}
