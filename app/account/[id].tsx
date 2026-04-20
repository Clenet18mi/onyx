import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Icons from 'lucide-react-native';
import { useAccountStore, useTransactionStore, useConfigStore, useSettingsStore } from '@/stores';
import { formatCurrency, formatDate, displayAmount, safeParseISO } from '@/utils/format';
import { Transaction, ACCOUNT_TYPES } from '@/types';
import { GlassCard } from '@/components/ui/GlassCard';
import { SwipeableTransactionRow } from '@/components/ui/SwipeableTransactionRow';
import { useTheme } from '@/hooks/useTheme';

export default function AccountDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { theme } = useTheme();
  const { colors } = theme;
  const account = useAccountStore((state) => state.getAccount(id || ''));
  const getCategoryById = useConfigStore((state) => state.getCategoryById);
  const getTransactionsByAccount = useTransactionStore((state) => state.getTransactionsByAccount);
  const deleteTransaction = useTransactionStore((state) => state.deleteTransaction);
  const hapticEnabled = useSettingsStore((state) => state.hapticEnabled);
  const privacyMode = useSettingsStore((state) => state.privacyMode ?? false);
  const currency = useSettingsStore((state) => state.currency);
  const locale = useSettingsStore((state) => state.locale);
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const transactions = useMemo(() => (id ? getTransactionsByAccount(id).sort((a, b) => (safeParseISO(b.date)?.getTime() ?? 0) - (safeParseISO(a.date)?.getTime() ?? 0)) : []), [id, getTransactionsByAccount]);
  const filteredTransactions = useMemo(() => { const q = searchQuery.trim().toLowerCase(); if (!q) return transactions; return transactions.filter((t) => { const desc = (t.description || '').toLowerCase(); if (desc.includes(q)) return true; const amountStr = t.amount.toString(); const amountFormatted = formatCurrency(t.amount).replace(/\s/g, ''); if (amountStr.includes(q) || amountFormatted.replace(',', '.').includes(q)) return true; const num = parseFloat(q.replace(',', '.')); return !isNaN(num) && (t.amount === num || amountStr.startsWith(q)); }); }, [transactions, searchQuery]);

  if (!account) {
    return (<LinearGradient colors={colors.gradients.card} className="flex-1 items-center justify-center"><Text style={{ color: colors.text.primary }}>Compte non trouvé</Text><TouchableOpacity onPress={() => router.back()} className="mt-4 px-6 py-2 rounded-xl" style={{ backgroundColor: colors.accent.primary }}><Text style={{ color: '#fff', fontWeight: '600' }}>Retour</Text></TouchableOpacity></LinearGradient>);
  }

  const getIcon = (iconName: string) => (Icons as any)[iconName] || Icons.Wallet;
  const AccountIcon = getIcon(account.icon);
  const accountType = ACCOUNT_TYPES.find((t) => t.id === account.type);
  const renderTransaction = ({ item }: { item: Transaction }) => { const category = getCategoryById(item.category); const CategoryIcon = category ? (Icons as any)[category.icon] : Icons.CircleDot; const isIncome = item.type === 'income'; const isTransfer = item.type === 'transfer'; const isOutgoing = item.accountId === id && isTransfer; let amountColor = isIncome ? colors.accent.success : colors.accent.danger; let amountPrefix = isIncome ? '+' : '-'; if (isTransfer) { amountColor = isOutgoing ? colors.accent.danger : colors.accent.success; amountPrefix = isOutgoing ? '-' : '+'; } const description = item.description || category?.label || 'Transaction'; const deleteLabel = `Supprimer « ${description} » (${amountPrefix}${displayAmount(item.amount, privacyMode, currency, locale)}) ?`; return (<SwipeableTransactionRow onPress={() => router.push(`/transaction/${item.id}`)} onDelete={() => deleteTransaction(item.id)} deleteLabel={deleteLabel} hapticEnabled={hapticEnabled}><View className="flex-row items-center py-3" style={{ borderBottomWidth: 1, borderBottomColor: colors.background.tertiary }}><View className="w-10 h-10 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: `${category?.color || colors.text.secondary}20` }}><CategoryIcon size={20} color={category?.color || colors.text.secondary} /></View><View className="flex-1"><Text style={{ color: colors.text.primary, fontSize: 16, fontWeight: '600' }} numberOfLines={1}>{description}</Text><Text className="text-sm" style={{ color: colors.text.secondary }}>{formatDate(item.date)}</Text></View><Text className="text-base font-semibold" style={{ color: amountColor }}>{amountPrefix}{displayAmount(item.amount, privacyMode, currency, locale)}</Text></View></SwipeableTransactionRow>); };
  const stats = useMemo(() => { const income = filteredTransactions.filter((t) => t.type !== 'transfer' && t.type === 'income' && t.accountId === id).reduce((sum, t) => sum + t.amount, 0); const expenses = filteredTransactions.filter((t) => t.type !== 'transfer' && t.type === 'expense' && t.accountId === id).reduce((sum, t) => sum + t.amount, 0); return { income, expenses }; }, [filteredTransactions, id]);
  const summaryNet = stats.income - stats.expenses;

  return (
    <LinearGradient colors={colors.gradients.card} className="flex-1">
      <SafeAreaView className="flex-1">
        <View className="flex-row items-center px-6 py-4">
          <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 rounded-full items-center justify-center mr-4" style={{ backgroundColor: colors.background.secondary, borderWidth: 1, borderColor: colors.background.tertiary }}><Icons.ChevronLeft size={24} color={colors.text.primary} /></TouchableOpacity>
          {!searchVisible ? (<><Text style={{ color: colors.text.primary, fontSize: 20, fontWeight: '700', flex: 1 }}>{account.name}</Text><TouchableOpacity onPress={() => setSearchVisible(true)} className="w-10 h-10 rounded-full items-center justify-center mr-2" style={{ backgroundColor: colors.background.secondary, borderWidth: 1, borderColor: colors.background.tertiary }}><Icons.Search size={22} color={colors.text.primary} /></TouchableOpacity><TouchableOpacity onPress={() => router.push(`/transaction/add?accountId=${id}`)} className="w-10 h-10 rounded-full items-center justify-center" style={{ backgroundColor: `${colors.accent.primary}20` }}><Icons.Plus size={24} color={colors.accent.primary} /></TouchableOpacity></>) : (<><TextInput value={searchQuery} onChangeText={setSearchQuery} placeholder="Description ou montant..." placeholderTextColor={colors.text.tertiary} className="flex-1 px-4 py-2 rounded-xl mr-2" style={{ backgroundColor: colors.background.secondary, color: colors.text.primary, borderWidth: 1, borderColor: colors.background.tertiary }} autoFocus /><TouchableOpacity onPress={() => { setSearchQuery(''); setSearchVisible(false); }} className="w-10 h-10 rounded-full items-center justify-center" style={{ backgroundColor: colors.background.secondary, borderWidth: 1, borderColor: colors.background.tertiary }}><Icons.X size={22} color={colors.text.primary} /></TouchableOpacity></>)}
        </View>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <View className="px-6 mb-6"><GlassCard variant="light"><View className="items-center py-4"><View className="w-16 h-16 rounded-2xl items-center justify-center mb-4" style={{ backgroundColor: `${account.color}20` }}><AccountIcon size={32} color={account.color} /></View><Text className="text-sm mb-1" style={{ color: colors.text.secondary }}>{accountType?.label || 'Compte'}</Text><Text className="text-4xl font-bold" style={{ color: account.balance >= 0 ? colors.text.primary : colors.accent.danger }}>{displayAmount(account.balance, privacyMode, currency, locale)}</Text></View></GlassCard></View>
          <View className="px-6 mb-6 flex-row" style={{ gap: 12 }}><View className="flex-1 p-4 rounded-2xl" style={{ backgroundColor: `${colors.accent.success}12`, borderWidth: 1, borderColor: `${colors.accent.success}20` }}><View className="flex-row items-center mb-2"><Icons.TrendingUp size={16} color={colors.accent.success} /><Text className="text-sm ml-2" style={{ color: colors.text.secondary }}>Entrées</Text></View><Text className="text-lg font-semibold" style={{ color: colors.accent.success }}>{privacyMode ? displayAmount(stats.income, true, currency, locale) : `+${formatCurrency(stats.income)}`}</Text></View><View className="flex-1 p-4 rounded-2xl" style={{ backgroundColor: `${colors.accent.danger}12`, borderWidth: 1, borderColor: `${colors.accent.danger}20` }}><View className="flex-row items-center mb-2"><Icons.TrendingDown size={16} color={colors.accent.danger} /><Text className="text-sm ml-2" style={{ color: colors.text.secondary }}>Sorties</Text></View><Text className="text-lg font-semibold" style={{ color: colors.accent.danger }}>{privacyMode ? displayAmount(stats.expenses, true, currency, locale) : `-${formatCurrency(stats.expenses)}`}</Text></View></View>

          <View className="px-6"><Text className="text-lg font-semibold mb-4" style={{ color: colors.text.primary }}>Historique</Text>{filteredTransactions.length > 0 ? (<View className="flex-row items-center justify-between mb-3 py-2 px-3 rounded-xl" style={{ backgroundColor: colors.background.secondary, borderWidth: 1, borderColor: colors.background.tertiary }}><Text className="text-sm" style={{ color: colors.text.secondary }}>{filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? 's' : ''} • <Text style={{ color: summaryNet >= 0 ? colors.accent.success : colors.accent.danger }}>{summaryNet >= 0 ? '+' : ''}{displayAmount(summaryNet, privacyMode, currency, locale)}</Text></Text></View>) : null}{filteredTransactions.length === 0 ? (<View className="items-center py-12"><Icons.Receipt size={48} color={colors.text.tertiary} /><Text className="text-base mt-4 text-center" style={{ color: colors.text.secondary }}>{searchQuery.trim() ? 'Aucun résultat' : 'Aucune transaction'}</Text></View>) : filteredTransactions.map((transaction) => (<View key={transaction.id}>{renderTransaction({ item: transaction })}</View>))}</View>

          <View className="h-24" />
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
