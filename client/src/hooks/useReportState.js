import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';

export const useReportState = (defaultFilters) => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Initialize state with values from URL searchParams or defaults
  const [filters, setFilters] = useState(() => {
    const initialFilters = { ...defaultFilters };
    for (const key of Object.keys(defaultFilters)) {
      const val = searchParams.get(key);
      if (val !== null) {
        if (typeof defaultFilters[key] === 'number') {
          initialFilters[key] = parseInt(val, 10);
        } else if (typeof defaultFilters[key] === 'boolean') {
          initialFilters[key] = val === 'true';
        } else {
          initialFilters[key] = val;
        }
      }
    }
    return initialFilters;
  });

  // Track initial render to prevent overriding initial searchParams
  const isFirstRender = useRef(true);

  // Sync state changes back to searchParams using replace to avoid filling history
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const newParams = {};
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== null && value !== '') {
        newParams[key] = String(value);
      }
    }
    setSearchParams(newParams, { replace: true });
  }, [filters, setSearchParams]);

  const setFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const setFiltersObject = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  return [filters, setFilter, setFiltersObject];
};

export default useReportState;
