/* global test, expect */
const locationPickerSuggestions = require('./index').default

test('basic test', () => {
  expect(typeof locationPickerSuggestions).toBe('function')
})
