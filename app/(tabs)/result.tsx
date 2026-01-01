// app/(tabs)/result.tsx
import { MaterialIcons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, SlideInRight } from 'react-native-reanimated';
import { useNotes } from '../../src/context/NoteContext';

export default function ResultPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { notes } = useNotes();
  const router = useRouter();
  
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
      warning: '#F59E0B',
    }
  };
  
  const note = notes.find(n => n.id === id);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [simulationMode, setSimulationMode] = useState<'material' | 'sales' | null>(null);
  
  if (!note) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={64} color={theme.colors.error} />
          <Text style={[styles.errorTitle, { color: theme.colors.text }]}>Data Tidak Ditemukan</Text>
          <Text style={[styles.errorMessage, { color: theme.colors.textSecondary }]}>
            Silakan isi data perhitungan terlebih dahulu
          </Text>
        </View>
      </View>
    );
  }

  // Parse data
  const bppValue = parseFloat(note.bpp?.replace(/[^0-9]/g, '') || '0');
  const sellingPriceValue = parseFloat(note.price?.replace(/[^0-9]/g, '') || '0');
  const profitMargin = note.profitMargin || 0;
  const estimatedSales = note.estimatedSales || 0;
  const fixedCosts = note.fixedCosts || [];
  const variableCosts = note.variableCosts || [];
  
  // Calculations
  const totalFixedCost = fixedCosts.reduce((sum, cost) => sum + cost.amount, 0);
  const totalVariableCost = variableCosts.reduce((sum, cost) => sum + (cost.amount * cost.quantity), 0);
  const totalCost = totalFixedCost + (totalVariableCost * estimatedSales);
  const totalRevenue = sellingPriceValue * estimatedSales;
  const totalProfit = totalRevenue - totalCost;
  const breakEvenPoint = sellingPriceValue > bppValue ? Math.ceil(totalFixedCost / (sellingPriceValue - bppValue)) : 0;
  const isProfit = totalProfit > 0;
  
  // Cost composition percentages
  const fixedCostPercent = totalCost > 0 ? (totalFixedCost / totalCost) * 100 : 0;
  const variableCostPercent = totalCost > 0 ? ((totalVariableCost * estimatedSales) / totalCost) * 100 : 0;
  
  // Simulation scenarios
  const simulateMaterialIncrease = (percentage: number) => {
    const newVariableCost = totalVariableCost * (1 + percentage / 100);
    const newBpp = newVariableCost + (totalFixedCost / estimatedSales);
    const newSellingPrice = newBpp * (1 + profitMargin / 100);
    return {
      newBpp,
      newSellingPrice,
      priceIncrease: newSellingPrice - sellingPriceValue,
      marginImpact: ((newSellingPrice - sellingPriceValue) / sellingPriceValue) * 100,
    };
  };
  
  const simulateSalesDecrease = (percentage: number) => {
    const newSales = estimatedSales * (1 - percentage / 100);
    const newRevenue = sellingPriceValue * newSales;
    const newTotalCost = totalFixedCost + (totalVariableCost * newSales);
    const newProfit = newRevenue - newTotalCost;
    return {
      newSales: Math.round(newSales),
      newProfit,
      profitChange: newProfit - totalProfit,
      stillProfitable: newProfit > 0,
    };
  };
  
  // Recommendations
  const getRecommendations = () => {
    const recommendations = [];
    
    // Target untuk profit tertentu
    const targetProfitPerMonth = 5000000; // 5 juta
    const requiredSales = Math.ceil((totalFixedCost + targetProfitPerMonth) / (sellingPriceValue - bppValue));
    recommendations.push({
      icon: 'trending-up',
      color: theme.colors.secondary,
      title: 'Target Penjualan Optimal',
      description: `Jual ${requiredSales} unit/bulan untuk raih keuntungan Rp ${(targetProfitPerMonth / 1000000).toFixed(1)} juta`,
    });
    
    // Margin improvement
    if (profitMargin < 30) {
      recommendations.push({
        icon: 'lightbulb-outline',
        color: theme.colors.warning,
        title: 'Tingkatkan Margin',
        description: `Margin saat ini ${profitMargin}%. Coba naikkan ke 30-40% dengan efisiensi biaya atau menaikkan harga`,
      });
    }
    
    // Critical point
    const safetyMargin = breakEvenPoint * 1.3;
    recommendations.push({
      icon: 'warning',
      color: theme.colors.error,
      title: 'Zona Aman',
      description: `Jangan jual di bawah ${Math.ceil(safetyMargin)} unit/bulan. Di bawah ${breakEvenPoint} unit = rugi!`,
    });
    
    return recommendations;
  };
  
  const recommendations = getRecommendations();
  
  // Export to PDF
  const exportToPDF = async () => {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; background: #f5f5f5; }
          .container { background: white; padding: 30px; border-radius: 10px; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #A78BFA; padding-bottom: 20px; }
          .header h1 { color: #A78BFA; margin: 0; font-size: 28px; }
          .header p { color: #666; margin: 5px 0; }
          .section { margin: 25px 0; }
          .section-title { color: #333; font-size: 18px; font-weight: bold; margin-bottom: 15px; border-left: 4px solid #A78BFA; padding-left: 10px; }
          .result-box { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 10px 0; }
          .result-main { font-size: 32px; font-weight: bold; color: ${isProfit ? '#10B981' : '#EF4444'}; text-align: center; margin: 20px 0; }
          .result-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
          .result-label { color: #666; }
          .result-value { font-weight: bold; color: #333; }
          .recommendation { background: #e8f4f8; padding: 15px; border-radius: 8px; margin: 10px 0; border-left: 4px solid #34D399; }
          .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; color: #999; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>HASIL NGITUNG</h1>
            <p style="font-size: 20px; font-weight: bold; color: #333;">${note.name}</p>
            <p>Tanggal: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
          
          <div class="section">
            <div class="section-title">📊 Ringkasan Utama</div>
            <div class="result-box">
              <div class="result-main">${note.price}</div>
              <div class="result-row">
                <span class="result-label">Margin Keuntungan</span>
                <span class="result-value">${profitMargin}%</span>
              </div>
              <div class="result-row">
                <span class="result-label">BPP per Unit</span>
                <span class="result-value">${note.bpp}</span>
              </div>
              <div class="result-row">
                <span class="result-label">Break-even Point</span>
                <span class="result-value">${breakEvenPoint} unit/bulan</span>
              </div>
              <div class="result-row">
                <span class="result-label">Estimasi Penjualan</span>
                <span class="result-value">${estimatedSales} unit/bulan</span>
              </div>
              <div class="result-row">
                <span class="result-label">Proyeksi Keuntungan</span>
                <span class="result-value" style="color: ${isProfit ? '#10B981' : '#EF4444'}">Rp ${Math.round(totalProfit).toLocaleString('id-ID')}</span>
              </div>
            </div>
          </div>
          
          <div class="section">
            <div class="section-title">💰 Komposisi Biaya</div>
            <div class="result-box">
              <div class="result-row">
                <span class="result-label">Biaya Tetap (${fixedCostPercent.toFixed(1)}%)</span>
                <span class="result-value">Rp ${totalFixedCost.toLocaleString('id-ID')}</span>
              </div>
              <div class="result-row">
                <span class="result-label">Biaya Variabel (${variableCostPercent.toFixed(1)}%)</span>
                <span class="result-value">Rp ${(totalVariableCost * estimatedSales).toLocaleString('id-ID')}</span>
              </div>
            </div>
          </div>
          
          <div class="section">
            <div class="section-title">💡 Rekomendasi Aksi</div>
            ${recommendations.map(rec => `
              <div class="recommendation">
                <strong>${rec.title}</strong><br>
                ${rec.description}
              </div>
            `).join('')}
          </div>
          
          <div class="footer">
            <p>Dibuat dengan NGITUNG App</p>
            <p>Aplikasi Kalkulator Harga Pokok Produksi untuk UMKM</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    try {
      const { uri } = await Print.createAsync({ html: htmlContent });
      const fileName = `Hasil_NGITUNG_${note.name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
      
      if (Platform.OS === 'ios') {
        await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
      } else {
        await Sharing.shareAsync(uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Gagal membuat PDF');
      console.error(error);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Gradient Decorations */}
      <View style={[styles.gradientCircle1, { backgroundColor: 'rgba(167, 139, 250, 0.1)' }]} />
      <View style={[styles.gradientCircle2, { backgroundColor: 'rgba(244, 114, 182, 0.08)' }]} />
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. RINGKASAN UTAMA */}
        <Animated.View entering={FadeIn.duration(400)} style={[styles.mainSummary, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <Text style={[styles.sectionLabel, { color: theme.colors.textSecondary }]}>HARGA JUAL OPTIMAL</Text>
          <Text style={[styles.mainPrice, { color: isProfit ? theme.colors.success : theme.colors.error }]}>
            {note.price}
          </Text>
          
          <View style={styles.marginIndicator}>
            <View style={styles.marginBar}>
              <View style={[styles.marginFill, { width: `${Math.min(profitMargin, 100)}%`, backgroundColor: theme.colors.primary }]} />
            </View>
            <Text style={[styles.marginText, { color: theme.colors.text }]}>Margin {profitMargin}%</Text>
          </View>
          
          <View style={[styles.bepCard, { backgroundColor: 'rgba(0,0,0,0.2)', borderColor: theme.colors.secondary }]}>
            <MaterialIcons name="flag" size={24} color={theme.colors.secondary} />
            <View style={styles.bepContent}>
              <Text style={[styles.bepLabel, { color: theme.colors.textSecondary }]}>Break-even Point</Text>
              <Text style={[styles.bepText, { color: theme.colors.text }]}>
                Anda perlu jual <Text style={{ color: theme.colors.secondary, fontWeight: 'bold' }}>{breakEvenPoint} unit/bulan</Text> untuk balik modal
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* 2. KOMPOSISI BIAYA */}
        <Animated.View entering={SlideInRight.delay(100).duration(300)} style={[styles.section, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <TouchableOpacity onPress={() => setExpandedSection(expandedSection === 'costs' ? null : 'costs')} style={styles.sectionHeader}>
            <View style={styles.sectionHeaderLeft}>
              <MaterialIcons name="pie-chart" size={24} color={theme.colors.accent} />
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Komposisi Biaya</Text>
            </View>
            <MaterialIcons name={expandedSection === 'costs' ? 'expand-less' : 'expand-more'} size={24} color={theme.colors.textSecondary} />
          </TouchableOpacity>
          
          <View style={styles.pieChartContainer}>
            <View style={styles.pieChart}>
              <View style={[styles.pieSlice, { flex: fixedCostPercent, backgroundColor: theme.colors.primary }]} />
              <View style={[styles.pieSlice, { flex: variableCostPercent, backgroundColor: theme.colors.secondary }]} />
            </View>
          </View>
          
          <View style={styles.costBreakdown}>
            <View style={styles.costRow}>
              <View style={styles.costLabel}>
                <View style={[styles.colorDot, { backgroundColor: theme.colors.primary }]} />
                <Text style={[styles.costText, { color: theme.colors.text }]}>Biaya Tetap ({fixedCostPercent.toFixed(1)}%)</Text>
              </View>
              <Text style={[styles.costValue, { color: theme.colors.text }]}>Rp {totalFixedCost.toLocaleString('id-ID')}</Text>
            </View>
            <View style={styles.costRow}>
              <View style={styles.costLabel}>
                <View style={[styles.colorDot, { backgroundColor: theme.colors.secondary }]} />
                <Text style={[styles.costText, { color: theme.colors.text }]}>Biaya Variabel ({variableCostPercent.toFixed(1)}%)</Text>
              </View>
              <Text style={[styles.costValue, { color: theme.colors.text }]}>Rp {(totalVariableCost * estimatedSales).toLocaleString('id-ID')}</Text>
            </View>
          </View>
          
          {expandedSection === 'costs' && (
            <Animated.View entering={FadeInDown.duration(300)} style={styles.costDetails}>
              <View style={[styles.detailSection, { borderColor: theme.colors.border }]}>
                <Text style={[styles.detailTitle, { color: theme.colors.primary }]}>Rincian Biaya Tetap</Text>
                {fixedCosts.map((cost, index) => (
                  <View key={index} style={styles.detailRow}>
                    <Text style={[styles.detailName, { color: theme.colors.textSecondary }]}>{cost.name}</Text>
                    <Text style={[styles.detailAmount, { color: theme.colors.text }]}>Rp {cost.amount.toLocaleString('id-ID')}</Text>
                  </View>
                ))}
              </View>
              <View style={[styles.detailSection, { borderColor: theme.colors.border }]}>
                <Text style={[styles.detailTitle, { color: theme.colors.secondary }]}>Rincian Biaya Variabel</Text>
                {variableCosts.map((cost, index) => (
                  <View key={index} style={styles.detailRow}>
                    <Text style={[styles.detailName, { color: theme.colors.textSecondary }]}>{cost.name} (×{cost.quantity})</Text>
                    <Text style={[styles.detailAmount, { color: theme.colors.text }]}>Rp {(cost.amount * cost.quantity).toLocaleString('id-ID')}</Text>
                  </View>
                ))}
              </View>
            </Animated.View>
          )}
        </Animated.View>

        {/* 3. SIMULASI RESIKO */}
        <Animated.View entering={SlideInRight.delay(200).duration(300)} style={[styles.section, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderLeft}>
              <MaterialIcons name="science" size={24} color={theme.colors.warning} />
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Simulasi Resiko</Text>
            </View>
          </View>
          
          <TouchableOpacity 
            onPress={() => setSimulationMode(simulationMode === 'material' ? null : 'material')}
            style={[styles.simulationCard, { backgroundColor: 'rgba(245, 158, 11, 0.1)', borderColor: theme.colors.warning }]}
          >
            <View style={styles.simulationHeader}>
              <MaterialIcons name="trending-up" size={20} color={theme.colors.warning} />
              <Text style={[styles.simulationTitle, { color: theme.colors.text }]}>Kenaikan Harga Bahan Baku +20%</Text>
            </View>
            {simulationMode === 'material' && (() => {
              const result = simulateMaterialIncrease(20);
              return (
                <Animated.View entering={FadeInDown.duration(300)} style={styles.simulationResult}>
                  <Text style={[styles.simulationText, { color: theme.colors.textSecondary }]}>
                    BPP Baru: <Text style={{ color: theme.colors.text, fontWeight: 'bold' }}>Rp {Math.round(result.newBpp).toLocaleString('id-ID')}</Text>
                  </Text>
                  <Text style={[styles.simulationText, { color: theme.colors.textSecondary }]}>
                    Harga Jual Baru: <Text style={{ color: theme.colors.text, fontWeight: 'bold' }}>Rp {Math.round(result.newSellingPrice).toLocaleString('id-ID')}</Text>
                  </Text>
                  <Text style={[styles.simulationText, { color: theme.colors.warning }]}>
                    ⚠️ Naikkan harga Rp {Math.round(result.priceIncrease).toLocaleString('id-ID')} atau margin turun!
                  </Text>
                </Animated.View>
              );
            })()}
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={() => setSimulationMode(simulationMode === 'sales' ? null : 'sales')}
            style={[styles.simulationCard, { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: theme.colors.error }]}
          >
            <View style={styles.simulationHeader}>
              <MaterialIcons name="trending-down" size={20} color={theme.colors.error} />
              <Text style={[styles.simulationTitle, { color: theme.colors.text }]}>Penurunan Penjualan -30%</Text>
            </View>
            {simulationMode === 'sales' && (() => {
              const result = simulateSalesDecrease(30);
              return (
                <Animated.View entering={FadeInDown.duration(300)} style={styles.simulationResult}>
                  <Text style={[styles.simulationText, { color: theme.colors.textSecondary }]}>
                    Penjualan Baru: <Text style={{ color: theme.colors.text, fontWeight: 'bold' }}>{result.newSales} unit/bulan</Text>
                  </Text>
                  <Text style={[styles.simulationText, { color: theme.colors.textSecondary }]}>
                    Keuntungan: <Text style={{ color: result.stillProfitable ? theme.colors.success : theme.colors.error, fontWeight: 'bold' }}>
                      Rp {Math.round(result.newProfit).toLocaleString('id-ID')}
                    </Text>
                  </Text>
                  <Text style={[styles.simulationText, { color: theme.colors.error }]}>
                    {result.stillProfitable ? '✅ Masih untung, tapi tipis!' : '❌ Rugi! Perlu efisiensi biaya'}
                  </Text>
                </Animated.View>
              );
            })()}
          </TouchableOpacity>
        </Animated.View>

        {/* 4. REKOMENDASI AKSI */}
        <Animated.View entering={SlideInRight.delay(300).duration(300)} style={[styles.section, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderLeft}>
              <MaterialIcons name="lightbulb" size={24} color={theme.colors.accent} />
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Rekomendasi Aksi</Text>
            </View>
          </View>
          
          {recommendations.map((rec, index) => (
            <View key={index} style={[styles.recommendationCard, { backgroundColor: 'rgba(0,0,0,0.2)', borderLeftColor: rec.color }]}>
              <MaterialIcons name={rec.icon as any} size={24} color={rec.color} />
              <View style={styles.recommendationContent}>
                <Text style={[styles.recommendationTitle, { color: theme.colors.text }]}>{rec.title}</Text>
                <Text style={[styles.recommendationDesc, { color: theme.colors.textSecondary }]}>{rec.description}</Text>
              </View>
            </View>
          ))}
        </Animated.View>

        {/* 5. EKSPOR PDF */}
        <TouchableOpacity 
          onPress={exportToPDF}
          style={[styles.exportButton, { backgroundColor: theme.colors.primary }]}
        >
          <MaterialIcons name="picture-as-pdf" size={24} color="white" />
          <Text style={styles.exportButtonText}>Ekspor ke PDF</Text>
        </TouchableOpacity>
      </ScrollView>
      
      {/* Floating Back Button - Bottom Left */}
      <TouchableOpacity 
        onPress={() => router.back()}
        style={[styles.floatingBackButton, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
      >
        <MaterialIcons name="arrow-back" size={24} color={theme.colors.text} />
      </TouchableOpacity>
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
    paddingBottom: 100,
    paddingTop: Platform.OS === 'android' ? 40 : 50,
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
  mainSummary: {
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 20,
    alignItems: 'center',
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 8,
  },
  mainPrice: {
    fontSize: 42,
    fontWeight: '900',
    marginBottom: 20,
    letterSpacing: -1,
  },
  marginIndicator: {
    width: '100%',
    marginBottom: 20,
  },
  marginBar: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  marginFill: {
    height: '100%',
    borderRadius: 4,
  },
  marginText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  bepCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    width: '100%',
  },
  bepContent: {
    marginLeft: 12,
    flex: 1,
  },
  bepLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  bepText: {
    fontSize: 14,
    lineHeight: 20,
  },
  section: {
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 12,
  },
  pieChartContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  pieChart: {
    flexDirection: 'row',
    width: 200,
    height: 200,
    borderRadius: 100,
    overflow: 'hidden',
    transform: [{ rotate: '-90deg' }],
  },
  pieSlice: {
    height: '100%',
  },
  costBreakdown: {
    marginTop: 16,
  },
  costRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  costLabel: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  costText: {
    fontSize: 15,
    fontWeight: '600',
  },
  costValue: {
    fontSize: 15,
    fontWeight: '700',
  },
  costDetails: {
    marginTop: 16,
  },
  detailSection: {
    marginBottom: 16,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  detailTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  detailName: {
    fontSize: 13,
    flex: 1,
  },
  detailAmount: {
    fontSize: 13,
    fontWeight: '600',
  },
  simulationCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    marginBottom: 12,
  },
  simulationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  simulationTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 10,
  },
  simulationResult: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  simulationText: {
    fontSize: 14,
    marginBottom: 6,
    lineHeight: 20,
  },
  recommendationCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  recommendationContent: {
    marginLeft: 12,
    flex: 1,
  },
  recommendationTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  recommendationDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 16,
    marginTop: 8,
    shadowColor: '#A78BFA',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  exportButtonText: {
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
    marginTop: 20,
    marginBottom: 10,
  },
  errorMessage: {
    fontSize: 16,
    textAlign: 'center',
  },
});