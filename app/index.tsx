// app/index.tsx
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, Dimensions } from 'react-native';
import { useColorScheme } from 'react-native';
import { PaperProvider, Card, Button, Modal, Portal, Text as PaperText, useTheme } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { useNotes } from '../src/context/NoteContext';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutUp } from 'react-native-reanimated';

// Gradient background yang dinamis namun tidak mengganggu
const GradientBackground = ({ children }) => {
  const { colors } = useTheme();
  return (
    <View style={[styles.background, { backgroundColor: colors.background }]}>
      <View style={styles.gradientOverlay} />
      {children}
    </View>
  );
};

export default function MainPage() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const { notes, addNote } = useNotes();
  const [modalVisible, setModalVisible] = useState(false);
  const [newNoteName, setNewNoteName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredNotes, setFilteredNotes] = useState(notes);
  const theme = useTheme();

  useEffect(() => {
    setFilteredNotes(
      notes.filter(note => 
        note.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    );
  }, [searchQuery, notes]);

  const handleAddNote = () => {
    setModalVisible(true);
    setNewNoteName('');
  };

  const handleSaveNote = () => {
    if (newNoteName.trim()) {
      addNote(newNoteName.trim());
      setModalVisible(false);
      setNewNoteName('');
    }
  };

  const getNoteColor = (index) => {
    const colors = [
      theme.colors.primary,
      theme.colors.secondary,
      '#FF6B6B',
      '#4ECDC4',
      '#45B7D1',
      '#96CEB4',
      '#FECA57',
      '#FF9FF3',
    ];
    return colors[index % colors.length];
  };

  const renderEmptyState = () => (
    <Animated.View entering={FadeIn.duration(500)} style={styles.emptyState}>
      <MaterialIcons 
        name="calculate" 
        size={64} 
        color={theme.colors.primary} 
        style={styles.emptyIcon} 
      />
      <Text style={[styles.emptyTitle, { color: theme.colors.onBackground }]}>
        Belum Ada Catatan Perhitungan
      </Text>
      <Text style={[styles.emptySubtitle, { color: theme.colors.onSurfaceVariant }]}>
        Mulai dengan menambahkan catatan usaha baru Anda
      </Text>
      <TouchableOpacity 
        style={[styles.primaryButton, { backgroundColor: theme.colors.primary }]}
        onPress={handleAddNote}
      >
        <MaterialIcons name="add" size={24} color="white" style={styles.buttonIcon} />
        <Text style={styles.buttonText}>Buat Catatan Baru</Text>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <PaperProvider theme={{
      ...theme,
      colors: {
        ...theme.colors,
        primary: '#6C4BFF', // Warna modern untuk primary
        secondary: '#0D9488', // Teal untuk secondary
        surface: colorScheme === 'dark' ? '#1E1B2D' : '#FFFFFF',
        background: colorScheme === 'dark' ? '#12111D' : '#F8FAFF',
      }
    }}>
      <GradientBackground>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.onBackground }]}>NGITUNG</Text>
          <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
            Catatan Usaha Anda
          </Text>
          
          <View style={styles.searchContainer}>
            <MaterialIcons name="search" size={20} color={theme.colors.onSurfaceVariant} />
            <TextInput
              style={[styles.searchInput, { 
                color: theme.colors.onSurface, 
                backgroundColor: colorScheme === 'dark' ? 'rgba(255,255,255,0.1)' : '#FFF',
                borderColor: colorScheme === 'dark' ? 'rgba(255,255,255,0.1)' : '#E2E8F0'
              }]}
              placeholder="Cari usaha..."
              placeholderTextColor={theme.colors.onSurfaceVariant}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <MaterialIcons name="close" size={20} color={theme.colors.onSurfaceVariant} />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        <ScrollView 
          style={styles.notesList} 
          contentContainerStyle={styles.scrollViewContent}
          showsVerticalScrollIndicator={false}
        >
          {filteredNotes.length === 0 ? (
            renderEmptyState()
          ) : (
            <>
              {filteredNotes.map((note, index) => (
                <Animated.View 
                  key={note.id} 
                  entering={SlideInDown.delay(index * 100).duration(300)}
                  exiting={SlideOutUp.duration(200)}
                  style={styles.cardContainer}
                >
                  <TouchableOpacity
                    onPress={() => router.push({
                      pathname: '/(tabs)/detail/[id]',
                      params: { id: note.id }
                    })}
                  >
                    <Card style={[
                      styles.noteCard,
                      { 
                        backgroundColor: colorScheme === 'dark' ? 'rgba(30, 27, 45, 0.7)' : '#FFFFFF',
                        borderColor: getNoteColor(index),
                        shadowColor: getNoteColor(index),
                      }
                    ]}>
                      <View style={styles.cardHeader}>
                        <View style={[
                          styles.colorBadge,
                          { backgroundColor: getNoteColor(index) }
                        ]} />
                        <Text style={styles.noteName}>{note.name}</Text>
                        <TouchableOpacity style={styles.moreButton}>
                          <MaterialIcons 
                            name="more-vert" 
                            size={20} 
                            color={theme.colors.onSurfaceVariant} 
                          />
                        </TouchableOpacity>
                      </View>
                      
                      <View style={styles.cardContent}>
                        <View style={styles.priceContainer}>
                          <Text style={[styles.noteLabel, { color: theme.colors.onSurfaceVariant }]}>
                            Harga Jual:
                          </Text>
                          <Text style={[styles.notePrice, { color: theme.colors.primary }]}>
                            {note.price}
                          </Text>
                        </View>
                        
                        <View style={styles.bppContainer}>
                          <Text style={[styles.noteLabel, { color: theme.colors.onSurfaceVariant }]}>
                            BPP:
                          </Text>
                          <Text style={[styles.noteBpp, { color: theme.colors.secondary }]}>
                            {note.bpp}
                          </Text>
                        </View>
                      </View>
                      
                      <View style={styles.cardFooter}>
                        <View style={styles.dateContainer}>
                          <MaterialIcons 
                            name="update" 
                            size={14} 
                            color={theme.colors.onSurfaceVariant} 
                          />
                          <Text style={[styles.noteUpdated, { color: theme.colors.onSurfaceVariant }]}>
                            {new Date(note.updatedAt).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </Text>
                        </View>
                        <View style={styles.profitBadge}>
                          <MaterialIcons 
                            name="trending-up" 
                            size={12} 
                            color={theme.colors.primary} 
                          />
                          <Text style={[styles.profitText, { color: theme.colors.primary }]}>
                            30%
                          </Text>
                        </View>
                      </View>
                    </Card>
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </>
          )}
        </ScrollView>

        <Animated.View entering={SlideInDown.delay(300)} style={styles.fabContainer}>
          <TouchableOpacity 
            style={[
              styles.fab,
              {
                backgroundColor: theme.colors.primary,
                shadowColor: theme.colors.primary,
              }
            ]} 
            onPress={handleAddNote}
          >
            <MaterialIcons name="add" size={32} color="white" />
          </TouchableOpacity>
        </Animated.View>

        <Portal>
          <Modal 
            visible={modalVisible} 
            onDismiss={() => setModalVisible(false)}
            contentContainerStyle={[
              styles.modalContainer,
              { backgroundColor: theme.colors.surface }
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.onSurface }]}>
                Tambah Catatan Baru
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <MaterialIcons name="close" size={24} color={theme.colors.onSurfaceVariant} />
              </TouchableOpacity>
            </View>
            
            <TextInput
              style={[
                styles.modalInput,
                { 
                  backgroundColor: colorScheme === 'dark' ? 'rgba(255,255,255,0.1)' : '#F8FAFF',
                  color: theme.colors.onSurface,
                  borderColor: colorScheme === 'dark' ? 'rgba(255,255,255,0.1)' : '#E2E8F0'
                }
              ]}
              placeholder="Nama usaha..."
              placeholderTextColor={theme.colors.onSurfaceVariant}
              value={newNoteName}
              onChangeText={setNewNoteName}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleSaveNote}
            />
            
            <Text style={[styles.modalHint, { color: theme.colors.onSurfaceVariant }]}>
              Contoh: Bakso Ayam, Jasa Desain, Toko Online
            </Text>
            
            <View style={styles.modalActions}>
              <Button 
                mode="outlined" 
                onPress={() => setModalVisible(false)}
                textColor={theme.colors.primary}
                style={styles.modalButton}
              >
                Batal
              </Button>
              <Button 
                mode="contained" 
                onPress={handleSaveNote}
                buttonColor={theme.colors.primary}
                textColor="white"
                style={styles.modalButton}
                disabled={!newNoteName.trim()}
              >
                Buat Catatan
              </Button>
            </View>
          </Modal>
        </Portal>
      </GradientBackground>
    </PaperProvider>
  );
}

const { width } = Dimensions.get('window');
const cardWidth = width - 40;

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 120,
    backgroundColor: 'rgba(108, 75, 255, 0.1)',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  notesList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  scrollViewContent: {
    paddingBottom: 90,
  },
  cardContainer: {
    marginBottom: 16,
  },
  noteCard: {
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  colorBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 10,
  },
  noteName: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
  },
  moreButton: {
    padding: 4,
  },
  cardContent: {
    marginBottom: 12,
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  bppContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  noteLabel: {
    fontSize: 14,
  },
  notePrice: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  noteBpp: {
    fontSize: 16,
    fontWeight: '600',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  noteUpdated: {
    fontSize: 12,
    marginLeft: 4,
  },
  profitBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(108, 75, 255, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  profitText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  fabContainer: {
    position: 'absolute',
    right: 24,
    bottom: 32,
  },
  fab: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6C4BFF',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  modalContainer: {
    margin: 20,
    borderRadius: 24,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    marginBottom: 12,
  },
  modalHint: {
    fontSize: 13,
    marginBottom: 24,
    textAlign: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 40,
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    maxWidth: 300,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 16,
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});