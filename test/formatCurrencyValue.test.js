const { formatCurrencyValue } = require('../lib/formatCurrencyValue');

test('formats EUR', () => {
  expect(formatCurrencyValue(100, 'EUR')).toMatch(/€|EUR/);
});

test('formats USD with rate', () => {
  const out = formatCurrencyValue(100, 'USD', 1.2);
  expect(out).toContain('$');
});
