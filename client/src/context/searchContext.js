'use client';

import { createContext, useContext, useState, useEffect } from 'react';

const SearchContext = createContext({
  searchTerm: '',
  setSearchTerm: (term) => {},
});

export const useSearch = () => useContext(SearchContext);

export function SearchProvider({ children }) {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <SearchContext.Provider value={{ searchTerm, setSearchTerm }}>
      {children}
    </SearchContext.Provider>
  );
}