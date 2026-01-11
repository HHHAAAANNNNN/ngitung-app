import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeOutUp, SlideInDown, SlideInRight, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useNotes } from '../../../src/context/NoteContext';
import { useTheme } from '../../../src/context/ThemeContext';
import { formatCurrency, formatCurrencyInput, parseCurrency } from '../../../src/utils/currency';

export default function DetailPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { notes, updateNote } = useNotes();
  const router = useRouter();
  const { colors: theme } = useTheme();
  const note = notes.find(n => n.id === id);
  if (!note) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={64} color={theme.error} />
          <Text style={[styles.errorTitle, { color: theme.text }]}>Catatan Tidak Ditemukan</Text>
          <TouchableOpacity 
            onPress={() => router.back()}
            style={[styles.backButtonError, { backgroundColor: theme.surface, borderColor: theme.border }]}
          >
            <MaterialIcons name="arrow-back" size={20} color={theme.primary} />
            <Text style={[styles.backLinkText, { color: theme.primary }]}>Kembali ke Daftar</Text>
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
  const [discount, setDiscount] = useState(note.discount?.toString() || '0');
  const [pph, setPph] = useState(note.pph?.toString() || '0');
  const [ppn, setPpn] = useState(note.ppn?.toString() || '0');
  const [bpp, setBpp] = useState(0);
  const [sellingPrice, setSellingPrice] = useState(0);
  const [sellingPriceAfterDiscount, setSellingPriceAfterDiscount] = useState(0);
  const [sellingPriceAfterTax, setSellingPriceAfterTax] = useState(0);
  const [totalFixedCost, setTotalFixedCost] = useState(0);
  const [hasChanges, setHasChanges] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  
  // Modal states
  const [showFixedCostModal, setShowFixedCostModal] = useState(false);
  const [showVariableCostModal, setShowVariableCostModal] = useState(false);
  const [tempFixedCostName, setTempFixedCostName] = useState('');
  const [tempFixedCostAmount, setTempFixedCostAmount] = useState('');
  const [tempVariableCostName, setTempVariableCostName] = useState('');
  const [tempVariableCostAmount, setTempVariableCostAmount] = useState('');
  const [tempVariableCostQuantity, setTempVariableCostQuantity] = useState('');

  // Generate ID unik untuk item
  const generateId = () => Math.random().toString(36).substr(2, 9);

  // Tambahkan biaya tetap
  const addFixedCost = () => {
    setTempFixedCostName('');
    setTempFixedCostAmount('');
    setShowFixedCostModal(true);
  };
  
  const saveFixedCost = () => {
    if (tempFixedCostName.trim() && tempFixedCostAmount) {
      setFixedCosts([...fixedCosts, { 
        id: generateId(), 
        name: tempFixedCostName.trim(), 
        amount: parseCurrency(tempFixedCostAmount) 
      }]);
      setShowFixedCostModal(false);
      setTempFixedCostName('');
      setTempFixedCostAmount('');
    }
  };

  // Tambahkan biaya variabel
  const addVariableCost = () => {
    setTempVariableCostName('');
    setTempVariableCostAmount('');
    setTempVariableCostQuantity('');
    setShowVariableCostModal(true);
  };
  
  const saveVariableCost = () => {
    if (tempVariableCostName.trim() && tempVariableCostAmount && tempVariableCostQuantity) {
      setVariableCosts([...variableCosts, { 
        id: generateId(), 
        name: tempVariableCostName.trim(), 
        amount: parseCurrency(tempVariableCostAmount),
        quantity: Number(tempVariableCostQuantity)
      }]);
      setShowVariableCostModal(false);
      setTempVariableCostName('');
      setTempVariableCostAmount('');
      setTempVariableCostQuantity('');
    }
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
    
    // Hitung harga setelah diskon
    const discountPercent = discount ? Number(discount) / 100 : 0;
    const priceAfterDiscount = sellingPriceValue * (1 - discountPercent);
    setSellingPriceAfterDiscount(priceAfterDiscount);
    
    // Hitung harga setelah pajak
    const pphPercent = pph ? Number(pph) / 100 : 0;
    const ppnPercent = ppn ? Number(ppn) / 100 : 0;
    const priceAfterTax = priceAfterDiscount * (1 + pphPercent + ppnPercent);
    setSellingPriceAfterTax(priceAfterTax);
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
        price: `Rp ${Math.round(sellingPriceAfterTax || sellingPrice).toLocaleString('id-ID')}`,
        bpp: `Rp ${Math.round(bpp).toLocaleString('id-ID')}`,
        fixedCosts: fixedCosts.map(c => ({ ...c, amount: c.amount || 0 })),
        variableCosts: variableCosts.map(c => ({ ...c, amount: c.amount || 0, quantity: c.quantity || 0 })),
        profitMargin: Number(profitMargin),
        estimatedSales: Number(estimatedSales),
        discount: Number(discount) || 0,
        pph: Number(pph) || 0,
        ppn: Number(ppn) || 0,
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
  }, [fixedCosts, variableCosts, profitMargin, estimatedSales, discount, pph, ppn]);

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
    <View style={[styles.container, { backgroundColor: theme.background }]}>
        {/* Gradient Decorations */}
        <View style={[styles.gradientCircle1, { backgroundColor: 'rgba(167, 139, 250, 0.1)' }]} />
        <View style={[styles.gradientCircle2, { backgroundColor: 'rgba(244, 114, 182, 0.08)' }]} />
        
        {/* Floating Back Button */}
        <TouchableOpacity 
          onPress={() => router.back()}
          style={[styles.floatingBackButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
        >
          <MaterialIcons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View entering={FadeIn.duration(400)} style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={[styles.title, { color: theme.text }]}>{note.name}</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Input data biaya untuk perhitungan akurat</Text>
          </View>
        </Animated.View>

        {/* Biaya Tetap */}
        <Animated.View entering={SlideInRight.delay(100).duration(300)} style={[styles.section, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="calendar-today" size={24} color={theme.primary} />
            <View style={styles.sectionHeaderText}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Biaya Tetap</Text>
              <Text style={[styles.helperText, { color: theme.textSecondary }]}>Per bulan (sewa, listrik, gaji)</Text>
            </View>
          </View>
          
          {fixedCosts.map((item, index) => (
            <View key={item.id} style={styles.costItemCard}>
              <View style={styles.costItemHeader}>
                <View style={[styles.inputContainer, styles.nameInputFull, { backgroundColor: 'rgba(0,0,0,0.2)', borderColor: theme.border }]}>
                  <MaterialIcons name="label-outline" size={18} color={theme.textSecondary} />
                  <TextInput
                    style={[styles.input, { color: theme.text }]}
                    value={item.name}
                    onChangeText={text => {
                      const newCosts = [...fixedCosts];
                      newCosts[index].name = text;
                      setFixedCosts(newCosts);
                    }}
                    placeholder="Nama biaya"
                    placeholderTextColor={theme.textSecondary}
                    keyboardAppearance="dark"
                  />
                </View>
                <TouchableOpacity 
                  onPress={() => removeFixedCost(item.id)} 
                  style={[styles.deleteButton, { backgroundColor: 'rgba(239, 68, 68, 0.15)', borderColor: theme.error }]}
                >
                  <MaterialIcons name="delete-outline" size={20} color={theme.error} />
                </TouchableOpacity>
              </View>
              <View style={[styles.inputContainer, { backgroundColor: 'rgba(0,0,0,0.2)', borderColor: theme.border }]}>
                <Text style={[styles.currency, { color: theme.textSecondary }]}>Rp</Text>
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  value={item.amount !== null && item.amount !== undefined ? formatCurrency(item.amount) : ''}
                  onChangeText={text => {
                    const formatted = formatCurrencyInput(text);
                    const newCosts = [...fixedCosts];
                    newCosts[index].amount = parseCurrency(formatted);
                    setFixedCosts(newCosts);
                  }}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={theme.textSecondary}
                  keyboardAppearance="dark"
                />
              </View>
            </View>
          ))}
          
          <TouchableOpacity 
            onPress={addFixedCost} 
            style={[styles.addButton, { borderColor: theme.primary }]}
          >
            <MaterialIcons name="add" size={20} color={theme.primary} />
            <Text style={[styles.addButtonText, { color: theme.primary }]}>Tambah Biaya Tetap</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Biaya Variabel */}
        <Animated.View entering={SlideInRight.delay(200).duration(300)} style={[styles.section, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="shopping-cart" size={24} color={theme.secondary} />
            <View style={styles.sectionHeaderText}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Biaya Variabel</Text>
              <Text style={[styles.helperText, { color: theme.textSecondary }]}>Per unit (bahan baku, kemasan)</Text>
            </View>
          </View>
          
          {variableCosts.map((item, index) => (
            <View key={item.id} style={styles.costItemCard}>
              <View style={styles.costItemHeader}>
                <View style={[styles.inputContainer, styles.nameInputFull, { backgroundColor: 'rgba(0,0,0,0.2)', borderColor: theme.border }]}>
                  <MaterialIcons name="inventory" size={18} color={theme.textSecondary} />
                  <TextInput
                    style={[styles.input, { color: theme.text }]}
                    value={item.name}
                    onChangeText={text => {
                      const newCosts = [...variableCosts];
                      newCosts[index].name = text;
                      setVariableCosts(newCosts);
                    }}
                    placeholder="Nama bahan"
                    placeholderTextColor={theme.textSecondary}
                    keyboardAppearance="dark"
                  />
                </View>
                <TouchableOpacity 
                  onPress={() => removeVariableCost(item.id)} 
                  style={[styles.deleteButton, { backgroundColor: 'rgba(239, 68, 68, 0.15)', borderColor: theme.error }]}
                >
                  <MaterialIcons name="delete-outline" size={20} color={theme.error} />
                </TouchableOpacity>
              </View>
              <View style={styles.variableInputRow}>
                <View style={[styles.inputContainer, styles.variableInputItem, { backgroundColor: 'rgba(0,0,0,0.2)', borderColor: theme.border }]}>
                  <Text style={[styles.currency, { color: theme.textSecondary, fontSize: 12 }]}>Rp</Text>
                  <TextInput
                    style={[styles.input, { color: theme.text, fontSize: 14 }]}
                    value={item.amount !== null && item.amount !== undefined ? formatCurrency(item.amount) : ''}
                    onChangeText={text => {
                      const formatted = formatCurrencyInput(text);
                      const newCosts = [...variableCosts];
                      newCosts[index].amount = parseCurrency(formatted);
                      setVariableCosts(newCosts);
                    }}
                    keyboardType="numeric"
                    placeholder="Harga"
                    placeholderTextColor={theme.textSecondary}
                    keyboardAppearance="dark"
                  />
                </View>
                <View style={[styles.inputContainer, styles.variableInputItem, { backgroundColor: 'rgba(0,0,0,0.2)', borderColor: theme.border }]}>
                  <MaterialIcons name="format-list-numbered" size={14} color={theme.textSecondary} />
                  <TextInput
                    style={[styles.input, { color: theme.text, fontSize: 14 }]}
                    value={item.quantity !== null && item.quantity !== undefined ? item.quantity.toString() : ''}
                    onChangeText={text => {
                      const newCosts = [...variableCosts];
                      newCosts[index].quantity = text ? Number(text) : 1;
                      setVariableCosts(newCosts);
                    }}
                    keyboardType="numeric"
                    placeholder="Qty"
                    placeholderTextColor={theme.textSecondary}
                    keyboardAppearance="dark"
                  />
                </View>
              </View>
            </View>
          ))}
          
          <TouchableOpacity 
            onPress={addVariableCost} 
            style={[styles.addButton, { borderColor: theme.secondary }]}
          >
            <MaterialIcons name="add" size={20} color={theme.secondary} />
            <Text style={[styles.addButtonText, { color: theme.secondary }]}>Tambah Biaya Variabel</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Parameter Perhitungan */}
        <Animated.View entering={SlideInRight.delay(300).duration(300)} style={[styles.section, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="calculate" size={24} color={theme.accent} />
            <View style={styles.sectionHeaderText}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Parameter Perhitungan</Text>
            </View>
          </View>
          
          <View style={styles.parameterRow}>
            <Text style={[styles.parameterLabel, { color: theme.textSecondary }]}>Margin Keuntungan</Text>
            <View style={[styles.inputContainer, styles.parameterInput, { backgroundColor: 'rgba(0,0,0,0.2)', borderColor: theme.border }]}>
              <TextInput
                style={[styles.input, { color: theme.text, textAlign: 'right' }]}
                value={profitMargin}
                onChangeText={setProfitMargin}
                keyboardType="numeric"
                placeholder="30"
                placeholderTextColor={theme.textSecondary}
                keyboardAppearance="dark"
              />
              <Text style={[styles.unit, { color: theme.primary }]}>%</Text>
            </View>
          </View>
          
          <View style={styles.parameterRow}>
            <Text style={[styles.parameterLabel, { color: theme.textSecondary }]}>Estimasi Penjualan</Text>
            <View style={[styles.inputContainer, styles.parameterInput, { backgroundColor: 'rgba(0,0,0,0.2)', borderColor: theme.border }]}>
              <TextInput
                style={[styles.input, { color: theme.text, textAlign: 'right' }]}
                value={estimatedSales}
                onChangeText={setEstimatedSales}
                keyboardType="numeric"
                placeholder="100"
                placeholderTextColor={theme.textSecondary}
                keyboardAppearance="dark"
              />
              <Text style={[styles.unit, { color: theme.secondary }]}>unit/bln</Text>
            </View>
          </View>

          <View style={styles.parameterRow}>
            <Text style={[styles.parameterLabel, { color: theme.textSecondary }]}>Diskon</Text>
            <View style={[styles.inputContainer, styles.parameterInput, { backgroundColor: 'rgba(0,0,0,0.2)', borderColor: theme.border }]}>
              <TextInput
                style={[styles.input, { color: theme.text, textAlign: 'right' }]}
                value={discount}
                onChangeText={setDiscount}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={theme.textSecondary}
                keyboardAppearance="dark"
              />
              <Text style={[styles.unit, { color: theme.accent }]}>%</Text>
            </View>
          </View>

          <View style={styles.parameterRow}>
            <Text style={[styles.parameterLabel, { color: theme.textSecondary }]}>PPh (Pajak Penghasilan)</Text>
            <View style={[styles.inputContainer, styles.parameterInput, { backgroundColor: 'rgba(0,0,0,0.2)', borderColor: theme.border }]}>
              <TextInput
                style={[styles.input, { color: theme.text, textAlign: 'right' }]}
                value={pph}
                onChangeText={setPph}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={theme.textSecondary}
                keyboardAppearance="dark"
              />
              <Text style={[styles.unit, { color: theme.error }]}>%</Text>
            </View>
          </View>

          <View style={styles.parameterRow}>
            <Text style={[styles.parameterLabel, { color: theme.textSecondary }]}>PPN (Pajak Pertambahan Nilai)</Text>
            <View style={[styles.inputContainer, styles.parameterInput, { backgroundColor: 'rgba(0,0,0,0.2)', borderColor: theme.border }]}>
              <TextInput
                style={[styles.input, { color: theme.text, textAlign: 'right' }]}
                value={ppn}
                onChangeText={setPpn}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={theme.textSecondary}
                keyboardAppearance="dark"
              />
              <Text style={[styles.unit, { color: theme.error }]}>%</Text>
            </View>
          </View>
        </Animated.View>

        {/* Hasil Perhitungan */}
        <Animated.View entering={SlideInRight.delay(400).duration(300)} style={[styles.resultCard, { backgroundColor: theme.surfaceDark, borderColor: theme.primary }]}>
          <View style={styles.resultHeader}>
            <MaterialIcons name="assessment" size={28} color={theme.primary} />
            <Text style={[styles.resultTitle, { color: theme.text }]}>Hasil Perhitungan</Text>
          </View>
          
          <View style={styles.resultDivider} />
          
          <View style={styles.resultRow}>
            <View style={styles.resultLabelContainer}>
              <MaterialIcons name="attach-money" size={20} color={theme.secondary} />
              <Text style={[styles.resultLabel, { color: theme.textSecondary }]}>BPP per Unit</Text>
            </View>
            <Text style={[styles.resultValue, { color: theme.secondary }]}>
              {bpp > 0 ? `Rp ${Math.round(bpp).toLocaleString('id-ID')}` : '-'}
            </Text>
          </View>
          
          {bpp > 0 && (
            <View style={[styles.explanationBox, { backgroundColor: 'rgba(52, 211, 153, 0.1)', borderColor: 'rgba(52, 211, 153, 0.3)' }]}>
              <MaterialIcons name="info-outline" size={16} color={theme.secondary} style={{ marginRight: 8 }} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.explanationText, { fontWeight: 700, color: theme.text }]}>
                  BPP (Biaya Pokok Produksi)
                </Text>
                <Text style={[styles.explanationText, { color: theme.textSecondary, marginTop: 4 }]}>
                  adalah total biaya untuk membuat 1 produk. Harga jual Anda harus lebih tinggi dari BPP agar mendapat untung.
                </Text>
              </View>
            </View>
          )}
          
          <View style={styles.resultRow}>
            <View style={styles.resultLabelContainer}>
              <MaterialIcons name="sell" size={20} color={theme.primary} />
              <Text style={[styles.resultLabel, { color: theme.textSecondary }]}>Harga Jual</Text>
            </View>
            <Text style={[styles.resultValue, { color: theme.primary, fontSize: 24 }]}>
              {sellingPrice > 0 ? `Rp ${Math.round(sellingPrice).toLocaleString('id-ID')}` : '-'}
            </Text>
          </View>
          
          {sellingPrice > 0 && (
            <View style={[styles.explanationBox, { backgroundColor: 'rgba(167, 139, 250, 0.1)', borderColor: 'rgba(167, 139, 250, 0.3)' }]}>
              <MaterialIcons name="info-outline" size={16} color={theme.primary} style={{ marginRight: 8 }} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.explanationText, { fontWeight: 700, color: theme.text }]}>
                  Harga Jual Optimal
                </Text>
                <Text style={[styles.explanationText, { color: theme.textSecondary, marginTop: 4 }]}>
                  sudah termasuk margin keuntungan yang Anda tetapkan. Ini adalah harga minimum yang disarankan untuk dijual.
                </Text>
              </View>
            </View>
          )}

          {discount && Number(discount) > 0 && (
            <View style={styles.resultRow}>
              <View style={styles.resultLabelContainer}>
                <MaterialIcons name="local-offer" size={20} color={theme.accent} />
                <Text style={[styles.resultLabel, { color: theme.textSecondary }]}>Harga Setelah Diskon ({discount}%)</Text>
              </View>
              <Text style={[styles.resultValue, { color: theme.accent }]}>
                {sellingPriceAfterDiscount > 0 ? `Rp ${Math.round(sellingPriceAfterDiscount).toLocaleString('id-ID')}` : '-'}
              </Text>
            </View>
          )}

          {((pph && Number(pph) > 0) || (ppn && Number(ppn) > 0)) && (
            <View style={styles.resultRow}>
              <View style={styles.resultLabelContainer}>
                <MaterialIcons name="receipt-long" size={20} color={theme.error} />
                <Text style={[styles.resultLabel, { color: theme.textSecondary }]}>Harga Final + Pajak</Text>
              </View>
              <Text style={[styles.resultValue, { color: theme.primary, fontSize: 24, fontWeight: 'bold' }]}>
                {sellingPriceAfterTax > 0 ? `Rp ${Math.round(sellingPriceAfterTax).toLocaleString('id-ID')}` : '-'}
              </Text>
            </View>
          )}
          
          <View style={styles.resultRow}>
            <View style={styles.resultLabelContainer}>
              <MaterialIcons name="trending-up" size={20} color={theme.accent} />
              <Text style={[styles.resultLabel, { color: theme.textSecondary }]}>Break-even Point</Text>
            </View>
            <Text style={[styles.resultValue, { color: theme.accent }]}>
              {estimatedSales && bpp && sellingPrice ? 
                `${Math.round((totalFixedCost) / (sellingPrice - bpp))} unit` : '-'}
            </Text>
          </View>
          
          {estimatedSales && bpp && sellingPrice && (
            <View style={[styles.explanationBox, { backgroundColor: 'rgba(244, 114, 182, 0.1)', borderColor: 'rgba(244, 114, 182, 0.3)' }]}>
              <MaterialIcons name="info-outline" size={16} color={theme.accent} style={{ marginRight: 8 }} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.explanationText, { fontWeight: 700, color: theme.text }]}>
                  Break-even Point
                </Text>
                <Text style={[styles.explanationText, { color: theme.textSecondary, marginTop: 4 }]}>
                  adalah jumlah unit yang harus terjual agar total pendapatan sama dengan total biaya (tidak untung, tidak rugi).
                </Text>
              </View>
            </View>
          )}
        </Animated.View>

        {/* Tombol Simpan */}
        <TouchableOpacity 
          onPress={saveCalculation}
          style={[
            styles.saveButtonMain, 
            { 
              backgroundColor: hasChanges ? theme.primary : theme.surface,
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
      
      {/* Fixed Cost Modal */}
      <Modal
        visible={showFixedCostModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFixedCostModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setShowFixedCostModal(false)}
        >
          <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
            <Animated.View 
              entering={SlideInDown.duration(300)}
              style={[styles.modalContainer, { backgroundColor: '#1A1625' }]}
            >
              <View style={[styles.modalGradient1, { backgroundColor: 'rgba(167, 139, 250, 0.3)' }]} />
              <View style={[styles.modalGradient2, { backgroundColor: 'rgba(244, 114, 182, 0.2)' }]} />
              
              <View style={styles.modalContent}>
                <View style={[styles.modalIconContainer, { backgroundColor: 'rgba(167, 139, 250, 0.15)' }]}>
                  <MaterialIcons name="account-balance-wallet" size={32} color={theme.primary} />
                </View>
                
                <Text style={[styles.modalTitle, { color: theme.text }]}>Tambah Biaya Tetap</Text>
                <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>
                  Biaya yang jumlahnya tetap setiap bulan
                </Text>
                
                {/* Nama Input */}
                <View style={styles.inputWrapper}>
                  <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Nama Biaya</Text>
                  <Text style={[styles.helperText, { color: theme.outline, marginBottom: 8 }]}>Contoh: Sewa tempat, listrik, gaji karyawan, dsb</Text>
                  <View style={[styles.inputContainer, { backgroundColor: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255, 255, 255, 0.15)' }]}>
                    <MaterialIcons name="label" size={20} color={theme.outline} style={styles.inputIcon} />
                    <TextInput
                      style={[styles.modalInput, { color: theme.text }]}
                      placeholder=""
                      placeholderTextColor={theme.outline}
                      value={tempFixedCostName}
                      onChangeText={setTempFixedCostName}
                      autoFocus
                      keyboardAppearance="dark"
                    />
                  </View>
                </View>
                
                {/* Amount Input with Quick Buttons */}
                <View style={styles.inputWrapper}>
                  <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Jumlah (Rp)</Text>
                  <Text style={[styles.helperText, { color: theme.outline, marginBottom: 8 }]}>Masukkan nominal atau gunakan tombol cepat di bawah</Text>
                  <View style={[styles.inputContainer, { backgroundColor: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255, 255, 255, 0.15)' }]}>
                    <Text style={[styles.currency, { color: theme.textSecondary }]}>Rp</Text>
                    <TextInput
                      style={[styles.modalInput, { color: theme.text }]}
                      placeholder=""
                      placeholderTextColor={theme.outline}
                      value={tempFixedCostAmount}
                      onChangeText={(text) => {
                        const formatted = formatCurrencyInput(text);
                        setTempFixedCostAmount(formatted);
                      }}
                      keyboardType="numeric"
                      keyboardAppearance="dark"
                    />
                  </View>
                  
                  {/* Quick Amount Buttons */}
                  <View style={styles.quickButtonsRow}>
                    <TouchableOpacity
                      style={[styles.quickButton, { backgroundColor: 'rgba(239, 68, 68, 0.15)', borderColor: theme.error }]}
                      onPress={() => {
                        const current = parseCurrency(tempFixedCostAmount);
                        setTempFixedCostAmount(formatCurrency(Math.max(0, current - 10000)));
                      }}
                    >
                      <Text style={[styles.quickButtonText, { color: theme.error }]}>-10K</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.quickButton, { backgroundColor: 'rgba(239, 68, 68, 0.15)', borderColor: theme.error }]}
                      onPress={() => {
                        const current = parseCurrency(tempFixedCostAmount);
                        setTempFixedCostAmount(formatCurrency(Math.max(0, current - 1000)));
                      }}
                    >
                      <Text style={[styles.quickButtonText, { color: theme.error }]}>-1K</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.quickButton, { backgroundColor: 'rgba(16, 185, 129, 0.15)', borderColor: theme.success }]}
                      onPress={() => {
                        const current = parseCurrency(tempFixedCostAmount);
                        setTempFixedCostAmount(formatCurrency(current + 1000));
                      }}
                    >
                      <Text style={[styles.quickButtonText, { color: theme.success }]}>+1K</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.quickButton, { backgroundColor: 'rgba(16, 185, 129, 0.15)', borderColor: theme.success }]}
                      onPress={() => {
                        const current = parseCurrency(tempFixedCostAmount);
                        setTempFixedCostAmount(formatCurrency(current + 10000));
                      }}
                    >
                      <Text style={[styles.quickButtonText, { color: theme.success }]}>+10K</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                
                {/* Action Buttons */}
                <View style={styles.modalActions}>
                  <TouchableOpacity 
                    onPress={() => setShowFixedCostModal(false)}
                    style={[styles.modalButton, styles.cancelButton, { borderColor: 'rgba(255, 255, 255, 0.2)', backgroundColor: 'rgba(255, 255, 255, 0.05)' }]}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.modalButtonText, { color: theme.text }]}>Batal</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={saveFixedCost}
                    style={[styles.modalButton, styles.saveButton, { opacity: !tempFixedCostName.trim() || !tempFixedCostAmount ? 0.5 : 1 }]}
                    activeOpacity={0.8}
                    disabled={!tempFixedCostName.trim() || !tempFixedCostAmount}
                  >
                    <Text style={[styles.modalButtonText, { color: 'white' }]}>Tambahkan</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Animated.View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
      
      {/* Variable Cost Modal */}
      <Modal
        visible={showVariableCostModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowVariableCostModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setShowVariableCostModal(false)}
        >
          <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
            <Animated.View 
              entering={SlideInDown.duration(300)}
              style={[styles.modalContainer, { backgroundColor: '#1A1625' }]}
            >
              <View style={[styles.modalGradient1, { backgroundColor: 'rgba(52, 211, 153, 0.3)' }]} />
              <View style={[styles.modalGradient2, { backgroundColor: 'rgba(244, 114, 182, 0.2)' }]} />
              
              <View style={styles.modalContent}>
                <View style={[styles.modalIconContainer, { backgroundColor: 'rgba(52, 211, 153, 0.15)' }]}>
                  <MaterialIcons name="shopping-cart" size={32} color={theme.secondary} />
                </View>
                
                <Text style={[styles.modalTitle, { color: theme.text }]}>Tambah Biaya Variabel</Text>
                <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>
                  Biaya yang berubah sesuai jumlah produksi
                </Text>
                
                {/* Nama Input */}
                <View style={styles.inputWrapper}>
                  <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Nama Bahan</Text>
                  <Text style={[styles.helperText, { color: theme.outline, marginBottom: 8 }]}>Contoh: Tepung terigu, gula pasir, kemasan plastik, dsb</Text>
                  <View style={[styles.inputContainer, { backgroundColor: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255, 255, 255, 0.15)' }]}>
                    <MaterialIcons name="inventory" size={20} color={theme.outline} style={styles.inputIcon} />
                    <TextInput
                      style={[styles.modalInput, { color: theme.text }]}
                      placeholder=""
                      placeholderTextColor={theme.outline}
                      value={tempVariableCostName}
                      onChangeText={setTempVariableCostName}
                      autoFocus
                      keyboardAppearance="dark"
                    />
                  </View>
                </View>
                
                {/* Amount Input with Quick Buttons */}
                <View style={styles.inputWrapper}>
                  <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Harga per Unit (Rp)</Text>
                  <Text style={[styles.helperText, { color: theme.outline, marginBottom: 8 }]}>Harga satuan bahan atau gunakan tombol cepat</Text>
                  <View style={[styles.inputContainer, { backgroundColor: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255, 255, 255, 0.15)' }]}>
                    <Text style={[styles.currency, { color: theme.textSecondary }]}>Rp</Text>
                    <TextInput
                      style={[styles.modalInput, { color: theme.text }]}
                      placeholder=""
                      placeholderTextColor={theme.outline}
                      value={tempVariableCostAmount}
                      onChangeText={(text) => {
                        const formatted = formatCurrencyInput(text);
                        setTempVariableCostAmount(formatted);
                      }}
                      keyboardType="numeric"
                      keyboardAppearance="dark"
                    />
                  </View>
                  
                  {/* Quick Amount Buttons for Variable Cost */}
                  <View style={styles.quickButtonsRow}>
                    <TouchableOpacity
                      style={[styles.quickButton, { backgroundColor: 'rgba(239, 68, 68, 0.15)', borderColor: theme.error }]}
                      onPress={() => {
                        const current = parseCurrency(tempVariableCostAmount);
                        setTempVariableCostAmount(formatCurrency(Math.max(0, current - 5000)));
                      }}
                    >
                      <Text style={[styles.quickButtonText, { color: theme.error }]}>-5K</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.quickButton, { backgroundColor: 'rgba(239, 68, 68, 0.15)', borderColor: theme.error }]}
                      onPress={() => {
                        const current = parseCurrency(tempVariableCostAmount);
                        setTempVariableCostAmount(formatCurrency(Math.max(0, current - 1000)));
                      }}
                    >
                      <Text style={[styles.quickButtonText, { color: theme.error }]}>-1K</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.quickButton, { backgroundColor: 'rgba(16, 185, 129, 0.15)', borderColor: theme.success }]}
                      onPress={() => {
                        const current = parseCurrency(tempVariableCostAmount);
                        setTempVariableCostAmount(formatCurrency(current + 1000));
                      }}
                    >
                      <Text style={[styles.quickButtonText, { color: theme.success }]}>+1K</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.quickButton, { backgroundColor: 'rgba(16, 185, 129, 0.15)', borderColor: theme.success }]}
                      onPress={() => {
                        const current = parseCurrency(tempVariableCostAmount);
                        setTempVariableCostAmount(formatCurrency(current + 5000));
                      }}
                    >
                      <Text style={[styles.quickButtonText, { color: theme.success }]}>+5K</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                
                {/* Quantity Input with Quick Buttons */}
                <View style={styles.inputWrapper}>
                  <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Jumlah</Text>
                  <Text style={[styles.helperText, { color: theme.outline, marginBottom: 8 }]}>Jumlah yang dibutuhkan per produk</Text>
                  <View style={[styles.inputContainer, { backgroundColor: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255, 255, 255, 0.15)' }]}>
                    <MaterialIcons name="format-list-numbered" size={20} color={theme.outline} style={styles.inputIcon} />
                    <TextInput
                      style={[styles.modalInput, { color: theme.text }]}
                      placeholder=""
                      placeholderTextColor={theme.outline}
                      value={tempVariableCostQuantity}
                      onChangeText={setTempVariableCostQuantity}
                      keyboardType="numeric"
                      keyboardAppearance="dark"
                    />
                  </View>
                  
                  {/* Quick Quantity Buttons */}
                  <View style={styles.quickButtonsRow}>
                    <TouchableOpacity
                      style={[styles.quickButton, { backgroundColor: 'rgba(239, 68, 68, 0.15)', borderColor: theme.error }]}
                      onPress={() => {
                        const current = Number(tempVariableCostQuantity) || 0;
                        setTempVariableCostQuantity(Math.max(0, current - 5).toString());
                      }}
                    >
                      <Text style={[styles.quickButtonText, { color: theme.error }]}>-5</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.quickButton, { backgroundColor: 'rgba(239, 68, 68, 0.15)', borderColor: theme.error }]}
                      onPress={() => {
                        const current = Number(tempVariableCostQuantity) || 0;
                        setTempVariableCostQuantity(Math.max(0, current - 1).toString());
                      }}
                    >
                      <Text style={[styles.quickButtonText, { color: theme.error }]}>-1</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.quickButton, { backgroundColor: 'rgba(16, 185, 129, 0.15)', borderColor: theme.success }]}
                      onPress={() => {
                        const current = Number(tempVariableCostQuantity) || 0;
                        setTempVariableCostQuantity((current + 1).toString());
                      }}
                    >
                      <Text style={[styles.quickButtonText, { color: theme.success }]}>+1</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.quickButton, { backgroundColor: 'rgba(16, 185, 129, 0.15)', borderColor: theme.success }]}
                      onPress={() => {
                        const current = Number(tempVariableCostQuantity) || 0;
                        setTempVariableCostQuantity((current + 5).toString());
                      }}
                    >
                      <Text style={[styles.quickButtonText, { color: theme.success }]}>+5</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                
                {/* Action Buttons */}
                <View style={styles.modalActions}>
                  <TouchableOpacity 
                    onPress={() => setShowVariableCostModal(false)}
                    style={[styles.modalButton, styles.cancelButton, { borderColor: 'rgba(255, 255, 255, 0.2)', backgroundColor: 'rgba(255, 255, 255, 0.05)' }]}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.modalButtonText, { color: theme.text }]}>Batal</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={saveVariableCost}
                    style={[styles.modalButton, styles.saveButton, { opacity: !tempVariableCostName.trim() || !tempVariableCostAmount || !tempVariableCostQuantity ? 0.5 : 1 }]}
                    activeOpacity={0.8}
                    disabled={!tempVariableCostName.trim() || !tempVariableCostAmount || !tempVariableCostQuantity}
                  >
                    <Text style={[styles.modalButtonText, { color: 'white' }]}>Tambahkan</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Animated.View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
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
    bottom: 10,
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
  explanationBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    marginTop: 8,
  },
  explanationText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  saveButtonMain: {
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 500,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  modalGradient1: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 150,
    height: 150,
    borderRadius: 75,
    opacity: 0.3,
  },
  modalGradient2: {
    position: 'absolute',
    bottom: -60,
    left: -60,
    width: 180,
    height: 180,
    borderRadius: 90,
    opacity: 0.2,
  },
  modalContent: {
    padding: 24,
  },
  modalIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  inputWrapper: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputIcon: {
    marginRight: 10,
  },
  modalInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 12,
  },
  quickButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  quickButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    borderWidth: 2,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  saveButton: {
    backgroundColor: '#A78BFA',
  },
});