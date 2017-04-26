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
