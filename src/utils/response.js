export const success = (cb, data) => {
  cb(null, {
    statusCode: '200',
    body: JSON.stringify(data),
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true
    }
  })
}

export const failure = (cb, data) => {
  cb(null, {
    statusCode: '400',
    body: JSON.stringify(data),
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true
    }
  })
}

export const notFound = (cb) => {
  const error = "Object not found"
  cb(null, {
    statusCode: '404',
    body: JSON.stringify({error}),
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true
    }
  })
}