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
const Engine = require('./engine')
const openregisterPickerEngine = require('./index')

describe('openregisterPickerEngine', () => {
  test('returns a suggestion function', (done) => {
    const suggest = openregisterPickerEngine({ url: 'some-path.json' })
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

  beforeAll((callback) => {
    suggest = openregisterPickerEngine({ url: 'some-path.json', callback })
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

  test('suggests using fallback when failing to fetch', (done) => {
    const fallback = (query, syncResults) => syncResults('fallback')
    suggest = openregisterPickerEngine({
      url: 'fail',
      fallback,
      callback: (err) => {
        expect(err).toEqual({ error: 'Failed to fetch URL' })
        suggest('uk', (results) => {
          expect(results).toEqual('fallback')
          done()
        })
      }
    })
  })
  
  test('passes synonyms to Engine', (done) => {
    openregisterPickerEngine({
      url: 'some-path.json',
      additionalSynonyms: [
        { name: 'Albion', code: 'country:GB' },
        { name: 'The Beautiful Country', code: 'country:IT' },
      ],
      callback: () => {
        const latestEngineCall = Engine.mock.calls[Engine.mock.calls.length - 1]
        expect(latestEngineCall).toMatchSnapshot()
        done()
      }
    })
  })
})
