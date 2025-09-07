// Pure helper to format currency values for use in tests and Node environments
function formatCurrencyValue(valueEUR, currency = 'EUR', rate = 1, locale = 'en-IE'){
  const num = Number(valueEUR);
  if (isNaN(num)) return '';
  if(currency === 'USD'){
    const converted = num * Number(rate || 1);
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(converted);
  }
  return new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' }).format(num);
}

module.exports = { formatCurrencyValue };
