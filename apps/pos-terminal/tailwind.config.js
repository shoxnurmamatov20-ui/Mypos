const { tailwindPreset } = require('@mypos/design-tokens/tailwind');

module.exports = {
  presets: [require('nativewind/preset'), tailwindPreset],
  content: ['./app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
};
