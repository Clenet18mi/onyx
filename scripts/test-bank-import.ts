import { parseBankCsvRaw, summarizeBankRows, suggestBankImportAccountId, buildBankImportReconciliation } from '../utils/bankCsvImportCore';

const fixtures = [
  {
    name: 'basic bank csv',
    csv: `Date de comptabilisation;Libelle simplifie;Libelle operation;Reference;Informations complementaires;Type operation;Categorie;Sous categorie;Debit;Credit;Date operation;Date de valeur;Pointage operation
18/04/2026;SNCF-VOYAGEURS;CB SNCF-VOYAGEURS FACT 160426;;;Carte bancaire;Transports;Trains, avions et ferrys;-230,00;;16/04/2026;18/04/2026;0
16/04/2026;MLE OCEANE PETITGAS;VIR INST MLE OCEANE PETITGAS;2610617I40111024;2610617I40111024          26106R-019d96e299a3745c82620dcdfc465c60;Virement recu;A categoriser - rentree d'argent;Virement recu - a categoriser;;+115,00;16/04/2026;16/04/2026;0`,
    rows: 2,
    expense: 1,
    income: 1,
  },
  {
    name: 'quoted values and commas',
    csv: `Date de comptabilisation;Libelle simplifie;Libelle operation;Reference;Informations complementaires;Type operation;Categorie;Sous categorie;Debit;Credit;Date operation;Date de valeur;Pointage operation
18/04/2026;"MARCHE, LE";"CB MARCHE, LE FACT 180426";;"Paiement carte";Carte bancaire;Alimentation;Hyper/supermarche;"-16,30";;18/04/2026;18/04/2026;0
18/04/2026;"VIR. VERS COMPTE";"VIREMENT INTERNE";;"Interne";Virement;Transaction exclue;Virement interne;-900,00;;18/04/2026;18/04/2026;0`,
    rows: 2,
    expense: 1,
    transfer: 1,
  },
  {
    name: 'same target account suggestion',
    csv: `Date de comptabilisation;Libelle simplifie;Libelle operation;Reference;Informations complementaires;Type operation;Categorie;Sous categorie;Debit;Credit;Date operation;Date de valeur;Pointage operation
01/01/2026;TEST;TEST;;;;Alimentation;Restaurant;-1,00;;01/01/2026;01/01/2026;0`,
    rows: 1,
  },
];

for (const fixture of fixtures) {
  const rows = parseBankCsvRaw(fixture.csv);
  const summary = summarizeBankRows(rows);
  if (rows.length !== fixture.rows) throw new Error(`${fixture.name}: expected ${fixture.rows} rows, got ${rows.length}`);
  if (fixture.expense != null && summary.typeBreakdown.expense !== fixture.expense) throw new Error(`${fixture.name}: unexpected expense count`);
  if (fixture.income != null && summary.typeBreakdown.income !== fixture.income) throw new Error(`${fixture.name}: unexpected income count`);
  if (fixture.transfer != null && summary.typeBreakdown.transfer !== fixture.transfer) throw new Error(`${fixture.name}: unexpected transfer count`);
}

const accountId = suggestBankImportAccountId(
  [
    { id: 'a1', type: 'savings', isArchived: false },
    { id: 'a2', type: 'checking', isArchived: false },
  ],
  'a2'
);
if (accountId !== 'a2') throw new Error(`Expected checking account suggestion, got ${accountId}`);

const reconciliation = buildBankImportReconciliation(1000, 115 - 230, 1200);
if (!Number.isFinite(reconciliation.adjustment)) throw new Error('Reconciliation should be finite');

console.log('bank import smoke test passed');
