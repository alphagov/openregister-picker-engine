/* global describe, expect, jest, test */
jest.mock('../lib/fetch', () => require('fetch'))
jest.mock('corejs-typeahead/dist/bloodhound.js', () => (
  Object.assign(
    jest.fn(function () {
      this.search = jest.fn((query, callback) => {
        switch (query) {
          case 'whatever':
            callback([])
            break
          case 'un':
            callback(['United Kingdom'])
            break
          case 'gre':
            callback(['Great Britain'])
            break
        }
      })
    })
    , {
      tokenizers: {
        nonword: jest.fn(),
        whitespace: jest.fn()
      }
    }
  )
))
const locationPickerSuggestions = require('./index').default

describe('locationPickerSuggestions', () => {
  test('returns a suggestion function', (done) => {
    const suggest = locationPickerSuggestions('some-path.json')
    expect(typeof suggest).toEqual('function')
    const suggestResult = suggest('whatever', (results) => {
      expect(results).toEqual([])
      done()
    })
    expect(suggestResult).toEqual(undefined)
  })

  test('suggests a country', (done) => {
    const suggest = locationPickerSuggestions('some-path.json', () => {
      suggest('un', (results) => {
        expect(results).toEqual(['United Kingdom'])
        done()
      })
    })
  })

  test('suggests a country with a path', (done) => {
    const suggest = locationPickerSuggestions('some-path.json', () => {
      suggest('gre', (results) => {
        expect(results).toEqual(['United Kingdom (Great Britain)'])
        done()
      })
    })
  })
})
