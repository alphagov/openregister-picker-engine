# Openregister Picker Engine

[![Build Status](https://travis-ci.org/alphagov/openregister-picker-engine.svg?branch=master)](https://travis-ci.org/alphagov/openregister-picker-engine)

`openregister-picker-engine` is a JavaScript autocomplete engine. It's designed to interface an autocomplete widget (such as [accessible-typeahead](https://github.com/alphagov/accessible-typeahead) or [corejs-typeahead](https://github.com/corejavascript/typeahead.js)) with data from the [openregister](http://www.openregister.org/).

## Installation / Usage

### As a node module

Install it using `npm` / `yarn`:

```bash
npm install --save openregister-picker-engine
```

Then use it:

```js
import openregisterPickerEngine from 'openregister-picker-engine'

const suggest = openregisterPickerEngine({ url: '/public/data/location-picker-graph.json' })
```

## API Documentation

### `openregisterPickerEngine(options)`

#### `options.url`

Type: `string`

The path to the OpenRegister data file.

#### `options.fallback`

Type: `function`

An optional function that will be used as the `suggest` in the meantime until the graph loads or in the event that the graph fails to load.

#### `options.callback`

Type: `function`

An optional callback that will be executed when the graph has successfully finished loading and parsing.

#### `options.additionalEntries`

Type: `array`

An optional array to provide the engine with additional canonical entries. The array should look like this:

```js
[
  { name: 'Atlantis', code: 'country:AN' },
  { name: 'Principality of Dorne', code: 'territory:DR' }
]
```

Where `name` is the searchable name of the entry and `code` is the primary key for the node.

#### `options.additionalSynonyms`

Type: `array`

An optional array to provide the engine with additional synonyms to use when searching for entries. The array should look like this:

```js
[
  { name: 'Albion', code: 'country:GB' },
  { name: 'The Beautiful Country', code: 'country:IT' },
]
```

Where `name` is the searchable name of the synonym and `code` is the primary key for the node.

### `suggest(query, syncResults)`

#### `query`

Type: `string`

The query to search for in the data file graph.

#### `syncResults`

Type: `function`

A function that will be called synchronously with the results from the provided query. The results will be an array of objects:

```js
{
  name: string,
  path: string
}
```

The `name` is the canonical node of the graph node to display.

The `path` is an optional string specifying the last node that the engine had to pass through to reach the canonical node.

For example, if you seed the engine with the data for the Location Picker, and search for `deut`:

```js
> const suggest = openregisterPickerEngine({ url: 'location-picker-graph.json' })
> suggest('deut', (results) => console.log(results))
[
  {
    name: 'Germany',
    path: 'Deutschland'
  }
]
```

This means that the location picker found 1 match for `deut`, which is `Germany` by way of its endonym `Deutschland`.

## How it works

`openregisterPickerEngine` will perform a fetch request to get the graph data file.

The graph data file is a single JSON object with keys that match this schema:

```json
{
  "country:GB": {
    "names": {
      "en-GB": "United Kingdom",
      "cy": "Y Deyrnas Unedig"
    },
    "meta": {
      "canonical": true,
      "canonical-mask": 1,
      "stable-name": true
    },
    "edges": {
      "from": []
    }
  }
}
```

- `country:GB` is the primary key for this node.
- `names` is an array that provides search strings in various locales. These are always displayable for canonical nodes but not necessarily for other nodes.
- `meta.canonical` specifies if this is a canonical end node, which is something that the user is allowed to choose.
- `meta['canonical-mask']` is not used.
- `meta['stable-name']` specifies if this node's names are user displayable. (This is currently incorrect and will be replaced with a new property)
- `edges` specifies any connections to other parts of the graph.
- `edges.from` is an array of inbound nodes from this node, specified by their string primary keys.

This graph is turned into a reverse mapping of all of its `name` keys to their primary key. The keys of this reverse map are fed as seed data to a [Bloodhound instance](https://github.com/corejavascript/typeahead.js/blob/c93a8b5ccd21f443268701b8e84def50d18c9b1d/doc/bloodhound.md).

The `openregisterPickerEngine` function will return a `suggest` function. When this function is called with a query, that query is passed to the Bloodhound instance. This will search in all the available names and return an array of ones that match the query. These names are passed back into the reverse map to turn them into objects consisting of the matched name and the corresponding primary key.

These primary keys are then matched to their canonical primary keys by traversing the graph, and weighed based on their type of match and distance from the canonical node. The resulting objects are ordered, simplified, and sent back through the `syncResults` callback.

## License

[MIT](LICENSE.txt).
