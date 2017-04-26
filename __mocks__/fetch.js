const graph = require('../examples/location-picker-graph.json')

function text () {
  return new Promise((resolve) => {
    resolve(JSON.stringify(graph))
  })
}

export default function fetch () {
  return new Promise((resolve) => {
    resolve({ text })
  })
}
