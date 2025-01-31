// ============================================
// ONYX - PDF Export Utility
// Génération de relevés PDF élégants
// ============================================

import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { format, parseISO, startOfMonth, endOfMonth } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Transaction, Account, CATEGORIES } from '@/types';

interface ExportData {
  transactions: Transaction[];
  accounts: Account[];
  month: Date;
  totalIncome: number;
  totalExpense: number;
  totalBalance: number;
}

// Générer le HTML du relevé
function generatePDFHTML(data: ExportData): string {
  const monthName = format(data.month, 'MMMM yyyy', { locale: fr });
  const monthNameCapitalized = monthName.charAt(0).toUpperCase() + monthName.slice(1);
  
  // Grouper les transactions par date
  const transactionsByDate: { [key: string]: Transaction[] } = {};
  data.transactions.forEach(tx => {
    const dateKey = format(parseISO(tx.date), 'dd/MM/yyyy');
    if (!transactionsByDate[dateKey]) {
      transactionsByDate[dateKey] = [];
    }
    transactionsByDate[dateKey].push(tx);
  });

  // Générer les lignes de transactions
  const transactionRows = Object.entries(transactionsByDate)
    .sort((a, b) => {
      const dateA = a[1][0]?.date || '';
      const dateB = b[1][0]?.date || '';
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    })
    .map(([date, txs]) => {
      const dayTotal = txs.reduce((sum, tx) => {
        if (tx.type === 'income') return sum + tx.amount;
        if (tx.type === 'expense') return sum - tx.amount;
        return sum;
      }, 0);
      
      const txRows = txs.map(tx => {
        const category = CATEGORIES.find(c => c.id === tx.category);
        const account = data.accounts.find(a => a.id === tx.accountId);
        const isIncome = tx.type === 'income';
        const isTransfer = tx.type === 'transfer';
        
        let amountDisplay = '';
        let amountColor = '#EF4444';
        
        if (isIncome) {
          amountDisplay = `+${tx.amount.toFixed(2)} €`;
          amountColor = '#10B981';
        } else if (isTransfer) {
          amountDisplay = `${tx.amount.toFixed(2)} €`;
          amountColor = '#6366F1';
        } else {
          amountDisplay = `-${tx.amount.toFixed(2)} €`;
          amountColor = '#EF4444';
        }
        
        return `
          <tr>
            <td style="padding: 12px 8px; border-bottom: 1px solid #27272A;">
              ${format(parseISO(tx.date), 'HH:mm')}
            </td>
            <td style="padding: 12px 8px; border-bottom: 1px solid #27272A;">
              <strong>${tx.description || category?.label || 'Transaction'}</strong>
              <br><span style="color: #71717A; font-size: 12px;">${category?.label || ''} • ${account?.name || ''}</span>
            </td>
            <td style="padding: 12px 8px; border-bottom: 1px solid #27272A; text-align: right; color: ${amountColor}; font-weight: 600;">
              ${amountDisplay}
            </td>
          </tr>
        `;
      }).join('');
      
      return `
        <tr style="background: rgba(99, 102, 241, 0.1);">
          <td colspan="3" style="padding: 8px; font-weight: 600; color: #A1A1AA;">
            ${date}
            <span style="float: right; color: ${dayTotal >= 0 ? '#10B981' : '#EF4444'};">
              ${dayTotal >= 0 ? '+' : ''}${dayTotal.toFixed(2)} €
            </span>
          </td>
        </tr>
        ${txRows}
      `;
    }).join('');

  // Statistiques par catégorie
  const categoryStats: { [key: string]: number } = {};
  data.transactions
    .filter(tx => tx.type === 'expense')
    .forEach(tx => {
      categoryStats[tx.category] = (categoryStats[tx.category] || 0) + tx.amount;
    });
  
  const categoryRows = Object.entries(categoryStats)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([catId, amount]) => {
      const category = CATEGORIES.find(c => c.id === catId);
      const percentage = data.totalExpense > 0 ? (amount / data.totalExpense * 100) : 0;
      return `
        <tr>
          <td style="padding: 8px;">${category?.label || catId}</td>
          <td style="padding: 8px; text-align: right;">${amount.toFixed(2)} €</td>
          <td style="padding: 8px; text-align: right; color: #71717A;">${percentage.toFixed(1)}%</td>
        </tr>
      `;
    }).join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Relevé ONYX - ${monthNameCapitalized}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background: #0A0A0B;
      color: #F4F4F5;
      padding: 40px;
      line-height: 1.5;
    }
    
    .container {
      max-width: 800px;
      margin: 0 auto;
    }
    
    .header {
      text-align: center;
      margin-bottom: 40px;
      padding-bottom: 30px;
      border-bottom: 2px solid #27272A;
    }
    
    .logo {
      font-size: 32px;
      font-weight: 700;
      color: #6366F1;
      margin-bottom: 8px;
    }
    
    .subtitle {
      color: #71717A;
      font-size: 14px;
    }
    
    .month-title {
      font-size: 28px;
      font-weight: 700;
      margin-top: 20px;
    }
    
    .summary {
      display: flex;
      gap: 20px;
      margin-bottom: 40px;
    }
    
    .summary-card {
      flex: 1;
      background: #1F1F23;
      border-radius: 16px;
      padding: 24px;
      text-align: center;
    }
    
    .summary-label {
      color: #71717A;
      font-size: 14px;
      margin-bottom: 8px;
    }
    
    .summary-value {
      font-size: 28px;
      font-weight: 700;
    }
    
    .summary-value.income { color: #10B981; }
    .summary-value.expense { color: #EF4444; }
    .summary-value.balance { color: #6366F1; }
    
    .section {
      margin-bottom: 40px;
    }
    
    .section-title {
      font-size: 20px;
      font-weight: 600;
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      background: #1F1F23;
      border-radius: 12px;
      overflow: hidden;
    }
    
    th {
      text-align: left;
      padding: 12px 8px;
      background: #27272A;
      color: #A1A1AA;
      font-weight: 600;
      font-size: 12px;
      text-transform: uppercase;
    }
    
    td {
      padding: 12px 8px;
      color: #F4F4F5;
      font-size: 14px;
    }
    
    .footer {
      text-align: center;
      padding-top: 30px;
      border-top: 1px solid #27272A;
      color: #52525B;
      font-size: 12px;
    }
    
    .accounts-list {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      margin-bottom: 40px;
    }
    
    .account-badge {
      background: #1F1F23;
      border-radius: 12px;
      padding: 16px 20px;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    .account-name {
      font-weight: 500;
    }
    
    .account-balance {
      font-weight: 700;
      color: #10B981;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">💎 ONYX</div>
      <div class="subtitle">Relevé de compte personnel</div>
      <div class="month-title">${monthNameCapitalized}</div>
    </div>
    
    <div class="summary">
      <div class="summary-card">
        <div class="summary-label">Revenus</div>
        <div class="summary-value income">+${data.totalIncome.toFixed(2)} €</div>
      </div>
      <div class="summary-card">
        <div class="summary-label">Dépenses</div>
        <div class="summary-value expense">-${data.totalExpense.toFixed(2)} €</div>
      </div>
      <div class="summary-card">
        <div class="summary-label">Solde</div>
        <div class="summary-value balance">${(data.totalIncome - data.totalExpense).toFixed(2)} €</div>
      </div>
    </div>
    
    <div class="section">
      <div class="section-title">📊 Répartition par catégorie</div>
      <table>
        <thead>
          <tr>
            <th>Catégorie</th>
            <th style="text-align: right;">Montant</th>
            <th style="text-align: right;">Part</th>
          </tr>
        </thead>
        <tbody>
          ${categoryRows}
        </tbody>
      </table>
    </div>
    
    <div class="section">
      <div class="section-title">📝 Détail des transactions (${data.transactions.length})</div>
      <table>
        <thead>
          <tr>
            <th style="width: 80px;">Heure</th>
            <th>Description</th>
            <th style="width: 120px; text-align: right;">Montant</th>
          </tr>
        </thead>
        <tbody>
          ${transactionRows}
        </tbody>
      </table>
    </div>
    
    <div class="footer">
      <p>Document généré par ONYX le ${format(new Date(), "d MMMM yyyy 'à' HH:mm", { locale: fr })}</p>
      <p>100% Offline • Vos données restent privées</p>
    </div>
  </div>
</body>
</html>
  `;
}

export async function exportToPDF(
  transactions: Transaction[],
  accounts: Account[],
  selectedMonth: Date
): Promise<void> {
  const monthStart = startOfMonth(selectedMonth);
  const monthEnd = endOfMonth(selectedMonth);
  
  // Filtrer les transactions du mois
  const monthTransactions = transactions.filter(tx => {
    const txDate = parseISO(tx.date);
    return txDate >= monthStart && txDate <= monthEnd;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  // Calculer les totaux
  const totalIncome = monthTransactions
    .filter(tx => tx.type === 'income')
    .reduce((sum, tx) => sum + tx.amount, 0);
  
  const totalExpense = monthTransactions
    .filter(tx => tx.type === 'expense')
    .reduce((sum, tx) => sum + tx.amount, 0);
  
  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);
  
  // Générer le HTML
  const html = generatePDFHTML({
    transactions: monthTransactions,
    accounts,
    month: selectedMonth,
    totalIncome,
    totalExpense,
    totalBalance,
  });
  
  // Sauvegarder le fichier HTML (qui peut être ouvert comme PDF)
  const monthStr = format(selectedMonth, 'yyyy-MM', { locale: fr });
  const fileName = `ONYX_Releve_${monthStr}.html`;
  const filePath = `${FileSystem.documentDirectory}${fileName}`;
  
  await FileSystem.writeAsStringAsync(filePath, html, {
    encoding: FileSystem.EncodingType.UTF8,
  });
  
  // Partager
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(filePath, {
      mimeType: 'text/html',
      dialogTitle: `Relevé ONYX - ${format(selectedMonth, 'MMMM yyyy', { locale: fr })}`,
      UTI: 'public.html',
    });
  }
}

export async function exportToCSV(
  transactions: Transaction[],
  accounts: Account[]
): Promise<void> {
  const headers = ['Date', 'Heure', 'Type', 'Catégorie', 'Montant', 'Description', 'Compte'];
  
  const rows = transactions.map(tx => {
    const account = accounts.find(a => a.id === tx.accountId);
    const category = CATEGORIES.find(c => c.id === tx.category);
    const txDate = parseISO(tx.date);
    
    return [
      format(txDate, 'dd/MM/yyyy'),
      format(txDate, 'HH:mm'),
      tx.type === 'income' ? 'Revenu' : tx.type === 'expense' ? 'Dépense' : 'Virement',
      category?.label || tx.category,
      tx.amount.toFixed(2),
      tx.description || '',
      account?.name || '',
    ].join(';');
  });
  
  const csv = [headers.join(';'), ...rows].join('\n');
  
  const fileName = `ONYX_Export_${format(new Date(), 'yyyy-MM-dd')}.csv`;
  const filePath = `${FileSystem.documentDirectory}${fileName}`;
  
  await FileSystem.writeAsStringAsync(filePath, csv, {
    encoding: FileSystem.EncodingType.UTF8,
  });
  
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(filePath, {
      mimeType: 'text/csv',
      dialogTitle: 'Exporter les données ONYX',
    });
  }
}
