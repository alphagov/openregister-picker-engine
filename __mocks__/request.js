const graph = require('../examples/location-picker-graph.json')

export default function XMLHttpRequest () {}

XMLHttpRequest.prototype.open = function (method, url) {
  this.url = url
}

XMLHttpRequest.prototype.send = function () {
  if (this.url === 'fail') {
    this.status = 500
  } else {
    this.readyState = 4
    this.status = 200
    this.responseText = JSON.stringify(graph)
  }
  setTimeout(() => this.onreadystatechange())
}