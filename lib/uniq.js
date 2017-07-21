// Inspired by https://stackoverflow.com/questions/840781/easiest-way-to-find-duplicate-values-in-a-javascript-array
export default (inputArray, callbackToPresentableName) => {
  var sorted_arr = inputArray.slice().sort((left, right) => {
    if (callbackToPresentableName(left) < callbackToPresentableName(right)) {
      return -1
    } else if (callbackToPresentableName(left) > callbackToPresentableName(right)) {
      return 1
    } else {
      return 0
    }
  })
  var firstElement = sorted_arr[0]
  var results = firstElement ? [firstElement] : []
  for (var i = 0; i < inputArray.length - 1; i++) {
    var nextElement = sorted_arr[i + 1]
    var currentElement = sorted_arr[i]
    if (callbackToPresentableName(nextElement) !== callbackToPresentableName(currentElement)) {
      results.push(nextElement)
    }
  }
  return results
}
