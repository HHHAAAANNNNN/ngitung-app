// app/index.tsx
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, Dimensions } from 'react-native';
import { useColorScheme } from 'react-native';
import { PaperProvider, Card, Button, Portal, Text as PaperText, useTheme } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { useNotes } from '../src/context/NoteContext';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutUp } from 'react-native-reanimated';
import { ReactNode } from 'react';
import { Modal } from 'react-native-paper';


// Gradient background yang tidak mengganggu keterbacaan
const GradientBackground = ({ children }: { children: ReactNode }) => {
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

  const getNoteColor = (index: number): string => {
  const colors = [
    '#BB86FC',
    '#03DAC6',
    '#CF6679',
    '#4CAF50',
    '#FF9800',
    '#2196F3',
    '#9C27B0',
    '#E91E63',
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
      <Text style={[styles.emptySubtitle, { color: theme.colors.outline }]}>
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
        primary: '#BB86FC',
        secondary: '#03DAC6',
        surface: colorScheme === 'dark' ? '#2D2B3D' : '#FFFFFF',
        background: colorScheme === 'dark' ? '#12111D' : '#F8FAFF',
        onBackground: colorScheme === 'dark' ? '#E0E0E0' : '#1F1F1F',
        onSurface: colorScheme === 'dark' ? '#E0E0E0' : '#1F1F1F',
        outline: colorScheme === 'dark' ? '#888888' : '#646464',
      }
    }}>
      <GradientBackground>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.onBackground }]}>NGITUNG</Text>
          <Text style={[styles.subtitle, { color: theme.colors.outline }]}>
            Catatan Usaha Anda
          </Text>
          
          <View style={[
            styles.searchContainer,
            { 
              backgroundColor: colorScheme === 'dark' ? 'rgba(45, 43, 61, 0.8)' : '#FFFFFF',
              borderColor: colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : '#E2E8F0'
            }
          ]}>
            <MaterialIcons name="search" size={20} color={theme.colors.outline} />
            <TextInput
              style={[
                styles.searchInput,
                { 
                  color: theme.colors.onSurface,
                  backgroundColor: 'transparent'
                }
              ]}
              placeholder="Cari usaha..."
              placeholderTextColor={theme.colors.outline}
              value={searchQuery}
              onChangeText={setSearchQuery}
              selectionColor={theme.colors.primary}
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <MaterialIcons name="close" size={20} color={theme.colors.outline} />
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
                    activeOpacity={0.95}
                  >
                    <Card style={[
                      styles.noteCard,
                      { 
                        backgroundColor: colorScheme === 'dark' ? 'rgba(45, 43, 61, 0.8)' : '#FFFFFF',
                        borderColor: getNoteColor(index),
                        shadowColor: getNoteColor(index),
                      }
                    ]}>
                      <View style={styles.cardHeader}>
                        <View style={[
                          styles.colorBadge,
                          { backgroundColor: getNoteColor(index) }
                        ]} />
                        <Text style={[styles.noteName, { color: theme.colors.onSurface }]} numberOfLines={1}>
                          {note.name}
                        </Text>
                        <TouchableOpacity style={styles.moreButton} disabled>
                          <MaterialIcons 
                            name="more-vert" 
                            size={24} 
                            color={theme.colors.outline} 
                          />
                        </TouchableOpacity>
                      </View>
                      
                      <View style={styles.cardContent}>
                        <View style={styles.priceContainer}>
                          <Text style={[styles.noteLabel, { color: theme.colors.outline }]}>
                            Harga Jual:
                          </Text>
                          <Text style={[styles.notePrice, { color: '#BB86FC' }]}>
                            {note.price || 'Rp 0'}
                          </Text>
                        </View>
                        
                        <View style={styles.bppContainer}>
                          <Text style={[styles.noteLabel, { color: theme.colors.outline }]}>
                            BPP:
                          </Text>
                          <Text style={[styles.noteBpp, { color: '#03DAC6' }]}>
                            {note.bpp || 'Rp 0'}
                          </Text>
                        </View>
                      </View>
                      
                      <View style={styles.cardFooter}>
                        <View style={styles.dateContainer}>
                          <MaterialIcons 
                            name="update" 
                            size={16} 
                            color={theme.colors.outline} 
                          />
                          <Text style={[styles.noteUpdated, { color: theme.colors.outline }]}>
                            {new Date(note.updatedAt).toLocaleDateString('id-ID', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </Text>
                        </View>
                        <View style={styles.profitBadge}>
                          <MaterialIcons 
                            name="trending-up" 
                            size={14} 
                            color="#BB86FC" 
                          />
                          <Text style={[styles.profitText, { color: '#BB86FC' }]}>
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
            activeOpacity={0.85}
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
              { 
                backgroundColor: colorScheme === 'dark' ? '#2D2B3D' : '#FFFFFF',
                borderColor: colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : '#E2E8F0'
              }
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.onSurface }]}>
                Tambah Catatan Baru
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <MaterialIcons name="close" size={28} color={theme.colors.outline} />
              </TouchableOpacity>
            </View>
            
            <TextInput
              style={[
                styles.modalInput,
                { 
                  backgroundColor: colorScheme === 'dark' ? 'rgba(45, 43, 61, 0.8)' : '#F8FAFF',
                  color: theme.colors.onSurface,
                  borderColor: colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : '#E2E8F0'
                }
              ]}
              placeholder="Nama usaha..."
              placeholderTextColor={theme.colors.outline}
              value={newNoteName}
              onChangeText={setNewNoteName}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleSaveNote}
              selectionColor={theme.colors.primary}
            />
            
            <Text style={[styles.modalHint, { color: theme.colors.outline }]}>
              Contoh: Bakso Ayam, Jasa Desain, Toko Online
            </Text>
            
            <View style={styles.modalActions}>
              <Button 
                mode="outlined" 
                onPress={() => setModalVisible(false)}
                textColor={theme.colors.primary}
                style={styles.modalButton}
                labelStyle={{ fontSize: 16 }}
                contentStyle={{ height: 50 }}
              >
                Batal
              </Button>
              <Button 
                mode="contained" 
                onPress={handleSaveNote}
                buttonColor={theme.colors.primary}
                textColor="white"
                style={styles.modalButton}
                labelStyle={{ fontSize: 16 }}
                contentStyle={{ height: 50 }}
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
    backgroundColor: 'rgba(187, 134, 252, 0.1)',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 17,
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: '500',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    marginBottom: 24,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    padding: 0,
    marginLeft: 8,
    fontWeight: '500',
  },
  notesList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  scrollViewContent: {
    paddingBottom: 100,
  },
  cardContainer: {
    marginBottom: 18,
  },
  noteCard: {
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  colorBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 12,
  },
  noteName: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  moreButton: {
    padding: 4,
  },
  cardContent: {
    marginBottom: 16,
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  bppContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    paddingTop: 12,
  },
  noteLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  notePrice: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
    textAlign: 'right',
    textShadowColor: 'rgba(187, 134, 252, 0.3)',
    textShadowRadius: 1,
  },
  noteBpp: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.4,
    textAlign: 'right',
    textShadowColor: 'rgba(3, 218, 198, 0.3)',
    textShadowRadius: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  noteUpdated: {
    fontSize: 15,
    marginLeft: 6,
    fontWeight: '500',
  },
  profitBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(187, 134, 252, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
  },
  profitText: {
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 4,
  },
  fabContainer: {
    position: 'absolute',
    right: 24,
    bottom: 32,
  },
  fab: {
    width: 68,
    height: 68,
    borderRadius: 34,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  modalContainer: {
    margin: 20,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 18,
    fontSize: 18,
    marginBottom: 16,
    fontWeight: '600',
  },
  modalHint: {
    fontSize: 15,
    marginBottom: 28,
    textAlign: 'center',
    lineHeight: 22,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 16,
  },
  modalButton: {
    flex: 1,
    borderRadius: 14,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 40,
  },
  emptyIcon: {
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: 17,
    textAlign: 'center',
    marginBottom: 36,
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 26,
    borderRadius: 16,
  },
  buttonIcon: {
    marginRight: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
});