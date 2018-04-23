import AWS from 'aws-sdk'
import { parsePath } from './utils/path'
import { success, failure } from './utils/response'
const dynamo = new AWS.DynamoDB.DocumentClient()

export const handler = async (event, context, callback) => {
  const { objectId, objectClass } = parsePath(event)
  let Item = Object.assign({}, JSON.parse(event.body), { objectId, objectClass })

  let params = {
    TableName: process.env.OBJECTS_TABLE,
    Item
  }

  try {
    await dynamo.put(params).promise()

    success(callback, Item)
  } catch(err) {
    failure(callback, { error: err.message})
  }
}