import inflection from 'inflection'

export const parsePath = (event) => {
  const parts = event.pathParameters.route.replace(/%2F/g, '/').split('/')

  return parseLevel(parts)
}


const parseLevel = (parts) => {
  let objectClass, objectId = null, parent = null

  if (parts.length % 2 === 0) {
    // object (i.e. /products/1)
    let objectParts = parts.splice(-2)
    objectClass = objectParts[0]
    objectId = objectParts[1]
  } else {
    // collection
    objectClass = parts.splice(-1)[0]
  }


  if (parts.length > 0) {
    parent = parseLevel(parts)
  }

  let response = {
    objectId,
    parent,
    objectClass: inflection.singularize(objectClass)
  }

  return response
}