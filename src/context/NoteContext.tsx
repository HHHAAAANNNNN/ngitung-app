// app/context/NoteContext.tsx
import { createContext, useContext, useEffect, useState } from 'react';
import { getNotes, createNote, deleteNote, Note } from '../../src/utils/storage';

type NoteContextType = {
  notes: Note[];
  addNote: (name: string) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
};

const NoteContext = createContext<NoteContextType | null>(null);

export function NoteProvider({ children }: { children: React.ReactNode }) {
  const [notes, setNotes] = useState<Note[]>([]);

  useEffect(() => {
    const loadNotes = async () => {
      const loadedNotes = await getNotes();
      setNotes(loadedNotes);
    };
    loadNotes();
  }, []);

  const addNote = async (name: string) => {
    const newNote = await createNote(name);
    setNotes(prev => [...prev, newNote]);
  };

  const deleteNoteContext = async (id: string) => {
    await deleteNote(id);
    setNotes(prev => prev.filter(note => note.id !== id));
  };

  return (
    <NoteContext.Provider value={{ notes, addNote, deleteNote: deleteNoteContext }}>
      {children}
    </NoteContext.Provider>
  );
}

export const useNotes = () => {
  const context = useContext(NoteContext);
  if (!context) throw new Error('useNotes harus dipakai di dalam NoteProvider');
  return context;
};