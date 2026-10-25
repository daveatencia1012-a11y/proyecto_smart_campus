import { useEffect, useReducer, useState } from 'react';
import useSession from './useSession';

export default function useResource(loader) {
  const { user, role } = useSession();
  const owner = `${user?.id}:${role}`;
  const [revision, reload] = useReducer(value => value + 1, 0);
  const [result, setResult] = useState({ source:null, owner:null, revision:-1, data:null, error:'' });
  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const data = await loader();
        if (active) setResult({ source:loader, owner, revision, data, error:'' });
      } catch (error) {
        if (active && !error.cancelled) setResult({ source:loader, owner, revision, data:null, error:error.message || 'No fue posible cargar la información.' });
      }
    }
    load();
    return () => { active = false; };
  }, [loader, owner, revision]);
  const current = result.source === loader && result.owner === owner && result.revision === revision;
  return { data:current ? result.data : null, error:current ? result.error : '', loading:!current, reload };
}
