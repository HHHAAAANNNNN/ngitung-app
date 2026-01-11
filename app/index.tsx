// app/index.tsx
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
  useWindowDimensions
} from 'react-native';
import Animated, { FadeIn, SlideInDown, SlideOutUp } from 'react-native-reanimated';
import { useLanguage } from '../src/context/LanguageContext';
import { Note, useNotes } from '../src/context/NoteContext';

type ColorSchemeName = 'light' | 'dark' | null | undefined;

// ======================
// SUB-COMPONENTS
// ======================

const GradientBackground = ({ children }: { children: React.ReactNode }) => {
  return (
    <View style={styles.background}>
      <View style={styles.gradientTopLeft} />
      <View style={styles.gradientBottomRight} />
      {children}
    </View>
  );
};

// ======================
// MAIN COMPONENT
// ======================

export default function MainPage() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const { language, setLanguage, t } = useLanguage();
  const { notes, addNote, deleteNote, updateNote } = useNotes();
  const [modalVisible, setModalVisible] = useState(false);
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [newNoteName, setNewNoteName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const { width } = useWindowDimensions();

  // Dark mode theme
  const theme = {
    colors: {
      primary: '#A78BFA',
      secondary: '#34D399',
      accent: '#F472B6',
      surface: 'rgba(30, 27, 75, 0.7)',
      background: '#0F0A1F',
      onBackground: '#F3F4F6',
      onSurface: '#E5E7EB',
      outline: '#6B7280',
      text: '#F9FAFB',
      textSecondary: '#9CA3AF',
      glass: 'rgba(255, 255, 255, 0.1)',
      glassBorder: 'rgba(255, 255, 255, 0.2)',
    }
  };

  // Memoized filtered notes for performance
  const filteredNotes = useMemo(() => {
    return notes.filter(note => 
      note.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, notes]);

  // Note color generator
  const getNoteColor = useCallback((index: number, note?: Note): string => {
    if (note?.color) return note.color;
    const colors = [
      '#A78BFA',
      '#34D399',
      '#F472B6',
      '#60A5FA',
      '#FBBF24',
      '#FB923C',
      '#A855F7',
      '#EC4899',
    ];
    return colors[index % colors.length];
  }, [theme]);

  const availableColors = [
    '#A78BFA', '#34D399', '#F472B6', '#60A5FA',
    '#FBBF24', '#FB923C', '#A855F7', '#EC4899',
  ];

  // Handlers
  const handleAddNote = useCallback(() => {
    setModalVisible(true);
    setNewNoteName('');
  }, []);

  const handleSaveNote = useCallback(() => {
    if (newNoteName.trim()) {
      addNote(newNoteName.trim());
      setModalVisible(false);
      setNewNoteName('');
    }
  }, [newNoteName, addNote]);

  const handleCloseModal = useCallback(() => {
    setModalVisible(false);
    setNewNoteName('');
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  const handleNavigateToDetail = useCallback((id: string) => {
    router.push({
      pathname: '/(tabs)/detail/[id]',
      params: { id }
    });
  }, [router]);

  const handleOpenSettings = useCallback((note: Note) => {
    setSelectedNote(note);
    setSettingsModalVisible(true);
  }, []);

  const handleColorChange = useCallback(async (color: string) => {
    if (selectedNote) {
      await updateNote({ ...selectedNote, color });
      setSettingsModalVisible(false);
    }
  }, [selectedNote, updateNote]);

  const handleDeleteNote = useCallback(async () => {
    if (selectedNote) {
      await deleteNote(selectedNote.id);
      setSettingsModalVisible(false);
    }
  }, [selectedNote, deleteNote]);

  const handleViewTutorial = useCallback(async () => {
    // Navigate to onboarding screen
    router.push('/onboarding');
  }, [router]);

  // Empty state component
  const EmptyState = useMemo(() => (
    <Animated.View 
      entering={FadeIn.duration(500)} 
      style={[styles.emptyState, { width }]}
    >
      <MaterialIcons 
        name="calculate" 
        size={64} 
        color={theme.colors.primary} 
        style={styles.emptyIcon} 
      />
      <Text style={[styles.emptyTitle, { color: theme.colors.onBackground }]}>{t.emptyTitle}</Text>
      <Text style={[styles.emptySubtitle, { color: theme.colors.outline }]}>{t.emptySubtitle}</Text>
      <TouchableOpacity 
        style={styles.primaryButton}
        onPress={handleAddNote}
        activeOpacity={0.85}
      >
        <MaterialIcons name="add" size={24} color="white" style={styles.buttonIcon} />
        <Text style={styles.buttonText}>{t.createNoteButton}</Text>
      </TouchableOpacity>
    </Animated.View>
  ), [width, theme, handleAddNote]);

  // ======================
  // RENDERING
  // ======================

  return (
    <GradientBackground>
      <View style={styles.header}>
        {/* Top Right Actions */}
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.helpButton} 
            onPress={handleViewTutorial}
            activeOpacity={0.8}
          >
            <MaterialIcons name="help-outline" size={22} color={theme.colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.languageToggle} 
            onPress={() => setLanguage(language === 'id' ? 'en' : 'id')}
            activeOpacity={0.8}
          >
            <MaterialIcons name="language" size={18} color={theme.colors.primary} />
            <Text style={[styles.languageText, { color: theme.colors.primary }]}>{language.toUpperCase()}</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.title, { color: theme.colors.primary }]}>{t.appTitle}</Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>{t.appSubtitle}</Text>
        
        {/* Search Bar dengan Glass Effect */}
        <View style={[
          styles.searchContainer, 
          { 
            backgroundColor: theme.colors.glass,
            borderColor: theme.colors.glassBorder 
          }
        ]}> 
          <MaterialIcons name="search" size={22} color={theme.colors.primary} />
          <TextInput
            style={[styles.searchInput, { color: theme.colors.text }]}
            placeholder={t.searchPlaceholder}
            placeholderTextColor={theme.colors.outline}
            value={searchQuery}
            onChangeText={setSearchQuery}
            selectionColor={theme.colors.primary}
            autoCapitalize="none"
            autoComplete="off"
            keyboardAppearance="dark"
          />
          {searchQuery ? (
            <TouchableOpacity 
              onPress={handleClearSearch} 
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <MaterialIcons name="close" size={22} color={theme.colors.outline} />
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
          EmptyState
        ) : (
          filteredNotes.map((note, index) => (
            <NoteCard 
              key={note.id}
              note={note}
              index={index}
              color={getNoteColor(index, note)}
              onPress={() => handleNavigateToDetail(note.id)}
              onSettings={() => handleOpenSettings(note)}
              theme={theme}
              t={t}
            />
          ))
        )}
      </ScrollView>

      <Animated.View entering={SlideInDown.delay(300)} style={styles.fabContainer}>
        <TouchableOpacity 
          style={[styles.fab, { backgroundColor: theme.colors.primary }]}
          onPress={handleAddNote}
          activeOpacity={0.85}
          accessibilityLabel="Tambah catatan baru"
          accessibilityRole="button"
        >
          <MaterialIcons name="add" size={32} color="white" />
        </TouchableOpacity>
      </Animated.View>

      <AddNoteModal
        visible={modalVisible}
        onClose={handleCloseModal}
        onSave={handleSaveNote}
        noteName={newNoteName}
        onNoteNameChange={setNewNoteName}
        colorScheme={colorScheme}
        theme={theme}
        t={t}
      />

      <SettingsModal
        visible={settingsModalVisible}
        onClose={() => setSettingsModalVisible(false)}
        note={selectedNote}
        availableColors={availableColors}
        onColorChange={handleColorChange}
        onDelete={handleDeleteNote}
        theme={theme}
        t={t}
      />
    </GradientBackground>
  );
}

