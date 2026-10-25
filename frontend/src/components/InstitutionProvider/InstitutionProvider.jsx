import useResource from '../../hooks/useResource';
import { InstitutionContext } from '../../context/InstitutionContext';
import { configuration } from '../../services/campusService';

export default function InstitutionProvider({ children }) {
  const state = useResource(configuration);
  return <InstitutionContext.Provider value={{ ...state, config:state.data?.configuracion }}>
    {children}
  </InstitutionContext.Provider>;
}
