import $ from 'jquery'
import {Bloodhound} from 'corejs-typeahead'
import _ from 'lodash'

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
  cnwp.weight = 1

  const name = presentableName(cnwp.node, preferredLocale)
  const isUk = name === 'United Kingdom'
  cnwp.weight += isUk ? 100000 : 0

  const isExactMatch = name.toLowerCase() === query.toLowerCase()
  cnwp.weight += isExactMatch ? 10000 : 0

  const synonymIsExactMatch = cnwp.path
    .map(pathNode => presentableName(pathNode.node, pathNode.locale))
    .map(nameInPath => nameInPath.toLowerCase())
    .indexOf(query.toLowerCase()) !== -1
  cnwp.weight += synonymIsExactMatch ? 1000 : 0

  const indexOfQuery = indexOfLowerCase(name, query)
  const canonicalNameStartsWithQuery = indexOfQuery === 0
  cnwp.weight += canonicalNameStartsWithQuery ? 100 : 0

  const canonicalNameContainsQuery = indexOfQuery > 0
  cnwp.weight += canonicalNameContainsQuery ? 10 : 0

  // Longer paths mean canonical node is further from matched synonym, so rank it lower.
  cnwp.weight += cnwp.path.length * -1

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

// Bloodhound gives us back a list of results that includes synonyms, typos,
// endonyms and other things we don't want the user to see.
// This function transforms those into a list of stable canonical country names.
function presentResults (graph, reverseMap, rawResults, query) {
  var nodesWithLocales = rawResults.map(r => reverseMap[r])

  var canonicalNodesWithPaths = nodesWithLocales.reduce((canonicalNodes, nwl) => {
    return canonicalNodes.concat(findCanonicalNodeWithPath(graph, nwl.node, nwl.locale, []))
  }, [])

  const canonicalNodesWithPathsAndWeights = canonicalNodesWithPaths.map(cnwp => addWeight(cnwp, query))

  canonicalNodesWithPathsAndWeights.sort(byWeightAndThenAlphabetically)

  const uniqueNodesWithPathsAndWeights = _.uniqBy(canonicalNodesWithPathsAndWeights, (cnwp) => {
    return presentableName(cnwp.node, preferredLocale)
  })

  var presentableNodes = uniqueNodesWithPathsAndWeights.map(cnwp => {
    var canonicalName = presentableName(cnwp.node, preferredLocale)
    var pathToName = ''
    if (showPaths && cnwp.path.length) {
      var stableNamesInPath = cnwp.path
        .filter(pathNode => pathNode.node.meta['stable-name'])
        .map(pathNode => presentableName(pathNode.node, pathNode.locale))
      var lastNode = stableNamesInPath.pop()
      if (lastNode) {
        pathToName = ` (${lastNode})`
      }
    }
    return `${canonicalName}${pathToName}`
  })

  return presentableNodes
}

function createSuggestionEngine (graph) {
  var reverseMap = locationReverseMap(graph)

  // The keys of the reverseMap represent all the names/synonyms/endonyms, so
  // we use them as the seed data for Bloodhound.
  var seed = Object.keys(reverseMap)
  var locationsTrie = new Bloodhound({
    datumTokenizer: Bloodhound.tokenizers.nonword,
    queryTokenizer: Bloodhound.tokenizers.whitespace,
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

function locationPickerSuggestions (pathToGraph) {
  // This will be reassigned when the graph is fetched and ready.
  var suggest = function (query, syncResults) {
    syncResults([])
  }

  $.get(pathToGraph, function (graph) {
    suggest = createSuggestionEngine(graph)
  })

  function suggestWrapper () {
    suggest.apply(this, arguments)
  }

  return suggestWrapper
}

export default locationPickerSuggestions
