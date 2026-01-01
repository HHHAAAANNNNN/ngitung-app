// app/(tabs)/detail/[id].tsx
import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeOutUp, SlideInRight, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useNotes } from '../../../src/context/NoteContext';

export default function DetailPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { notes, updateNote } = useNotes();
  const router = useRouter();
  
  // Dark theme
  const theme = {
    colors: {
      primary: '#A78BFA',
      secondary: '#34D399',
      accent: '#F472B6',
      background: '#0F0A1F',
      surface: 'rgba(255, 255, 255, 0.1)',
      surfaceDark: 'rgba(30, 27, 75, 0.6)',
      text: '#F9FAFB',
      textSecondary: '#9CA3AF',
      border: 'rgba(255, 255, 255, 0.2)',
      error: '#EF4444',
      success: '#10B981',
    }
  };
  
  const note = notes.find(n => n.id === id);
  if (!note) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={64} color={theme.colors.error} />
          <Text style={[styles.errorTitle, { color: theme.colors.text }]}>Catatan Tidak Ditemukan</Text>
          <TouchableOpacity 
            onPress={() => router.back()}
            style={[styles.backButtonError, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
          >
            <MaterialIcons name="arrow-back" size={20} color={theme.colors.primary} />
            <Text style={[styles.backLinkText, { color: theme.colors.primary }]}>Kembali ke Daftar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // State untuk form
  const [fixedCosts, setFixedCosts] = useState<{ id: string; name: string; amount: number | null }[]>(note.fixedCosts || []);
  const [variableCosts, setVariableCosts] = useState<{ id: string; name: string; amount: number | null; quantity: number | null }[]>(note.variableCosts || []);
  const [profitMargin, setProfitMargin] = useState(note.profitMargin?.toString() || '');
  const [estimatedSales, setEstimatedSales] = useState(note.estimatedSales?.toString() || '');
  const [bpp, setBpp] = useState(0);
  const [sellingPrice, setSellingPrice] = useState(0);
  const [totalFixedCost, setTotalFixedCost] = useState(0);
  const [hasChanges, setHasChanges] = useState(false);
  const [showNotification, setShowNotification] = useState(false);

  // Generate ID unik untuk item
  const generateId = () => Math.random().toString(36).substr(2, 9);

  // Tambahkan biaya tetap
  const addFixedCost = () => {
    setFixedCosts([...fixedCosts, { id: generateId(), name: '', amount: null }]);
  };

  // Tambahkan biaya variabel
  const addVariableCost = () => {
    setVariableCosts([...variableCosts, { id: generateId(), name: '', amount: null, quantity: null }]);
  };

  // Hapus biaya tetap
  const removeFixedCost = (id: string) => {
    setFixedCosts(fixedCosts.filter(cost => cost.id !== id));
  };

  // Hapus biaya variabel
  const removeVariableCost = (id: string) => {
    setVariableCosts(variableCosts.filter(cost => cost.id !== id));
  };

  // Hitung BPP dan harga jual
  const calculate = () => {
    // Hitung total biaya tetap per bulan
    const totalFixed = fixedCosts.reduce((sum, cost) => sum + (cost.amount ?? 0), 0);
    setTotalFixedCost(totalFixed);
    // Hitung total biaya variabel per unit
    const totalVariableCost = variableCosts.reduce((sum, cost) => {
      const amount = cost.amount ?? 0;
      const quantity = cost.quantity ?? 0;
      return sum + (amount * quantity);
    }, 0);
    // Hitung BPP
    const bppValue = totalVariableCost + (estimatedSales ? (totalFixed / Number(estimatedSales)) : 0);
    setBpp(bppValue);
    // Hitung harga jual dengan margin keuntungan
    const profit = profitMargin ? Number(profitMargin) / 100 : 0.3;
    const sellingPriceValue = bppValue * (1 + profit);
    setSellingPrice(sellingPriceValue);
  };

  // Simpan perhitungan ke database
  const saveCalculation = async () => {
    if (!profitMargin || !estimatedSales) {
      return;
    }
    if (sellingPrice <= 0) {
      return;
    }
    try {
      const updatedNote = {
        ...note,
        price: `Rp ${Math.round(sellingPrice).toLocaleString('id-ID')}`,
        bpp: `Rp ${Math.round(bpp).toLocaleString('id-ID')}`,
        fixedCosts: fixedCosts.map(c => ({ ...c, amount: c.amount || 0 })),
        variableCosts: variableCosts.map(c => ({ ...c, amount: c.amount || 0, quantity: c.quantity || 0 })),
        profitMargin: Number(profitMargin),
        estimatedSales: Number(estimatedSales),
      };
      await updateNote(updatedNote);
      setHasChanges(false);
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
    } catch (error) {
      console.error('Save error:', error);
    }
  };

  // Track changes
  useEffect(() => {
    const hasData = fixedCosts.length > 0 || variableCosts.length > 0;
    const hasParams = profitMargin && estimatedSales;
    setHasChanges(hasData && !!hasParams);
  }, [fixedCosts, variableCosts, profitMargin, estimatedSales]);

  // Hitung otomatis saat ada perubahan input
  useEffect(() => {
    calculate();
  }, [fixedCosts, variableCosts, profitMargin, estimatedSales]);

  // Notification Toast Component
  const NotificationToast = () => {
    const progress = useSharedValue(100);

    useEffect(() => {
      if (showNotification) {
        progress.value = 100;
        progress.value = withTiming(0, { duration: 3000 });
      }
    }, [showNotification]);

    const progressStyle = useAnimatedStyle(() => ({
      width: `${progress.value}%`,
    }));

    if (!showNotification) return null;

    return (
      <Animated.View
        entering={FadeInDown.duration(300)}
        exiting={FadeOutUp.duration(300)}
        style={[styles.notificationToast, { backgroundColor: 'rgba(16, 185, 129, 0.95)' }]}
      >
        <View style={styles.notificationContent}>
          <MaterialIcons name="check-circle" size={24} color="white" />
          <View style={styles.notificationTextContainer}>
            <Text style={styles.notificationTitle}>Berhasil Disimpan!</Text>
            <Text style={styles.notificationMessage}>Perhitungan telah tersimpan</Text>
          </View>
        </View>
        <Animated.View style={[styles.progressBar, progressStyle, { backgroundColor: 'rgba(255, 255, 255, 0.3)' }]} />
      </Animated.View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Gradient Decorations */}
      <View style={[styles.gradientCircle1, { backgroundColor: 'rgba(167, 139, 250, 0.1)' }]} />
      <View style={[styles.gradientCircle2, { backgroundColor: 'rgba(244, 114, 182, 0.08)' }]} />
      
      {/* Floating Back Button */}
      <TouchableOpacity 
        onPress={() => router.back()}
        style={[styles.floatingBackButton, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
      >
        <MaterialIcons name="arrow-back" size={24} color={theme.colors.text} />
      </TouchableOpacity>
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View entering={FadeIn.duration(400)} style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={[styles.title, { color: theme.colors.text }]}>{note.name}</Text>
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>Input data biaya untuk perhitungan akurat</Text>
          </View>
        </Animated.View>

        {/* Biaya Tetap */}
        <Animated.View entering={SlideInRight.delay(100).duration(300)} style={[styles.section, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="calendar-today" size={24} color={theme.colors.primary} />
            <View style={styles.sectionHeaderText}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Biaya Tetap</Text>
              <Text style={[styles.helperText, { color: theme.colors.textSecondary }]}>Per bulan (sewa, listrik, gaji)</Text>
            </View>
          </View>
          
          {fixedCosts.map((item, index) => (
            <View key={item.id} style={styles.costItemCard}>
              <View style={styles.costItemHeader}>
                <View style={[styles.inputContainer, styles.nameInputFull, { backgroundColor: 'rgba(0,0,0,0.2)', borderColor: theme.colors.border }]}>
                  <MaterialIcons name="label-outline" size={18} color={theme.colors.textSecondary} />
                  <TextInput
                    style={[styles.input, { color: theme.colors.text }]}
                    value={item.name}
                    onChangeText={text => {
                      const newCosts = [...fixedCosts];
                      newCosts[index].name = text;
                      setFixedCosts(newCosts);
                    }}
                    placeholder="Nama biaya"
                    placeholderTextColor={theme.colors.textSecondary}
                    keyboardAppearance="dark"
                  />
                </View>
                <TouchableOpacity 
                  onPress={() => removeFixedCost(item.id)} 
                  style={[styles.deleteButton, { backgroundColor: 'rgba(239, 68, 68, 0.15)', borderColor: theme.colors.error }]}
                >
                  <MaterialIcons name="delete-outline" size={20} color={theme.colors.error} />
                </TouchableOpacity>
              </View>
              <View style={[styles.inputContainer, { backgroundColor: 'rgba(0,0,0,0.2)', borderColor: theme.colors.border }]}>
                <Text style={[styles.currency, { color: theme.colors.textSecondary }]}>Rp</Text>
                <TextInput
                  style={[styles.input, { color: theme.colors.text }]}
                  value={item.amount !== null && item.amount !== undefined ? item.amount.toString() : ''}
                  onChangeText={text => {
                    const newCosts = [...fixedCosts];
                    newCosts[index].amount = text ? Number(text) : 0;
                    setFixedCosts(newCosts);
                  }}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={theme.colors.textSecondary}
                  keyboardAppearance="dark"
                />
              </View>
            </View>
          ))}
          
          <TouchableOpacity 
            onPress={addFixedCost} 
            style={[styles.addButton, { borderColor: theme.colors.primary }]}
          >
            <MaterialIcons name="add" size={20} color={theme.colors.primary} />
            <Text style={[styles.addButtonText, { color: theme.colors.primary }]}>Tambah Biaya Tetap</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Biaya Variabel */}
        <Animated.View entering={SlideInRight.delay(200).duration(300)} style={[styles.section, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="shopping-cart" size={24} color={theme.colors.secondary} />
            <View style={styles.sectionHeaderText}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Biaya Variabel</Text>
              <Text style={[styles.helperText, { color: theme.colors.textSecondary }]}>Per unit (bahan baku, kemasan)</Text>
            </View>
          </View>
          
          {variableCosts.map((item, index) => (
            <View key={item.id} style={styles.costItemCard}>
              <View style={styles.costItemHeader}>
                <View style={[styles.inputContainer, styles.nameInputFull, { backgroundColor: 'rgba(0,0,0,0.2)', borderColor: theme.colors.border }]}>
                  <MaterialIcons name="inventory" size={18} color={theme.colors.textSecondary} />
                  <TextInput
                    style={[styles.input, { color: theme.colors.text }]}
                    value={item.name}
                    onChangeText={text => {
                      const newCosts = [...variableCosts];
                      newCosts[index].name = text;
                      setVariableCosts(newCosts);
                    }}
                    placeholder="Nama bahan"
                    placeholderTextColor={theme.colors.textSecondary}
                    keyboardAppearance="dark"
                  />
                </View>
                <TouchableOpacity 
                  onPress={() => removeVariableCost(item.id)} 
                  style={[styles.deleteButton, { backgroundColor: 'rgba(239, 68, 68, 0.15)', borderColor: theme.colors.error }]}
                >
                  <MaterialIcons name="delete-outline" size={20} color={theme.colors.error} />
                </TouchableOpacity>
              </View>
              <View style={styles.variableInputRow}>
                <View style={[styles.inputContainer, styles.variableInputItem, { backgroundColor: 'rgba(0,0,0,0.2)', borderColor: theme.colors.border }]}>
                  <Text style={[styles.currency, { color: theme.colors.textSecondary, fontSize: 12 }]}>Rp</Text>
                  <TextInput
                    style={[styles.input, { color: theme.colors.text, fontSize: 14 }]}
                    value={item.amount !== null && item.amount !== undefined ? item.amount.toString() : ''}
                    onChangeText={text => {
                      const newCosts = [...variableCosts];
                      newCosts[index].amount = text ? Number(text) : 0;
                      setVariableCosts(newCosts);
                    }}
                    keyboardType="numeric"
                    placeholder="Harga"
                    placeholderTextColor={theme.colors.textSecondary}
                    keyboardAppearance="dark"
                  />
                </View>
                <View style={[styles.inputContainer, styles.variableInputItem, { backgroundColor: 'rgba(0,0,0,0.2)', borderColor: theme.colors.border }]}>
                  <MaterialIcons name="format-list-numbered" size={14} color={theme.colors.textSecondary} />
                  <TextInput
                    style={[styles.input, { color: theme.colors.text, fontSize: 14 }]}
                    value={item.quantity !== null && item.quantity !== undefined ? item.quantity.toString() : ''}
                    onChangeText={text => {
                      const newCosts = [...variableCosts];
                      newCosts[index].quantity = text ? Number(text) : 1;
                      setVariableCosts(newCosts);
                    }}
                    keyboardType="numeric"
                    placeholder="Qty"
                    placeholderTextColor={theme.colors.textSecondary}
                    keyboardAppearance="dark"
                  />
                </View>
              </View>
            </View>
          ))}
          
          <TouchableOpacity 
            onPress={addVariableCost} 
            style={[styles.addButton, { borderColor: theme.colors.secondary }]}
          >
            <MaterialIcons name="add" size={20} color={theme.colors.secondary} />
            <Text style={[styles.addButtonText, { color: theme.colors.secondary }]}>Tambah Biaya Variabel</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Parameter Perhitungan */}
        <Animated.View entering={SlideInRight.delay(300).duration(300)} style={[styles.section, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="calculate" size={24} color={theme.colors.accent} />
            <View style={styles.sectionHeaderText}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Parameter Perhitungan</Text>
            </View>
          </View>
          
          <View style={styles.parameterRow}>
            <Text style={[styles.parameterLabel, { color: theme.colors.textSecondary }]}>Margin Keuntungan</Text>
            <View style={[styles.inputContainer, styles.parameterInput, { backgroundColor: 'rgba(0,0,0,0.2)', borderColor: theme.colors.border }]}>
              <TextInput
                style={[styles.input, { color: theme.colors.text, textAlign: 'right' }]}
                value={profitMargin}
                onChangeText={setProfitMargin}
                keyboardType="numeric"
                placeholder="30"
                placeholderTextColor={theme.colors.textSecondary}
                keyboardAppearance="dark"
              />
              <Text style={[styles.unit, { color: theme.colors.primary }]}>%</Text>
            </View>
          </View>
          
          <View style={styles.parameterRow}>
            <Text style={[styles.parameterLabel, { color: theme.colors.textSecondary }]}>Estimasi Penjualan</Text>
            <View style={[styles.inputContainer, styles.parameterInput, { backgroundColor: 'rgba(0,0,0,0.2)', borderColor: theme.colors.border }]}>
              <TextInput
                style={[styles.input, { color: theme.colors.text, textAlign: 'right' }]}
                value={estimatedSales}
                onChangeText={setEstimatedSales}
                keyboardType="numeric"
                placeholder="100"
                placeholderTextColor={theme.colors.textSecondary}
                keyboardAppearance="dark"
              />
              <Text style={[styles.unit, { color: theme.colors.secondary }]}>unit/bln</Text>
            </View>
          </View>
        </Animated.View>

        {/* Hasil Perhitungan */}
        <Animated.View entering={SlideInRight.delay(400).duration(300)} style={[styles.resultCard, { backgroundColor: theme.colors.surfaceDark, borderColor: theme.colors.primary }]}>
          <View style={styles.resultHeader}>
            <MaterialIcons name="assessment" size={28} color={theme.colors.primary} />
            <Text style={[styles.resultTitle, { color: theme.colors.text }]}>Hasil Perhitungan</Text>
          </View>
          
          <View style={styles.resultDivider} />
          
          <View style={styles.resultRow}>
            <View style={styles.resultLabelContainer}>
              <MaterialIcons name="attach-money" size={20} color={theme.colors.secondary} />
              <Text style={[styles.resultLabel, { color: theme.colors.textSecondary }]}>BPP per Unit</Text>
            </View>
            <Text style={[styles.resultValue, { color: theme.colors.secondary }]}>
              {bpp > 0 ? `Rp ${Math.round(bpp).toLocaleString('id-ID')}` : '-'}
            </Text>
          </View>
          
          <View style={styles.resultRow}>
            <View style={styles.resultLabelContainer}>
              <MaterialIcons name="sell" size={20} color={theme.colors.primary} />
              <Text style={[styles.resultLabel, { color: theme.colors.textSecondary }]}>Harga Jual</Text>
            </View>
            <Text style={[styles.resultValue, { color: theme.colors.primary, fontSize: 24 }]}>
              {sellingPrice > 0 ? `Rp ${Math.round(sellingPrice).toLocaleString('id-ID')}` : '-'}
            </Text>
          </View>
          
          <View style={styles.resultRow}>
            <View style={styles.resultLabelContainer}>
              <MaterialIcons name="trending-up" size={20} color={theme.colors.accent} />
              <Text style={[styles.resultLabel, { color: theme.colors.textSecondary }]}>Break-even Point</Text>
            </View>
            <Text style={[styles.resultValue, { color: theme.colors.accent }]}>
              {estimatedSales && bpp && sellingPrice ? 
                `${Math.round((totalFixedCost) / (sellingPrice - bpp))} unit` : '-'}
            </Text>
          </View>
        </Animated.View>

        {/* Tombol Simpan */}
        <TouchableOpacity 
          onPress={saveCalculation}
          style={[
            styles.saveButton, 
            { 
              backgroundColor: hasChanges ? theme.colors.primary : theme.colors.surface,
              opacity: hasChanges ? 1 : 0.5,
            }
          ]}
          activeOpacity={0.8}
          disabled={!hasChanges}
        >
          <MaterialIcons name="save" size={24} color="white" />
          <Text style={styles.saveButtonText}>
            {hasChanges ? 'Simpan Perhitungan' : 'Tidak Ada Perubahan'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
      
      <NotificationToast />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientCircle1: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
  },
  gradientCircle2: {
    position: 'absolute',
    bottom: -150,
    left: -100,
    width: 350,
    height: 350,
    borderRadius: 175,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
    paddingTop: Platform.OS === 'android' ? 20 : 10,
  },
  floatingBackButton: {
    position: 'absolute',
    bottom: 80,
    left: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  headerContent: {
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    fontWeight: '500',
  },
  section: {
    marginBottom: 20,
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
    backdropFilter: 'blur(10px)',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionHeaderText: {
    marginLeft: 12,
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  },
  helperText: {
    fontSize: 12,
    fontWeight: '500',
  },
  costItemCard: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    borderRadius: 12,
  },
  costItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  nameInputFull: {
    flex: 1,
  },
  deleteButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  variableInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  variableInputItem: {
    flex: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 8,
    padding: 0,
  },
  currency: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 4,
  },
  addButton: {
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 8,
  },
  parameterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  parameterLabel: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  parameterInput: {
    flex: 1,
    maxWidth: 140,
  },
  unit: {
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 8,
  },
  resultCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 2,
    backdropFilter: 'blur(10px)',
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginLeft: 12,
  },
  resultDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 16,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  resultLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  resultLabel: {
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 8,
  },
  resultValue: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    marginTop: 8,
    shadowColor: '#A78BFA',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 17,
    fontWeight: '700',
    marginLeft: 10,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  backButtonError: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 16,
    borderWidth: 1,
  },
  backLinkText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  notificationToast: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 50 : 60,
    left: 20,
    right: 20,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  notificationTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  notificationTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  notificationMessage: {
    color: 'white',
    fontSize: 13,
    opacity: 0.9,
  },
  progressBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    height: 3,
  },
});