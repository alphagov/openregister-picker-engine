/* global beforeAll, describe, expect, jest, test */
jest.mock('../lib/fetch', () => require('fetch'))
jest.mock('./engine', () => (
  Object.assign(
    jest.fn(function () {
      this.search = jest.fn((query, callback) => {
        switch (query) {
          case 'un':
            callback(['United Kingdom'])
            break
          case 'gre':
            callback(['Great Britain'])
            break
          case 'uk':
            callback(['Ukraine', 'UK', 'United Kingdom'])
            break
          default:
            callback([])
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
})

describe('createSuggestionEngine', () => {
  let suggest

  beforeAll((done) => {
    suggest = locationPickerSuggestions('some-path.json', done)
  })

  test('suggests nothing for empty query', (done) => {
    suggest('', (results) => {
      expect(results).toEqual([])
      done()
    })
  })

  test('suggests a country', (done) => {
    suggest('un', (results) => {
      expect(results).toEqual([
        {name: 'United Kingdom', path: ''}
      ])
      done()
    })
  })

  test('suggests a country with a path', (done) => {
    suggest('gre', (results) => {
      expect(results).toEqual([
        {name: 'United Kingdom', path: 'Great Britain'}
      ])
      done()
    })
  })

  test('suggests countries with correct ordering', (done) => {
    suggest('uk', (results) => {
      expect(results).toEqual([
        {name: 'United Kingdom', path: 'UK'},
        {name: 'Ukraine', path: ''}
      ])
      done()
    })
  })
})
