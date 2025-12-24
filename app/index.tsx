// app/index.tsx
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Button, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useNotes } from '../src/context/NoteContext';

export default function MainPage() {
  const router = useRouter();
  const { notes, addNote } = useNotes();
  const [modalVisible, setModalVisible] = useState(false);
  const [newNoteName, setNewNoteName] = useState('');

  const handleAddNote = () => {
    setModalVisible(true); // Tampilkan modal
    setNewNoteName(''); // Reset input
  };

  const handleSaveNote = () => {
    if (newNoteName.trim()) {
      addNote(newNoteName.trim());
      setModalVisible(false); // Tutup modal
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>NGITUNG</Text>
      <Text style={styles.subtitle}>Catatan Usaha Anda</Text>

      <ScrollView style={styles.notesList}>
        {notes.map((note) => (
          <TouchableOpacity
            key={note.id}
            style={styles.noteCard}
            onPress={() => router.push({
              pathname: '/(tabs)/detail/[id]',
              params: { id: note.id, name: note.name }
            })}
          >
            <Text style={styles.noteName}>{note.name}</Text>
            <Text style={styles.notePrice}>{note.price}</Text>
            <Text style={styles.noteUpdated}>
              {new Date(note.updatedAt).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
              })}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={handleAddNote}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Tambah Catatan Baru</Text>
            <TextInput
              style={styles.input}
              placeholder="Nama usaha..."
              value={newNoteName}
              onChangeText={setNewNoteName}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <Button title="Batal" color="#6c757d" onPress={() => setModalVisible(false)} />
              <Button title="Simpan" color="#0d6efd" onPress={handleSaveNote} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  notesList: {
    flex: 1,
  },
  noteCard: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  noteName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
  },
  notePrice: {
    fontSize: 16,
    color: '#0d6efd',
    marginTop: 6,
  },
  noteUpdated: {
    fontSize: 12,
    color: '#6c757d',
    marginTop: 4,
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#0d6efd',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  fabText: {
    fontSize: 28,
    color: 'white',
    fontWeight: 'bold',
  },
  // Di bagian akhir file (dalam StyleSheet.create)
modalContainer: {
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: 'rgba(0,0,0,0.5)',
},
modalContent: {
  width: '80%',
  backgroundColor: 'white',
  borderRadius: 12,
  padding: 20,
  alignItems: 'center',
},
modalTitle: {
  fontSize: 18,
  fontWeight: 'bold',
  marginBottom: 15,
},
input: {
  width: '100%',
  borderWidth: 1,
  borderColor: '#ddd',
  borderRadius: 8,
  padding: 10,
  marginBottom: 20,
},
modalButtons: {
  flexDirection: 'row',
  gap: 10,
  width: '100%',
},
});