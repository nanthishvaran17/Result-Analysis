import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/client';
import { StudentDossierDrawer } from '../components/StudentDossierDrawer';
import { CommandPalette } from '../components/CommandPalette';
import type { Student } from '../types';

interface DossierContextType {
  openDossier: (student: Student) => void;
  openDossierByRegNo: (registerNumber: string) => Promise<void>;
  closeDossier: () => void;
  openSearch: () => void;
  closeSearch: () => void;
}

const DossierContext = createContext<DossierContextType | undefined>(undefined);

interface DossierProviderProps {
  children: React.ReactNode;
  onNavigateTab: (tab: string) => void;
}

export const DossierProvider: React.FC<DossierProviderProps> = ({ children, onNavigateTab }) => {
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const openDossier = (student: Student) => {
    setSelectedStudent(student);
  };

  const openDossierByRegNo = async (regNo: string) => {
    try {
      const res = await api.get<{ items: Student[] }>(`/students?search=${encodeURIComponent(regNo)}&limit=1`);
      if (res.items && res.items.length > 0) {
        setSelectedStudent(res.items[0]);
      }
    } catch {
      // ignore
    }
  };

  const closeDossier = () => {
    setSelectedStudent(null);
  };

  const openSearch = () => setIsSearchOpen(true);
  const closeSearch = () => setIsSearchOpen(false);

  return (
    <DossierContext.Provider
      value={{
        openDossier,
        openDossierByRegNo,
        closeDossier,
        openSearch,
        closeSearch,
      }}
    >
      {children}

      {/* Global Spotlight Search Palette */}
      <CommandPalette
        isOpen={isSearchOpen}
        onClose={closeSearch}
        onNavigateTab={onNavigateTab}
        onSelectStudent={openDossier}
      />

      {/* 360-degree Student Academic Dossier Slide-Over */}
      <StudentDossierDrawer
        student={selectedStudent}
        onClose={closeDossier}
      />
    </DossierContext.Provider>
  );
};

export const useDossier = () => {
  const context = useContext(DossierContext);
  if (!context) {
    throw new Error('useDossier must be used within a DossierProvider');
  }
  return context;
};
