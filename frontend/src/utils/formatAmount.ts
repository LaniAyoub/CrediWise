export const formatAmount = (n: number): string =>
  new Intl.NumberFormat('fr-TN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n) + ' DT';
