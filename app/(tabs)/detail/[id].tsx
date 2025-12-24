// app/(tabs)/detail/[id].tsx
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Button, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useNotes } from '../../../src/context/NoteContext';

export default function DetailPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { notes, addNote } = useNotes();
  const router = useRouter();
  
  const note = notes.find(n => n.id === id);
  if (!note) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorTitle}>Catatan Tidak Ditemukan</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backLink}>← Kembali ke Daftar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // State untuk form
  const [fixedCosts, setFixedCosts] = useState<{ id: string; name: string; amount: number | null }[]>([]);
  const [variableCosts, setVariableCosts] = useState<{ id: string; name: string; amount: number | null; quantity: number | null }[]>([]);
  const [profitMargin, setProfitMargin] = useState('');
  const [estimatedSales, setEstimatedSales] = useState('');
  const [bpp, setBpp] = useState(0);
  const [sellingPrice, setSellingPrice] = useState(0);
  const [totalFixedCost, setTotalFixedCost] = useState(0);

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
      Alert.alert('Peringatan', 'Harap isi semua parameter perhitungan');
      return;
    }
    if (sellingPrice <= 0) {
      Alert.alert('Peringatan', 'Hasil perhitungan tidak valid. Periksa kembali input Anda.');
      return;
    }
    try {
      // Simpan catatan baru (atau update, jika addNote meng-handle update)
      await addNote(note.name);
      Alert.alert('Berhasil', 'Perhitungan disimpan');
      router.back();
    } catch (error) {
      Alert.alert('Error', 'Gagal menyimpan data');
      console.error('Save error:', error);
    }
  };

  // Hitung otomatis saat ada perubahan input
  useEffect(() => {
    calculate();
  }, [fixedCosts, variableCosts, profitMargin, estimatedSales]);

  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <Text style={styles.title}>{note.name}</Text>
      <Text style={styles.subtitle}>Detail Perhitungan</Text>
      
      {/* Biaya Tetap */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Biaya Tetap (Bulanan)</Text>
        <Text style={styles.helperText}>Contoh: Sewa tempat, listrik, gaji karyawan</Text>
        
        {fixedCosts.map((item, index) => (
          <View key={item.id} style={styles.row}>
            <TextInput
              style={[styles.input, styles.costInput]}
              value={item.name}
              onChangeText={text => {
                const newCosts = [...fixedCosts];
                newCosts[index].name = text;
                setFixedCosts(newCosts);
              }}
              placeholder="Nama biaya (contoh: Sewa tempat)"
            />
            <TextInput
              style={[styles.input, styles.amountInput]}
              value={item.amount !== null && item.amount !== undefined ? item.amount.toString() : ''}
              onChangeText={text => {
                const newCosts = [...fixedCosts];
                newCosts[index].amount = text ? Number(text) : 0;
                setFixedCosts(newCosts);
              }}
              keyboardType="numeric"
              placeholder="Jumlah (Rp)"
            />
            <TouchableOpacity onPress={() => removeFixedCost(item.id)} style={styles.removeButton}>
              <Text style={styles.removeButtonText}>×</Text>
            </TouchableOpacity>
          </View>
        ))}
        
        <TouchableOpacity onPress={addFixedCost} style={styles.addButton}>
          <Text style={styles.addButtonText}>+ Tambah Biaya Tetap</Text>
        </TouchableOpacity>
      </View>

      {/* Biaya Variabel */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Biaya Variabel (Per Unit)</Text>
        <Text style={styles.helperText}>Contoh: Bahan baku, kemasan, ongkir per produk</Text>
        
        {variableCosts.map((item, index) => (
          <View key={item.id} style={styles.row}>
            <TextInput
              style={[styles.input, styles.costInput]}
              value={item.name}
              onChangeText={text => {
                const newCosts = [...variableCosts];
                newCosts[index].name = text;
                setVariableCosts(newCosts);
              }}
              placeholder="Nama bahan (contoh: Tepung)"
            />
            <TextInput
              style={[styles.input, styles.smallInput]}
              value={item.amount !== null && item.amount !== undefined ? item.amount.toString() : ''}
              onChangeText={text => {
                const newCosts = [...variableCosts];
                newCosts[index].amount = text ? Number(text) : 0;
                setVariableCosts(newCosts);
              }}
              keyboardType="numeric"
              placeholder="Harga satuan (Rp)"
            />
            <TextInput
              style={[styles.input, styles.smallInput]}
              value={item.quantity !== null && item.quantity !== undefined ? item.quantity.toString() : ''}
              onChangeText={text => {
                const newCosts = [...variableCosts];
                newCosts[index].quantity = text ? Number(text) : 1;
                setVariableCosts(newCosts);
              }}
              keyboardType="numeric"
              placeholder="Jumlah per unit"
            />
            <TouchableOpacity onPress={() => removeVariableCost(item.id)} style={styles.removeButton}>
              <Text style={styles.removeButtonText}>×</Text>
            </TouchableOpacity>
          </View>
        ))}
        
        <TouchableOpacity onPress={addVariableCost} style={styles.addButton}>
          <Text style={styles.addButtonText}>+ Tambah Biaya Variabel</Text>
        </TouchableOpacity>
      </View>

      {/* Parameter Perhitungan */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Parameter Perhitungan</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Margin Keuntungan (%):</Text>
          <TextInput
            style={styles.input}
            value={profitMargin}
            onChangeText={setProfitMargin}
            keyboardType="numeric"
            placeholder="Contoh: 30 (untuk 30%)"
          />
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Estimasi Penjualan (unit/bulan):</Text>
          <TextInput
            style={styles.input}
            value={estimatedSales}
            onChangeText={setEstimatedSales}
            keyboardType="numeric"
            placeholder="Contoh: 100 (produk per bulan)"
          />
        </View>
      </View>

      {/* Hasil Perhitungan */}
      <View style={styles.resultCard}>
        <Text style={styles.resultTitle}>Hasil Perhitungan</Text>
        
        <View style={styles.resultRow}>
          <Text style={styles.resultLabel}>Biaya Pokok Produksi (BPP):</Text>
          <Text style={styles.resultValue}>
            {bpp > 0 ? `Rp ${Math.round(bpp).toLocaleString('id-ID')}` : '-'}
          </Text>
        </View>
        
        <View style={styles.resultRow}>
          <Text style={styles.resultLabel}>Harga Jual:</Text>
          <Text style={styles.resultValue}>
            {sellingPrice > 0 ? `Rp ${Math.round(sellingPrice).toLocaleString('id-ID')}` : '-'}
          </Text>
        </View>
        
        <View style={styles.resultRow}>
          <Text style={styles.resultLabel}>Break-even Point:</Text>
          <Text style={styles.resultValue}>
            {estimatedSales && bpp && sellingPrice ? 
              `${Math.round((totalFixedCost) / (sellingPrice - bpp))} unit` : '-'}
          </Text>
        </View>
      </View>

      {/* Tombol Aksi */}
      <View style={styles.buttonGroup}>
        <Button 
          title="Simpan Perhitungan" 
          color="#0d6efd"
          onPress={saveCalculation}
        />
      </View>

      {/* Tombol Kembali */}
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <Text style={styles.backText}>← Kembali ke Daftar</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
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
  section: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
  },
  helperText: {
    fontSize: 12,
    color: '#6c757d',
    fontStyle: 'italic',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    marginBottom: 5,
    color: '#495057',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
  },
  costInput: {
    flex: 2,
    marginRight: 5,
  },
  amountInput: {
    flex: 1,
    marginLeft: 5,
  },
  smallInput: {
    flex: 1,
    marginHorizontal: 3,
  },
  addButton: {
    marginTop: 10,
    padding: 10,
  },
  addButtonText: {
    color: '#0d6efd',
    textAlign: 'center',
    fontWeight: '600',
  },
  removeButton: {
    backgroundColor: '#ff4444',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 5,
  },
  removeButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  resultCard: {
    backgroundColor: '#f0f8ff',
    borderRadius: 12,
    padding: 15,
    marginTop: 20,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  resultLabel: {
    fontSize: 14,
    color: '#495057',
  },
  resultValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  buttonGroup: {
    marginTop: 20,
  },
  backButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  backText: {
    fontSize: 16,
    color: '#0d6efd',
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 50,
  },
  backLink: {
    fontSize: 16,
    color: '#0d6efd',
    textAlign: 'center',
    marginTop: 20,
  },
});