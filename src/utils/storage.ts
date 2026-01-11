// app/utils/storage.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';

export interface Note {
  id: string;
  name: string;
  price: string;
  bpp: string;
  color?: string;
  fixedCosts?: { id: string; name: string; amount: number }[];
  variableCosts?: { id: string; name: string; amount: number; quantity: number }[];
  profitMargin?: number;
  estimatedSales?: number;
  discount?: number;
  pph?: number;
  ppn?: number;
  updatedAt: number; // Unix timestamp
}

export const getNotes = async (): Promise<Note[]> => {
  try {
    const jsonValue = await AsyncStorage.getItem('@ngitung_notes');
    return jsonValue ? JSON.parse(jsonValue) : [];
  } catch (e) {
    console.error('Gagal load notes:', e);
    return [];
  }
};

export const saveNote = async (note: Note) => {
  try {
    const notes = await getNotes();
    const newNotes = [...notes, note];
    await AsyncStorage.setItem('@ngitung_notes', JSON.stringify(newNotes));
  } catch (e) {
    console.error('Gagal simpan note:', e);
  }
};

export const createNote = async (name: string): Promise<Note> => {
  const newNote = {
    id: uuidv4(),
    name,
    price: 'Rp 0',
    bpp: 'Rp 0',
    updatedAt: Date.now(),
  };
  await saveNote(newNote);
  return newNote;
};

export const deleteNote = async (id: string) => {
  try {
    let notes = await getNotes();
    notes = notes.filter(note => note.id !== id);
    await AsyncStorage.setItem('@ngitung_notes', JSON.stringify(notes));
  } catch (e) {
    console.error('Gagal hapus note:', e);
  }
};

export const updateNote = async (updatedNote: Note) => {
  try {
    let notes = await getNotes();
    const index = notes.findIndex(note => note.id === updatedNote.id);
    if (index !== -1) {
      notes[index] = { ...updatedNote, updatedAt: Date.now() };
      await AsyncStorage.setItem('@ngitung_notes', JSON.stringify(notes));
    }
  } catch (e) {
    console.error('Gagal update note:', e);
  }
};