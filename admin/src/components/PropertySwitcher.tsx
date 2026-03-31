import { useQuery } from '@tanstack/react-query';
import { useState, useEffect, createContext, useContext } from 'react';
import { api } from '../lib/api';
import type { Property } from '@openstr/shared';

const STORAGE_KEY = 'selectedPropertyId';

interface PropertyContextValue {
  propertyId: string | null;
  selectProperty: (id: string) => void;
}

const PropertyContext = createContext<PropertyContextValue>({
  propertyId: null,
  selectProperty: () => {},
});

export function PropertyProvider({ children }: { children: React.ReactNode }) {
  const [propertyId, setPropertyId] = useState<string | null>(
    () => localStorage.getItem(STORAGE_KEY)
  );

  function selectProperty(id: string) {
    localStorage.setItem(STORAGE_KEY, id);
    setPropertyId(id);
  }

  return (
    <PropertyContext.Provider value={{ propertyId, selectProperty }}>
      {children}
    </PropertyContext.Provider>
  );
}

export function useSelectedProperty() {
  return useContext(PropertyContext);
}

export default function PropertySwitcher() {
  const { propertyId, selectProperty } = useSelectedProperty();
  const { data: properties } = useQuery<Property[]>({
    queryKey: ['properties'],
    queryFn: async () => {
      const { data } = await api.get<Property[]>('/properties');
      return data;
    },
  });

  useEffect(() => {
    if (properties && properties.length > 0 && !propertyId) {
      selectProperty(properties[0].id);
    }
  }, [properties, propertyId]);

  if (!properties || properties.length === 0) return null;

  return (
    <select
      value={propertyId ?? ''}
      onChange={(e) => selectProperty(e.target.value)}
      style={{ width: '100%', marginTop: 12, padding: '6px 8px', background: '#334155', color: '#fff', border: '1px solid #475569', borderRadius: 6, fontSize: 13 }}
    >
      {properties.map((p) => (
        <option key={p.id} value={p.id}>{p.name}</option>
      ))}
    </select>
  );
}
