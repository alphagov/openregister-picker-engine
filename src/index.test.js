/* global test, expect, jest */
jest.mock('jquery')
const $ = require('jquery')
const index = require('./index')
const locationPickerSuggestions = index.default

test('locationPickerSuggestions', (done) => {
  const suggest = locationPickerSuggestions('some-path.json')
  expect($.get).toBeCalled()
  expect($.get.mock.calls[0][0]).toEqual('some-path.json')
  expect(typeof suggest).toEqual('function')
  const suggestResult = suggest('something', (results) => {
    expect(results).toEqual([])
    done()
  })
  expect(suggestResult).toEqual(undefined)
})
