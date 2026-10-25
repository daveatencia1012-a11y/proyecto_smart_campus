import { useContext } from 'react';
import { InstitutionContext } from '../context/InstitutionContext';
export default function useInstitution() { return useContext(InstitutionContext); }
