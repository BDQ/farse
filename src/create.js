import AWS from 'aws-sdk'
import { parsePath } from './utils/path'
import { success, failure } from './utils/response'
import ObjectID from 'bson-objectid'
const dynamo = new AWS.DynamoDB.DocumentClient()

export const handler = async (event, context, callback) => {
  try {
    let { objectClass } = parsePath(event)

    console.log(event.body)
    let objects = JSON.parse(event.body)
    console.log({objects})
    let RequestItems = {}

    RequestItems[process.env.OBJECTS_TABLE] = objects.map(object => {
      // delete blank attributes
      Object.keys(object).forEach(k => (object[k] === '') && delete object[k])

      object.objectId = ObjectID().str
      object.objectClass = objectClass

      return { PutRequest: { Item: object } }
    })

    let result = await dynamo.batchWrite({RequestItems}).promise()


    if(Object.keys(result.UnprocessedItems).length === 0){
      success(callback, RequestItems[process.env.OBJECTS_TABLE].map(rec => rec.PutRequest.Item))
    } else {
      console.dir(result)
      failure(callback, {error: 'failed to insert all records, go figure.'})
    }
  } catch(err) {
    console.error(err)
    failure(callback, {error: 'unexpected error'})
  }

}