// ======================
// SUB-COMPONENTS DEFINITIONS
// ======================

interface NoteCardProps {
  note: Note;
  index: number;
  color: string;
  onPress: () => void;
  onSettings: () => void;
  theme: any;
  t: any;
}

const NoteCard = React.memo(({ note, color, onPress, onSettings, theme, index, t }: NoteCardProps) => {
  // Format relative time for last saved
  const getRelativeTime = (date: Date) => {
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return t.today;
    if (diffInDays === 1) return t.yesterday;
    if (diffInDays < 7) return `${diffInDays} ${t.daysAgo}`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} ${t.weeksAgo}`;
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  };

  return (
    <Animated.View 
      entering={SlideInDown.delay(100 * Math.min(10, index)).duration(300)}
      exiting={SlideOutUp.duration(200)}
      style={styles.cardContainer}
    >
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.9}
        style={styles.cardTouchable}
      >
        <View style={[
          styles.noteCard,
          { 
            backgroundColor: theme.colors.glass,
            borderColor: theme.colors.glassBorder,
          }
        ]}>
          <View style={styles.cardHeader}>
            <View style={[styles.colorBadge, { backgroundColor: color }]} />
            <Text style={[styles.noteName, { color: theme.colors.text }]} numberOfLines={1}>
              {note.name}
            </Text>
            <TouchableOpacity 
              onPress={(e) => {
                e.stopPropagation();
                onSettings();
              }}
              style={styles.settingsButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <MaterialIcons name="more-vert" size={20} color={theme.colors.outline} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.cardContent}>
            <View style={styles.priceRow}>
              <View style={styles.priceItem}>
                <MaterialIcons name="attach-money" size={18} color={theme.colors.primary} />
                <View style={styles.priceInfo}>
                  <Text style={[styles.priceLabel, { color: theme.colors.textSecondary }]}>{t.sellingPrice}</Text>
                  <Text style={[styles.priceValue, { color: theme.colors.text }]}>{note.price || 'Rp 0'}</Text>
                </View>
              </View>
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.priceRow}>
              <View style={styles.priceItem}>
                <MaterialIcons name="receipt" size={18} color={theme.colors.secondary} />
                <View style={styles.priceInfo}>
                  <Text style={[styles.priceLabel, { color: theme.colors.textSecondary }]}>{t.bpp}</Text>
                  <Text style={[styles.priceValue, { color: theme.colors.text }]}>{note.bpp || 'Rp 0'}</Text>
                </View>
              </View>
            </View>
          </View>
          
          <View style={styles.cardFooter}>
            <View style={styles.dateContainer}>
              <MaterialIcons 
                name="save" 
                size={14} 
                color={theme.colors.outline} 
              />
              <Text style={[styles.noteUpdated, { color: theme.colors.textSecondary }]}> 
                {t.saved} {getRelativeTime(new Date(note.updatedAt))}
              </Text>
            </View>
            <View style={[styles.profitBadge, { backgroundColor: 'rgba(52, 211, 153, 0.15)' }]}>
              <MaterialIcons 
                name="trending-up" 
                size={14} 
                color={theme.colors.secondary} 
              />
              <Text style={[styles.profitText, { color: theme.colors.secondary }]}>{t.profit}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});

interface AddNoteModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: () => void;
  noteName: string;
  onNoteNameChange: (text: string) => void;
  colorScheme: ColorSchemeName;
  theme: any;
  t: any;
}

const AddNoteModal = React.memo(({ 
  visible, 
  onClose, 
  onSave, 
  noteName, 
  onNoteNameChange,
  colorScheme,
  theme,
  t
}: AddNoteModalProps) => {
  const [isFocused, setIsFocused] = React.useState(false);
  
  return (
    <Modal 
      visible={visible} 
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <Animated.View 
          entering={SlideInDown.duration(300)}
          style={[
            styles.modalContainer,
            { 
              backgroundColor: '#1A1625',
            }
          ]}>
          {/* Decorative gradient circles */}
          <View style={[styles.modalGradient1, { backgroundColor: 'rgba(167, 139, 250, 0.3)' }]} />
          <View style={[styles.modalGradient2, { backgroundColor: 'rgba(244, 114, 182, 0.2)' }]} />
          
          <View style={styles.modalContent}>
            {/* Header Icon */}
            <View style={[styles.modalIconContainer, { backgroundColor: 'rgba(167, 139, 250, 0.15)' }]}>
              <MaterialIcons name="note-add" size={32} color={theme.colors.primary} />
            </View>
            
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>{t.createNewNote}</Text>
            <Text style={[styles.modalSubtitle, { color: theme.colors.textSecondary }]}>{t.createNewNoteSubtitle}</Text>
            
            {/* Input Container */}
            <View style={styles.inputWrapper}>
              <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>{t.businessName}</Text>
              <View style={[
                styles.inputContainer,
                { 
                  borderColor: isFocused ? theme.colors.primary : 'rgba(255, 255, 255, 0.15)',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                }
              ]}>
                <MaterialIcons 
                  name="business-center" 
                  size={20} 
                  color={isFocused ? theme.colors.primary : theme.colors.outline} 
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[
                    styles.modalInput,
                    { 
                      color: theme.colors.text,
                    }
                  ]}
                  placeholder={t.businessNamePlaceholder}
                  placeholderTextColor={theme.colors.outline}
                  value={noteName}
                  onChangeText={onNoteNameChange}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  autoFocus
                  returnKeyType="done"
                  onSubmitEditing={onSave}
                  selectionColor={theme.colors.primary}
                  autoCapitalize="words"
                  autoComplete="name"
                  keyboardAppearance="dark"
                />
              </View>
            </View>
            
            {/* Action Buttons */}
            <View style={styles.modalActions}>
              <TouchableOpacity 
                onPress={onClose}
                style={[
                  styles.modalButton, 
                  styles.cancelButton,
                  { 
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)' 
                  }
                ]}
                activeOpacity={0.7}
              >
                <Text style={[styles.modalButtonText, { color: theme.colors.text }]}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={onSave}
                style={[
                  styles.modalButton, 
                  styles.saveButton,
                  { 
                    opacity: !noteName.trim() ? 0.5 : 1 
                  }
                ]}
                activeOpacity={0.8}
                disabled={!noteName.trim()}
              >
                <View style={styles.saveButtonGradient} />
                <Text style={[styles.modalButtonText, { color: 'white' }]}>Buat Catatan</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
});

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
  note: Note | null;
  availableColors: string[];
  onColorChange: (color: string) => void;
  onDelete: () => void;
  theme: any;
  t: any;
}

const SettingsModal = React.memo(({
  visible,
  onClose,
  note,
  availableColors,
  onColorChange,
  onDelete,
  theme,
  t
}: SettingsModalProps) => {
  if (!note) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <Animated.View
          entering={SlideInDown.duration(300)}
          style={[
            styles.settingsModalContainer,
            {
              backgroundColor: '#1A1625',
            }
          ]}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.settingsHeader}>
              <MaterialIcons name="settings" size={28} color={theme.colors.primary} />
              <Text style={[styles.settingsTitle, { color: theme.colors.text }]}>{t.settings}</Text>
            </View>
            
            <Text style={[styles.settingsSubtitle, { color: theme.colors.textSecondary }]}>{note.name}</Text>
            
            {/* Color Picker */}
            <View style={styles.colorSection}>
              <Text style={[styles.colorLabel, { color: theme.colors.text }]}>{t.colorBadge}</Text>
              <View style={styles.colorGrid}>
                {availableColors.map((color) => (
                  <TouchableOpacity
                    key={color}
                    onPress={() => onColorChange(color)}
                    style={[
                      styles.colorOption,
                      { 
                        backgroundColor: color,
                        borderColor: color === note.color ? theme.colors.text : 'transparent',
                        borderWidth: color === note.color ? 3 : 0,
                      }
                    ]}
                    activeOpacity={0.7}
                  >
                    {color === note.color && (
                      <MaterialIcons name="check" size={20} color="white" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            {/* Delete Button */}
            <TouchableOpacity
              onPress={onDelete}
              style={[styles.deleteNoteButton, { backgroundColor: 'rgba(239, 68, 68, 0.15)', borderColor: theme.colors.error }]}
              activeOpacity={0.7}
            >
              <MaterialIcons name="delete-outline" size={24} color={theme.colors.error} />
              <Text style={[styles.deleteNoteText, { color: theme.colors.error }]}>{t.deleteNote}</Text>
            </TouchableOpacity>
            
            {/* Close Button */}
            <TouchableOpacity
              onPress={onClose}
              style={[styles.modalButton, styles.cancelButton, { borderColor: 'rgba(255, 255, 255, 0.2)', backgroundColor: 'rgba(255, 255, 255, 0.05)' }]}
              activeOpacity={0.7}
            >
              <Text style={[styles.modalButtonText, { color: theme.colors.text }]}>{t.close}</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
});



// ======================
// STYLES
// ======================

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  background: {
    flex: 1,
    backgroundColor: '#0F0A1F',
  },
  gradientTopLeft: {
    position: 'absolute',
    top: -100,
    left: -100,
    width: 300,
    height: 300,
    backgroundColor: 'rgba(167, 139, 250, 0.15)',
    borderRadius: 200,
  },
  gradientBottomRight: {
    position: 'absolute',
    bottom: -150,
    right: -100,
    width: 350,
    height: 350,
    backgroundColor: 'rgba(244, 114, 182, 0.12)',
    borderRadius: 200,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 40 : 60,
    paddingBottom: 20,
    position: 'relative',
  },
  headerActions: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 45 : 65,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    zIndex: 10,
  },
  helpButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(167, 139, 250, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.3)',
  },
  languageToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(167, 139, 250, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.3)',
  },
  languageText: {
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 6,
  },
  title: {
    fontSize: 36,
    textAlign: 'center',
    marginBottom: 4,
    letterSpacing: -0.5,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
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
    backdropFilter: 'blur(10px)',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    padding: 0,
    marginLeft: 8,
    fontWeight: '500',
    height: 24,
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
  cardTouchable: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  noteCard: {
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 18,
    backdropFilter: 'blur(10px)',
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
    fontSize: 18,
    letterSpacing: -0.3,
    fontWeight: 'bold',
  },
  settingsButton: {
    padding: 4,
  },
  cardContent: {
    marginBottom: 16,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  priceInfo: {
    marginLeft: 10,
  },
  priceLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 2,
  },
  priceValue: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  noteUpdated: {
    fontSize: 12,
    marginLeft: 6,
    fontWeight: '500',
  },
  profitBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
  },
  profitText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  fabContainer: {
    position: 'absolute',
    right: 24,
    bottom: 32,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  fab: {
    width: 68,
    height: 68,
    borderRadius: 34,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#A78BFA',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  modalContainer: {
    marginHorizontal: 20,
    borderRadius: 32,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.4,
    shadowRadius: 30,
    elevation: 20,
  },
  modalGradient1: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 150,
    height: 150,
    borderRadius: 100,
  },
  modalGradient2: {
    position: 'absolute',
    bottom: -60,
    left: -60,
    width: 180,
    height: 180,
    borderRadius: 100,
  },
  modalContent: {
    padding: 28,
    position: 'relative',
    zIndex: 1,
  },
  modalIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  modalSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 20,
    paddingHorizontal: 10,
  },
  inputWrapper: {
    marginBottom: 32,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 10,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 2,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  inputIcon: {
    marginRight: 12,
  },
  modalInput: {
    flex: 1,
    fontSize: 17,
    paddingVertical: 14,
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    position: 'relative',
    overflow: 'hidden',
  },
  cancelButton: {
    borderWidth: 2,
  },
  saveButton: {
    backgroundColor: '#A78BFA',
    shadowColor: '#A78BFA',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  saveButtonGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(244, 114, 182, 0.2)',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
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
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 10,
    fontWeight: 'bold',
  },
  emptySubtitle: {
    fontSize: 15,
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
    backgroundColor: '#A78BFA',
    shadowColor: '#A78BFA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonIcon: {
    marginRight: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  settingsModalContainer: {
    marginHorizontal: 20,
    borderRadius: 32,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.4,
    shadowRadius: 30,
    elevation: 20,
  },
  settingsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  settingsTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  settingsSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 28,
    fontWeight: '600',
  },
  colorSection: {
    marginBottom: 24,
  },
  colorLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorOption: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteNoteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 2,
  },
  deleteNoteText: {
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
});