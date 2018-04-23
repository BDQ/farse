


export const handler = async (event, context, callback) => {

  console.log(event)
  callback(null, {
    statusCode: '200',
    body: JSON.stringify({search: true}),
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true
    }
  })
}