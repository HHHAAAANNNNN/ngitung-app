// app/(tabs)/detail/[id].tsx
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Button, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useNotes } from '../../../src/context/NoteContext';

export default function DetailPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { notes, addNote } = useNotes();
  const router = useRouter();
  
  // Ambil data catatan berdasarkan ID
  const note = notes.find(n => n.id === id);
  
  // State untuk form
  const [name, setName] = useState(note?.name || '');
  const [fixedCosts, setFixedCosts] = useState<{ id: string; name: string; amount: number }[]>([]);
  const [variableCosts, setVariableCosts] = useState<{ id: string; name: string; amount: number; quantity: number }[]>([]);
  const [profitMargin, setProfitMargin] = useState('30');
  const [estimatedSales, setEstimatedSales] = useState('100');
  const [bpp, setBpp] = useState(0);
  const [sellingPrice, setSellingPrice] = useState(0);

  // Generate ID unik untuk item
  const generateId = () => Math.random().toString(36).substr(2, 9);

  // Tambahkan biaya tetap
  const addFixedCost = () => {
    setFixedCosts([...fixedCosts, { id: generateId(), name: '', amount: 0 }]);
  };

  // Tambahkan biaya variabel
  const addVariableCost = () => {
    setVariableCosts([...variableCosts, { id: generateId(), name: '', amount: 0, quantity: 1 }]);
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
    const totalFixedCost = fixedCosts.reduce((sum, cost) => sum + cost.amount, 0);
    
    // Hitung total biaya variabel per unit
    const totalVariableCost = variableCosts.reduce((sum, cost) => {
      return sum + (cost.amount * cost.quantity);
    }, 0);
    
    // Hitung BPP
    const bppValue = totalVariableCost + (totalFixedCost / Number(estimatedSales));
    setBpp(bppValue);
    
    // Hitung harga jual dengan margin keuntungan
    const profit = Number(profitMargin) / 100;
    const sellingPriceValue = bppValue * (1 + profit);
    setSellingPrice(sellingPriceValue);
  };

  // Simpan perhitungan ke database
  const saveCalculation = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Nama usaha tidak boleh kosong');
      return;
    }
    
    if (sellingPrice <= 0) {
      Alert.alert('Error', 'Harap lakukan perhitungan terlebih dahulu');
      return;
    }
    
    try {
      // Update note dengan data baru
      await addNote(name);
      
      Alert.alert('Berhasil', 'Perhitungan disimpan');
      router.back();
    } catch (error) {
      Alert.alert('Error', 'Gagal menyimpan data');
    }
  };

  // Update form saat data catatan berubah
  useEffect(() => {
    if (note) {
      setName(note.name);
      setBpp(Number(note.bpp.replace('Rp ', '').replace('.', '')) || 0);
      setSellingPrice(Number(note.price.replace('Rp ', '').replace('.', '')) || 0);
    }
  }, [note]);

  // Hitung otomatis saat ada perubahan input
  useEffect(() => {
    calculate();
  }, [fixedCosts, variableCosts, profitMargin, estimatedSales]);

  if (!note) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorTitle}>Catatan Tidak Ditemukan</Text>
        <Text style={styles.errorSubtitle}>Detail Perhitungan</Text>
        
        <Text style={styles.errorMessage}>
          Catatan dengan ID "{id}" tidak ditemukan di database.
        </Text>
        
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backLink}>← Kembali ke Daftar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>{name}</Text>
      <Text style={styles.subtitle}>Detail Perhitungan</Text>

      {/* Input Nama Usaha */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Nama Usaha:</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Contoh: Bakso Ayam"
        />
      </View>

      {/* Biaya Tetap */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Biaya Tetap (Bulanan)</Text>
        {fixedCosts.map((item, index) => (
          <View style={styles.row} key={item.id}>
            <TextInput
              style={[styles.input, styles.smallInput]}
              value={item.name}
              onChangeText={text => {
                const newCosts = [...fixedCosts];
                newCosts[index].name = text;
                setFixedCosts(newCosts);
              }}
              placeholder="Nama biaya"
            />
            <TextInput
              style={[styles.input, styles.smallInput]}
              value={item.amount.toString()}
              onChangeText={text => {
                const newCosts = [...fixedCosts];
                newCosts[index].amount = Number(text) || 0;
                setFixedCosts(newCosts);
              }}
              keyboardType="numeric"
              placeholder="Jumlah"
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
        {variableCosts.map((item, index) => (
          <View style={styles.row} key={item.id}>
            <TextInput
              style={[styles.input, styles.smallInput]}
              value={item.name}
              onChangeText={text => {
                const newCosts = [...variableCosts];
                newCosts[index].name = text;
                setVariableCosts(newCosts);
              }}
              placeholder="Nama bahan"
            />
            <TextInput
              style={[styles.input, styles.smallInput]}
              value={item.amount.toString()}
              onChangeText={text => {
                const newCosts = [...variableCosts];
                newCosts[index].amount = Number(text) || 0;
                setVariableCosts(newCosts);
              }}
              keyboardType="numeric"
              placeholder="Harga"
            />
            <TextInput
              style={[styles.input, styles.smallInput]}
              value={item.quantity.toString()}
              onChangeText={text => {
                const newCosts = [...variableCosts];
                newCosts[index].quantity = Number(text) || 1;
                setVariableCosts(newCosts);
              }}
              keyboardType="numeric"
              placeholder="Jumlah"
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
        <View style={styles.row}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Margin Keuntungan (%):</Text>
            <TextInput
              style={styles.input}
              value={profitMargin}
              onChangeText={setProfitMargin}
              keyboardType="numeric"
              placeholder="30"
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Estimasi Penjualan (unit/bulan):</Text>
            <TextInput
              style={styles.input}
              value={estimatedSales}
              onChangeText={setEstimatedSales}
              keyboardType="numeric"
              placeholder="100"
            />
          </View>
        </View>
      </View>

      {/* Hasil Perhitungan */}
      <View style={styles.resultCard}>
        <Text style={styles.resultTitle}>Hasil Perhitungan</Text>
        <View style={styles.resultRow}>
          <Text style={styles.resultLabel}>Biaya Pokok Produksi (BPP):</Text>
          <Text style={styles.resultValue}>Rp {Math.round(bpp).toLocaleString('id-ID')}</Text>
        </View>
        <View style={styles.resultRow}>
          <Text style={styles.resultLabel}>Harga Jual:</Text>
          <Text style={styles.resultValue}>Rp {Math.round(sellingPrice).toLocaleString('id-ID')}</Text>
        </View>
        <View style={styles.resultRow}>
          <Text style={styles.resultLabel}>Break-even Point:</Text>
          <Text style={styles.resultValue}>
            {Math.round(Number(estimatedSales) * (bpp / sellingPrice))} unit
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
    padding: 20,
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
  smallInput: {
    width: '30%',
    marginRight: 5,
  },
  section: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  addButton: {
    marginTop: 10,
  },
  addButtonText: {
    color: '#0d6efd',
    textAlign: 'center',
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
    marginBottom: 10,
  },
  errorSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  errorMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  backLink: {
    fontSize: 16,
    color: '#0d6efd',
    textAlign: 'center',
  },
});