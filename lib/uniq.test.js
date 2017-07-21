/* global expect, test */
const uniq = require('./uniq').default

test('uniqs an empty array', () => {
  const arr = []
  expect(uniq(arr, (x) => x.value)).toEqual([])
})

test('uniq by function', () => {
  const arr = [{ value: 1 }, { value: 2 }, { value: 2 }, { value: 3 }]
  expect(uniq(arr, (x) => x.value)).toEqual([{ value: 1 }, { value: 2 }, { value: 3 }])
})
