import { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Generic Firestore collection subscription hook.
 *
 * @param {string|null} basePath  - e.g. 'campaigns/abc123'
 * @param {string}      name      - sub-collection name, e.g. 'characters'
 * @param {object}      options
 * @param {function}    [options.queryFn]  - receives the CollectionRef, returns a Query
 * @param {boolean}     [options.waitFor]  - if false, subscription is skipped (default: true)
 * @returns {Array} live array of { id, ...data } objects
 */
export function useCollection(basePath, name, { queryFn, waitFor = true } = {}) {
  const [data, setData] = useState([]);

  useEffect(() => {
    if (!basePath || !waitFor) return;

    const ref = queryFn
      ? queryFn(collection(db, `${basePath}/${name}`))
      : collection(db, `${basePath}/${name}`);

    return onSnapshot(
      ref,
      (snap) => setData(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
      (err) => {
        console.warn(`[${name}] subscription error:`, err.code);
        setData([]);
      }
    );
  }, [basePath, waitFor]); // eslint-disable-line react-hooks/exhaustive-deps

  return data;
}
