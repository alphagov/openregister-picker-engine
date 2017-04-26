/* global expect, test */
const uniq = require('./uniq').default

test('uniq', () => {
  const arr = [1, 2, 2, 3]
  expect(uniq(arr)).toEqual([1, 2, 3])
})

test('uniq by string', () => {
  const arr = [{ value: 1 }, { value: 2 }, { value: 2 }, { value: 3 }]
  expect(uniq(arr, 'value')).toEqual([{ value: 1 }, { value: 2 }, { value: 3 }])
})

test('uniq by function', () => {
  const arr = [{ value: 1 }, { value: 2 }, { value: 2 }, { value: 3 }]
  expect(uniq(arr, (x) => x.value)).toEqual([{ value: 1 }, { value: 2 }, { value: 3 }])
})
