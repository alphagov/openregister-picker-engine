const graph = require('../examples/location-picker-graph.json')

function text () {
  var graphText = JSON.stringify(graph))
  console.log(graphText)
}

function reqError(error) {
  console.log('Failed to fetch URL', error);
}

export default function fetch (error, url) {
  var request = new XMLHttpRequest()
  request.onload = text
  request.onerror = requestError
  return text
  /*return new Promise((resolve, reject) => {
    if (url === 'fail') {
      reject({ error: 'Failed to fetch URL' })
    } else {
      resolve({ text })
    }
  })*/
}