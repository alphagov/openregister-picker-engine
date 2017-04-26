// Inspired by http://stackoverflow.com/questions/40801349/converting-lodash-uniqby-to-native-javascript
export default (arr, predicate) => {
  const cb = predicate
    ? typeof predicate === 'function'
      ? predicate
      : (o) => o[predicate]
    : (o) => o

  return [...arr.reduce((map, item) => {
    const key = cb(item)

    map.has(key) || map.set(key, item)

    return map
  }, new Map()).values()]
}
