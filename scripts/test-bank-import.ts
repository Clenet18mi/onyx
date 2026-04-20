import { parseBankCsvRaw, summarizeBankRows, suggestBankImportAccountId, buildBankImportReconciliation } from '../utils/bankCsvImportCore';

const sampleCsv = `Date de comptabilisation;Libelle simplifie;Libelle operation;Reference;Informations complementaires;Type operation;Categorie;Sous categorie;Debit;Credit;Date operation;Date de valeur;Pointage operation
18/04/2026;SNCF-VOYAGEURS;CB SNCF-VOYAGEURS FACT 160426;;;Carte bancaire;Transports;Trains, avions et ferrys;-230,00;;16/04/2026;18/04/2026;0
16/04/2026;MLE OCEANE PETITGAS;VIR INST MLE OCEANE PETITGAS;2610617I40111024;2610617I40111024          26106R-019d96e299a3745c82620dcdfc465c60;Virement recu;A categoriser - rentree d'argent;Virement recu - a categoriser;;+115,00;16/04/2026;16/04/2026;0`;

const rows = parseBankCsvRaw(sampleCsv);
const summary = summarizeBankRows(rows);
const accountId = suggestBankImportAccountId(
  [
    { id: 'a1', type: 'savings', isArchived: false },
    { id: 'a2', type: 'checking', isArchived: false },
  ],
  'a2'
);
const reconciliation = buildBankImportReconciliation(1000, summary.typeBreakdown.income - summary.typeBreakdown.expense, 1200);

if (rows.length !== 2) throw new Error(`Expected 2 rows, got ${rows.length}`);
if (summary.typeBreakdown.expense !== 1 || summary.typeBreakdown.income !== 1) throw new Error('Unexpected type breakdown');
if (accountId !== 'a2') throw new Error(`Expected checking account suggestion, got ${accountId}`);
if (!Number.isFinite(reconciliation.adjustment)) throw new Error('Reconciliation should be finite');

console.log('bank import smoke test passed');
