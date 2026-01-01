// app/context/NoteContext.tsx
import { createContext, useContext, useEffect, useState } from 'react';
import { createNote, deleteNote, getNotes, Note, updateNote } from '../../src/utils/storage';

export type { Note };

type NoteContextType = {
  notes: Note[];
  addNote: (name: string) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  updateNote: (note: Note) => Promise<void>;
  refreshNotes: () => Promise<void>;
};

const NoteContext = createContext<NoteContextType | null>(null);

export function NoteProvider({ children }: { children: React.ReactNode }) {
  const [notes, setNotes] = useState<Note[]>([]);

  const loadNotes = async () => {
    const loadedNotes = await getNotes();
    setNotes(loadedNotes);
  };

  useEffect(() => {
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

  const updateNoteContext = async (note: Note) => {
    await updateNote(note);
    setNotes(prev => prev.map(n => n.id === note.id ? note : n));
  };

  return (
    <NoteContext.Provider value={{ 
      notes, 
      addNote, 
      deleteNote: deleteNoteContext,
      updateNote: updateNoteContext,
      refreshNotes: loadNotes
    }}>
      {children}
    </NoteContext.Provider>
  );
}

export const useNotes = () => {
  const context = useContext(NoteContext);
  if (!context) throw new Error('useNotes harus dipakai di dalam NoteProvider');
  return context;
};