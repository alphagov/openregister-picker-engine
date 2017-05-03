const graph = require('../examples/location-picker-graph.json')

function text () {
  return new Promise((resolve) => {
    resolve(JSON.stringify(graph))
  })
}

export default function fetch (url) {
  return new Promise((resolve, reject) => {
    if (url === 'fail') {
      reject({ error: 'Failed to fetch URL' })
    } else {
      resolve({ text })
    }
  })
}
