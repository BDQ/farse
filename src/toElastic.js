import AWS from 'aws-sdk'
import elasticsearch from 'elasticsearch'

const esClient = new elasticsearch.Client({
  host: process.env.ELASTIC_SEARCH_URL,
  connectionClass: require('http-aws-es'),
  awsConfig: new AWS.Config()
})

const parse = AWS.DynamoDB.Converter.output

export const handler = async (event, context, callback) => {
  // console.log(JSON.stringify(event, null, 2))

  let body = event.Records.map(record => {

    let document = parse({ "M": record.dynamodb.NewImage})
    const _index = `${process.env.ES_INDEX}-${document.objectClass}`
    const _type = document.objectClass
    const _id = document.objectId

    if (record.eventName === 'REMOVE') {
      // delete the record from ES
      return [{
        delete: { _index, _type, _id }
      }]

    } else {
      // probably an update or and insert, so Index this sucka!
      return [
        { index: { _index, _type, _id } },
        document,
      ]
    }

  })

  //this is .flatten using es6
  body = [].concat(...body)
  console.log(body)
  // send batch to Es
  let result = await esClient.bulk({body})

  if (result.errors) {
    console.log(JSON.stringify(result, null, 2))
    callback(null, 'Errors while attempting to update Elastic Search.')
  } else {
    callback(null, 'ok')
  }
}