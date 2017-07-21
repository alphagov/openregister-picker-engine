import Engine from './engine'
import Request from '../lib/request'
import uniqBy from '../lib/uniq'

var preferredLocale = 'en-GB'
var showPaths = true

function presentableName (node, locale) {
  var requestedName = node['names'][locale]
  var fallback = Object.keys(node['names']).map(k => node['names'][k])[0]
  return requestedName || fallback
}

function locationReverseMap (graph) {
  return Object.keys(graph)
    .reduce((revMap, curie) => {
      var node = graph[curie]
      Object.keys(node.names).forEach(locale => {
        var name = node.names[locale]
        var isntDefinedAndLocaleIsEnGb = !revMap[name] && locale === preferredLocale
        if (isntDefinedAndLocaleIsEnGb) {
          revMap[name] = { node, locale }
        }
      })
      return revMap
    }, {})
}

function isCanonicalNode (node) {
  return node.meta.canonical
}

// Given a starting node and the locale with which it was reached, this is a
// recursive function that will search the graph to find the canonical node(s).
function findCanonicalNodeWithPath (graph, node, locale, path) {
  if (locale === preferredLocale) {
    if (isCanonicalNode(node)) {
      // We found it.
      return [{ node, locale: preferredLocale, path }]
    } else {
      // Get all the linked nodes.
      var linkedNodes = node.edges.from.map(nodeFromCurie => graph[nodeFromCurie])
      // Find the canonical nodes for each one of them.
      return linkedNodes.reduce((canonicalNodes, linkedNode) => {
        return canonicalNodes.concat(findCanonicalNodeWithPath(
          graph,
          linkedNode,
          preferredLocale,
          path.concat([{ node, locale: preferredLocale }])
        ))
      }, [])
    }
  } else {
    // If not the preferredLocale, add a hop to the path while we switch
    // to the preferredLocale.
    return findCanonicalNodeWithPath(
      graph,
      node,
      preferredLocale,
      path.concat([{ node, locale }])
    )
  }
}

function indexOfLowerCase (str, prefix) {
  return str.toLowerCase().indexOf(prefix.toLowerCase())
}

// Takes a canonical node with the path to reach it, and the typed in query.
// Returns the same node and path, with added weight based on a number of criteria.
// Higher weight means higher priority, so it should be ranked higher in the list.
function addWeight (canonicalNodeWithPath, query) {
  const cnwp = canonicalNodeWithPath

  const name = presentableName(cnwp.node, preferredLocale)

  const synonym = cnwp.path
    .map(pathNode => presentableName(pathNode.node, pathNode.locale))
    .map(nameInPath => nameInPath.toLowerCase())
    .pop()

  const indexOfQuery = indexOfLowerCase(name, query)

  const isUk = name === 'United Kingdom'
  const isUs = name === 'United States'

  // Temporary country weighting
  const ukBias = 2
  const usBias = 1.5
  const defaultCountryBias = 1

  const isExactMatchToCanonicalName = name.toLowerCase() === query.toLowerCase()

  const canonicalNameStartsWithQuery = indexOfQuery === 0

  const wordInCanonicalNameStartsWithQuery = name
      .split(' ')
      .filter(w => w.toLowerCase().indexOf(query.toLowerCase()) === 0)
      .length > 0

  // TODO: make these const
  var synonymIsExactMatch = false
  var synonymStartsWithQuery = false
  var wordInSynonymStartsWith = false
  var indexOfSynonymQuery = false
  var synonymContainsQuery = false

  if (synonym) {
    synonymIsExactMatch = synonym === query.toLowerCase()

    synonymStartsWithQuery = synonym
      .indexOf(query.toLowerCase()) === 0

    wordInSynonymStartsWith = synonym
      .split(' ')
      .filter(w => w.toLowerCase().indexOf(query.toLowerCase()) === 0)
      .length > 0

    indexOfSynonymQuery = indexOfLowerCase(synonym, query)
  }

  // TODO: Contains consts don't work
  const canonicalNameContainsQuery = indexOfQuery > 0
  synonymContainsQuery = indexOfSynonymQuery > 0

  // Canonical name matches
  if (isExactMatchToCanonicalName) {
    cnwp.weight = 100
  } else if (canonicalNameStartsWithQuery) {
    cnwp.weight = 76
  } else if (wordInCanonicalNameStartsWithQuery) {
    cnwp.weight = 60
  } else if (synonymIsExactMatch) { // Synonmn matches
    cnwp.weight = 50
  } else if (synonymStartsWithQuery) {
    cnwp.weight = 45
  } else if (wordInSynonymStartsWith) {
    cnwp.weight = 37
  } else if (canonicalNameContainsQuery) { // Contains (DOES NOT WORK YET)
    cnwp.weight = 25
  } else if (synonymContainsQuery) {
    cnwp.weight = 22
  } else { // Not sure if else is possible
    cnwp.weight = 15
  }

  // Longer paths mean canonical node is further from matched synonym, so rank it lower.
  // TODO - pruning multiple matches should happen elsewhere
  cnwp.weight -= cnwp.path.length

  var countryBias = isUk ? ukBias : defaultCountryBias
  countryBias = isUs ? usBias : countryBias

  cnwp.weight *= countryBias

  return cnwp
}

