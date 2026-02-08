/**
 * Genera una barra di progresso a terminale
 * @param percentage Percentuale completata (0-100)
 * @param length Lunghezza totale della barra in caratteri. Default: 20
 * @returns Stringa rappresentante la barra di progresso
 */
export const renderProgressBar = (percentage: number, length = 20): string => {
  const filledLength = Math.round((length * percentage) / 100);
  const emptyLength = length - filledLength;
  const filled = "█".repeat(filledLength);
  const empty = "░".repeat(emptyLength);
  return `[${filled}${empty}]`;
};
