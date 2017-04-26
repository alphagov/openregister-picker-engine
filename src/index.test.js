/* global describe, expect, jest, test */
jest.mock('jquery', () => ({
  get: jest.fn((path, callback) => {
    const graph = {
      'country:GB': {
        names: {
          'en-GB': 'United Kingdom',
          cy: 'Y Deyrnas Unedig'
        },
        meta: {
          canonical: true,
          'canonical-mask': 1,
          'stable-name': true
        },
        edges: {
          from: []
        }
      },
      'uk:GBN': {
        names: {
          'en-GB': 'Great Britain',
          cy: 'Gogledd Iwerddon'
        },
        meta: {
          canonical: false,
          'canonical-mask': 0,
          'stable-name': true
        },
        edges: {
          from: ['country:GB']
        }
      }
    }
    callback(graph)
  })
}))
jest.mock('corejs-typeahead', () => (
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
const $ = require('jquery')
const locationPickerSuggestions = require('./index').default

describe('locationPickerSuggestions', () => {
  test('calls external URL and returns a suggestion function', (done) => {
    const suggest = locationPickerSuggestions('some-path.json')
    expect($.get).toBeCalled()
    expect($.get.mock.calls[0][0]).toEqual('some-path.json')
    expect(typeof suggest).toEqual('function')
    const suggestResult = suggest('whatever', (results) => {
      expect(results).toEqual([])
      done()
    })
    expect(suggestResult).toEqual(undefined)
  })

  test('suggests a country', (done) => {
    const suggest = locationPickerSuggestions('some-path.json')
    suggest('un', (results) => {
      expect(results).toEqual(['United Kingdom'])
      done()
    })
  })

  test('suggests a country with a path', (done) => {
    const suggest = locationPickerSuggestions('some-path.json')
    suggest('gre', (results) => {
      expect(results).toEqual(['United Kingdom (Great Britain)'])
      done()
    })
  })
})
