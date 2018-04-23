import AWS from 'aws-sdk'
import { parsePath } from './utils/path'
import { success, failure } from './utils/response'
import { applyPatch, validate } from 'fast-json-patch'
const dynamo = new AWS.DynamoDB.DocumentClient()

export const handler = async (event, context, callback) => {
  const { objectId, objectClass } = parsePath(event)

  let params = {
    TableName: process.env.OBJECTS_TABLE,
    Key: { objectId, objectClass }
  }

  try {
    let { Item } = await dynamo.get(params).promise()

    if (Item){
      let patch = JSON.parse(event.body)

      // validate patch is correctly formed and can 
      // be applied to the current record
      const errors = validate(patch, Item)

      if (errors) {
        failure(callback, {
          error: 'One or more operations where invalid.',
          messages: errors })
      } else {
        params.Item = applyPatch(Item, patch).newDocument
        await dynamo.put(params).promise()
        success(callback, params.Item)
      }

    } else {
      success(callback, { error: 'record not found'} )
    }
  } catch(err) {
    failure(callback, { error: err.message})
  }
}