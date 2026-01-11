// app/(tabs)/detail/[id].tsx
import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeOutUp, SlideInDown, SlideInRight, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
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
      outline: '#6B7280',
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
        amount: Number(tempFixedCostAmount) 
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
        amount: Number(tempVariableCostAmount),
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

          <View style={styles.parameterRow}>
            <Text style={[styles.parameterLabel, { color: theme.colors.textSecondary }]}>Diskon</Text>
            <View style={[styles.inputContainer, styles.parameterInput, { backgroundColor: 'rgba(0,0,0,0.2)', borderColor: theme.colors.border }]}>
              <TextInput
                style={[styles.input, { color: theme.colors.text, textAlign: 'right' }]}
                value={discount}
                onChangeText={setDiscount}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={theme.colors.textSecondary}
                keyboardAppearance="dark"
              />
              <Text style={[styles.unit, { color: theme.colors.accent }]}>%</Text>
            </View>
          </View>

          <View style={styles.parameterRow}>
            <Text style={[styles.parameterLabel, { color: theme.colors.textSecondary }]}>PPh (Pajak Penghasilan)</Text>
            <View style={[styles.inputContainer, styles.parameterInput, { backgroundColor: 'rgba(0,0,0,0.2)', borderColor: theme.colors.border }]}>
              <TextInput
                style={[styles.input, { color: theme.colors.text, textAlign: 'right' }]}
                value={pph}
                onChangeText={setPph}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={theme.colors.textSecondary}
                keyboardAppearance="dark"
              />
              <Text style={[styles.unit, { color: theme.colors.error }]}>%</Text>
            </View>
          </View>

          <View style={styles.parameterRow}>
            <Text style={[styles.parameterLabel, { color: theme.colors.textSecondary }]}>PPN (Pajak Pertambahan Nilai)</Text>
            <View style={[styles.inputContainer, styles.parameterInput, { backgroundColor: 'rgba(0,0,0,0.2)', borderColor: theme.colors.border }]}>
              <TextInput
                style={[styles.input, { color: theme.colors.text, textAlign: 'right' }]}
                value={ppn}
                onChangeText={setPpn}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={theme.colors.textSecondary}
                keyboardAppearance="dark"
              />
              <Text style={[styles.unit, { color: theme.colors.error }]}>%</Text>
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

          {discount && Number(discount) > 0 && (
            <View style={styles.resultRow}>
              <View style={styles.resultLabelContainer}>
                <MaterialIcons name="local-offer" size={20} color={theme.colors.accent} />
                <Text style={[styles.resultLabel, { color: theme.colors.textSecondary }]}>Harga Setelah Diskon ({discount}%)</Text>
              </View>
              <Text style={[styles.resultValue, { color: theme.colors.accent }]}>
                {sellingPriceAfterDiscount > 0 ? `Rp ${Math.round(sellingPriceAfterDiscount).toLocaleString('id-ID')}` : '-'}
              </Text>
            </View>
          )}

          {((pph && Number(pph) > 0) || (ppn && Number(ppn) > 0)) && (
            <View style={styles.resultRow}>
              <View style={styles.resultLabelContainer}>
                <MaterialIcons name="receipt-long" size={20} color={theme.colors.error} />
                <Text style={[styles.resultLabel, { color: theme.colors.textSecondary }]}>Harga Final + Pajak</Text>
              </View>
              <Text style={[styles.resultValue, { color: theme.colors.primary, fontSize: 24, fontWeight: 'bold' }]}>
                {sellingPriceAfterTax > 0 ? `Rp ${Math.round(sellingPriceAfterTax).toLocaleString('id-ID')}` : '-'}
              </Text>
            </View>
          )}
          
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
            styles.saveButtonMain, 
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
                  <MaterialIcons name="account-balance-wallet" size={32} color={theme.colors.primary} />
                </View>
                
                <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Tambah Biaya Tetap</Text>
                <Text style={[styles.modalSubtitle, { color: theme.colors.textSecondary }]}>
                  Biaya yang jumlahnya tetap setiap bulan
                </Text>
                
                {/* Nama Input */}
                <View style={styles.inputWrapper}>
                  <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>Nama Biaya</Text>
                  <Text style={[styles.helperText, { color: theme.colors.outline, marginBottom: 8 }]}>Contoh: Sewa tempat, listrik, gaji karyawan, dsb</Text>
                  <View style={[styles.inputContainer, { backgroundColor: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255, 255, 255, 0.15)' }]}>
                    <MaterialIcons name="label" size={20} color={theme.colors.outline} style={styles.inputIcon} />
                    <TextInput
                      style={[styles.modalInput, { color: theme.colors.text }]}
                      placeholder=""
                      placeholderTextColor={theme.colors.outline}
                      value={tempFixedCostName}
                      onChangeText={setTempFixedCostName}
                      autoFocus
                      keyboardAppearance="dark"
                    />
                  </View>
                </View>
                
                {/* Amount Input with Quick Buttons */}
                <View style={styles.inputWrapper}>
                  <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>Jumlah (Rp)</Text>
                  <Text style={[styles.helperText, { color: theme.colors.outline, marginBottom: 8 }]}>Masukkan nominal atau gunakan tombol cepat di bawah</Text>
                  <View style={[styles.inputContainer, { backgroundColor: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255, 255, 255, 0.15)' }]}>
                    <Text style={[styles.currency, { color: theme.colors.textSecondary }]}>Rp</Text>
                    <TextInput
                      style={[styles.modalInput, { color: theme.colors.text }]}
                      placeholder=""
                      placeholderTextColor={theme.colors.outline}
                      value={tempFixedCostAmount}
                      onChangeText={setTempFixedCostAmount}
                      keyboardType="numeric"
                      keyboardAppearance="dark"
                    />
                  </View>
                  
                  {/* Quick Amount Buttons */}
                  <View style={styles.quickButtonsRow}>
                    <TouchableOpacity
                      style={[styles.quickButton, { backgroundColor: 'rgba(239, 68, 68, 0.15)', borderColor: theme.colors.error }]}
                      onPress={() => {
                        const current = Number(tempFixedCostAmount) || 0;
                        setTempFixedCostAmount(Math.max(0, current - 10000).toString());
                      }}
                    >
                      <Text style={[styles.quickButtonText, { color: theme.colors.error }]}>-10K</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.quickButton, { backgroundColor: 'rgba(239, 68, 68, 0.15)', borderColor: theme.colors.error }]}
                      onPress={() => {
                        const current = Number(tempFixedCostAmount) || 0;
                        setTempFixedCostAmount(Math.max(0, current - 1000).toString());
                      }}
                    >
                      <Text style={[styles.quickButtonText, { color: theme.colors.error }]}>-1K</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.quickButton, { backgroundColor: 'rgba(16, 185, 129, 0.15)', borderColor: theme.colors.success }]}
                      onPress={() => {
                        const current = Number(tempFixedCostAmount) || 0;
                        setTempFixedCostAmount((current + 1000).toString());
                      }}
                    >
                      <Text style={[styles.quickButtonText, { color: theme.colors.success }]}>+1K</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.quickButton, { backgroundColor: 'rgba(16, 185, 129, 0.15)', borderColor: theme.colors.success }]}
                      onPress={() => {
                        const current = Number(tempFixedCostAmount) || 0;
                        setTempFixedCostAmount((current + 10000).toString());
                      }}
                    >
                      <Text style={[styles.quickButtonText, { color: theme.colors.success }]}>+10K</Text>
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
                    <Text style={[styles.modalButtonText, { color: theme.colors.text }]}>Batal</Text>
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
                  <MaterialIcons name="shopping-cart" size={32} color={theme.colors.secondary} />
                </View>
                
                <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Tambah Biaya Variabel</Text>
                <Text style={[styles.modalSubtitle, { color: theme.colors.textSecondary }]}>
                  Biaya yang berubah sesuai jumlah produksi
                </Text>
                
                {/* Nama Input */}
                <View style={styles.inputWrapper}>
                  <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>Nama Bahan</Text>
                  <Text style={[styles.helperText, { color: theme.colors.outline, marginBottom: 8 }]}>Contoh: Tepung terigu, gula pasir, kemasan plastik, dsb</Text>
                  <View style={[styles.inputContainer, { backgroundColor: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255, 255, 255, 0.15)' }]}>
                    <MaterialIcons name="inventory" size={20} color={theme.colors.outline} style={styles.inputIcon} />
                    <TextInput
                      style={[styles.modalInput, { color: theme.colors.text }]}
                      placeholder=""
                      placeholderTextColor={theme.colors.outline}
                      value={tempVariableCostName}
                      onChangeText={setTempVariableCostName}
                      autoFocus
                      keyboardAppearance="dark"
                    />
                  </View>
                </View>
                
                {/* Amount Input with Quick Buttons */}
                <View style={styles.inputWrapper}>
                  <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>Harga per Unit (Rp)</Text>
                  <Text style={[styles.helperText, { color: theme.colors.outline, marginBottom: 8 }]}>Harga satuan bahan atau gunakan tombol cepat</Text>
                  <View style={[styles.inputContainer, { backgroundColor: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255, 255, 255, 0.15)' }]}>
                    <Text style={[styles.currency, { color: theme.colors.textSecondary }]}>Rp</Text>
                    <TextInput
                      style={[styles.modalInput, { color: theme.colors.text }]}
                      placeholder=""
                      placeholderTextColor={theme.colors.outline}
                      value={tempVariableCostAmount}
                      onChangeText={setTempVariableCostAmount}
                      keyboardType="numeric"
                      keyboardAppearance="dark"
                    />
                  </View>
                  
                  {/* Quick Amount Buttons for Variable Cost */}
                  <View style={styles.quickButtonsRow}>
                    <TouchableOpacity
                      style={[styles.quickButton, { backgroundColor: 'rgba(239, 68, 68, 0.15)', borderColor: theme.colors.error }]}
                      onPress={() => {
                        const current = Number(tempVariableCostAmount) || 0;
                        setTempVariableCostAmount(Math.max(0, current - 5000).toString());
                      }}
                    >
                      <Text style={[styles.quickButtonText, { color: theme.colors.error }]}>-5K</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.quickButton, { backgroundColor: 'rgba(239, 68, 68, 0.15)', borderColor: theme.colors.error }]}
                      onPress={() => {
                        const current = Number(tempVariableCostAmount) || 0;
                        setTempVariableCostAmount(Math.max(0, current - 1000).toString());
                      }}
                    >
                      <Text style={[styles.quickButtonText, { color: theme.colors.error }]}>-1K</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.quickButton, { backgroundColor: 'rgba(16, 185, 129, 0.15)', borderColor: theme.colors.success }]}
                      onPress={() => {
                        const current = Number(tempVariableCostAmount) || 0;
                        setTempVariableCostAmount((current + 1000).toString());
                      }}
                    >
                      <Text style={[styles.quickButtonText, { color: theme.colors.success }]}>+1K</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.quickButton, { backgroundColor: 'rgba(16, 185, 129, 0.15)', borderColor: theme.colors.success }]}
                      onPress={() => {
                        const current = Number(tempVariableCostAmount) || 0;
                        setTempVariableCostAmount((current + 5000).toString());
                      }}
                    >
                      <Text style={[styles.quickButtonText, { color: theme.colors.success }]}>+5K</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                
                {/* Quantity Input with Quick Buttons */}
                <View style={styles.inputWrapper}>
                  <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>Jumlah</Text>
                  <Text style={[styles.helperText, { color: theme.colors.outline, marginBottom: 8 }]}>Jumlah yang dibutuhkan per produk</Text>
                  <View style={[styles.inputContainer, { backgroundColor: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255, 255, 255, 0.15)' }]}>
                    <MaterialIcons name="format-list-numbered" size={20} color={theme.colors.outline} style={styles.inputIcon} />
                    <TextInput
                      style={[styles.modalInput, { color: theme.colors.text }]}
                      placeholder=""
                      placeholderTextColor={theme.colors.outline}
                      value={tempVariableCostQuantity}
                      onChangeText={setTempVariableCostQuantity}
                      keyboardType="numeric"
                      keyboardAppearance="dark"
                    />
                  </View>
                  
                  {/* Quick Quantity Buttons */}
                  <View style={styles.quickButtonsRow}>
                    <TouchableOpacity
                      style={[styles.quickButton, { backgroundColor: 'rgba(239, 68, 68, 0.15)', borderColor: theme.colors.error }]}
                      onPress={() => {
                        const current = Number(tempVariableCostQuantity) || 0;
                        setTempVariableCostQuantity(Math.max(0, current - 5).toString());
                      }}
                    >
                      <Text style={[styles.quickButtonText, { color: theme.colors.error }]}>-5</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.quickButton, { backgroundColor: 'rgba(239, 68, 68, 0.15)', borderColor: theme.colors.error }]}
                      onPress={() => {
                        const current = Number(tempVariableCostQuantity) || 0;
                        setTempVariableCostQuantity(Math.max(0, current - 1).toString());
                      }}
                    >
                      <Text style={[styles.quickButtonText, { color: theme.colors.error }]}>-1</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.quickButton, { backgroundColor: 'rgba(16, 185, 129, 0.15)', borderColor: theme.colors.success }]}
                      onPress={() => {
                        const current = Number(tempVariableCostQuantity) || 0;
                        setTempVariableCostQuantity((current + 1).toString());
                      }}
                    >
                      <Text style={[styles.quickButtonText, { color: theme.colors.success }]}>+1</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.quickButton, { backgroundColor: 'rgba(16, 185, 129, 0.15)', borderColor: theme.colors.success }]}
                      onPress={() => {
                        const current = Number(tempVariableCostQuantity) || 0;
                        setTempVariableCostQuantity((current + 5).toString());
                      }}
                    >
                      <Text style={[styles.quickButtonText, { color: theme.colors.success }]}>+5</Text>
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
                    <Text style={[styles.modalButtonText, { color: theme.colors.text }]}>Batal</Text>
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