function byWeightAndThenAlphabetically (a, b) {
  const aName = presentableName(a.node, preferredLocale)
  const bName = presentableName(b.node, preferredLocale)
  return (a.weight > b.weight)
    ? -1
    : (a.weight < b.weight)
      ? 1
      // Weights are equal, sort alphabetically by name.
      : (aName < bName)
        ? -1
        : (aName > bName)
          ? 1
          : 0
}

// Engine gives us back a list of results that includes synonyms, typos,
// endonyms and other things we don't want the user to see.
// This function transforms those into a list of stable canonical country names.
function presentResults (graph, reverseMap, rawResults, query) {
  var nodesWithLocales = rawResults.map(r => reverseMap[r])

  var canonicalNodesWithPaths = nodesWithLocales.reduce((canonicalNodes, nwl) => {
    return canonicalNodes.concat(findCanonicalNodeWithPath(graph, nwl.node, nwl.locale, []))
  }, [])

  const canonicalNodesWithPathsAndWeights = canonicalNodesWithPaths.map(cnwp => addWeight(cnwp, query))

  canonicalNodesWithPathsAndWeights.sort(byWeightAndThenAlphabetically)

  const uniqueNodesWithPathsAndWeights = uniqBy(canonicalNodesWithPathsAndWeights, (cnwp) => {
    return presentableName(cnwp.node, preferredLocale)
  })

  uniqueNodesWithPathsAndWeights.sort(byWeightAndThenAlphabetically)

  var presentableNodes = uniqueNodesWithPathsAndWeights.map(cnwp => {
    var canonicalName = presentableName(cnwp.node, preferredLocale)
    var pathToName = ''
    if (showPaths && cnwp.path.length) {
      var stableNamesInPath = cnwp.path
        .filter(pathNode => pathNode.node.meta['stable-name'])
        .map(pathNode => presentableName(pathNode.node, pathNode.locale))
      var lastNode = stableNamesInPath.pop()
      if (lastNode) {
        pathToName = lastNode
      }
    }
    return {
      name: canonicalName,
      path: pathToName
    }
  })

  return presentableNodes
}

function createSuggestionEngine (graph) {
  var reverseMap = locationReverseMap(graph)

  // The keys of the reverseMap represent all the names/synonyms/endonyms, so
  // we use them as the seed data for Engine.
  var seed = Object.keys(reverseMap)
  var locationsTrie = new Engine({
    datumTokenizer: Engine.tokenizers.nonword,
    queryTokenizer: Engine.tokenizers.whitespace,
    local: seed
  })

  var suggest = function (query, syncResults) {
    const showNoResults = query.length <= 1
    if (showNoResults) {
      syncResults([])
    } else {
      query = query.replace(/\./g, '')
      locationsTrie.search(query, (rawResults) => {
        var presentableResults = presentResults(graph, reverseMap, rawResults, query)

        syncResults(presentableResults)
      })
    }
  }

  return suggest
}

function entriesToGraph (entries) {
  return entries.reduce((graph, entry) => {
    graph[entry.code] = {
      edges: {
        from: []
      },
      meta: {
        'canonical': true,
        'canonical-mask': 1,
        'display-name': true,
        'stable-name': true
      },
      names: {
        'en-GB': entry.name,
        'cy': false
      }
    }
    return graph
  }, {})
}

function synonymsToGraph (synonyms) {
  return synonyms.reduce((graph, synonym) => {
    const entryCode = `nym:${synonym.name}`
    graph[entryCode] = {
      names: {
        'en-GB': synonym.name,
        'cy': false
      },
      meta: {
        'canonical': false,
        'canonical-mask': 0,
        'display-name': false,
        'stable-name': false
      },
      edges: {
        from: [synonym.code]
      }
    }
    return graph
  }, {})
}

function openregisterPickerEngine ({ additionalEntries, additionalSynonyms, callback, fallback, url }) {
  // This will be reassigned when the graph is fetched and ready.
  var suggest = fallback || function (query, syncResults) {
    syncResults([])
  }

  var request = new Request()
  request.open('GET', url)
  request.onreadystatechange = function handleStateChange () {
    var error
    var responseReady = (request.readyState === 4 && this.status >= 200 && this.status < 300)
    if (responseReady) {
      try {
        var graph = JSON.parse(request.responseText)
      } catch (exception) {
        error = { error: 'Failed to parse JSON ' + exception }
        if (callback) { callback(error) }
      }
      if (graph) {
        if (additionalEntries && additionalEntries.length) {
          const additionalEntriesGraph = entriesToGraph(additionalEntries)
          for (var key in additionalEntriesGraph) {
            if (additionalEntriesGraph.hasOwnProperty(key)) {
              graph[key] = additionalEntriesGraph[key]
            }
          }
        }
        if (additionalSynonyms && additionalSynonyms.length) {
          const additionalSynonymsGraph = synonymsToGraph(additionalSynonyms)
          for (var key in additionalSynonymsGraph) {
            if (additionalSynonymsGraph.hasOwnProperty(key)) {
              graph[key] = additionalSynonymsGraph[key]
            }
          }
        }
        suggest = createSuggestionEngine(graph)
        if (callback) { callback() }
      }
    } else {
      error = { error: 'Failed to fetch URL' }
      if (callback) { callback(error) }
    }
  }
  request.send()

  function suggestWrapper () {
    suggest.apply(this, arguments)
  }

  return suggestWrapper
}

module.exports = openregisterPickerEngine
