import AWS from 'aws-sdk'
import { parsePath } from './utils/path'
import { success, failure } from './utils/response'
import elasticsearch from 'elasticsearch'

const dynamo = new AWS.DynamoDB.DocumentClient()
const esClient = new elasticsearch.Client({
  host: process.env.ELASTIC_SEARCH_URL,
  connectionClass: require('http-aws-es'),
  awsConfig: new AWS.Config()
})

const parseQuery = (where) => {

  let bool = { should: [], must: [] }

  Object.keys(where).forEach(key => {

    let conditions = where[key]

    switch (typeof conditions) {
      case 'number':
      case 'string': {
        let term = {}
        term[key] = conditions
        bool.must.push({ term })
        break
      }
      case 'object': {
        if (key === '$or'){
          bool.should.push({ bool: parseQuery(conditions) })
        } else {
          Object.entries(conditions).forEach(([op, value]) => {
            switch (op) {
              case '$like': 
                bool.must.push({ query_string: { 
                                  query: value,
                                  fields: [key] }
                                })
                break
              case '$lt':
              case '$lte':
              case '$gt':
              case '$gte': {
                let range = {}
                range[key] = {}
                range[key][op.slice(1)] = value
                bool.must.push({ range })
                break
              }
            }
          })
        }

        break
      }
    }
  })

  return bool
}

export const handler = async (event, context, callback) => {
  const { objectId, objectClass } = parsePath(event)
  console.log({ objectId, objectClass })
  let { where, sort, pagesize, offset } = event.queryStringParameters || {}

  if (objectId === null) {
    let response = { results: [], pagination: []}

    if (where) {
      try {
        where = JSON.parse(where)
      } catch(err) {
        console.error(err)
        failure(callback, {error: "'where' param must be valid json"})
        return
      }

      if (sort) {
        if (/^[\w*\s?asc|desc,?]*$/.test(sort)) {
          // matches our plain sort string "firstName,lastName asc,createdAt desc"
          sort = [sort]
        } else {
          // might be fancy json sort config - try prasing
          try {
            sort = JSON.parse(sort)
          } catch(err) {
            console.log(err)
            failure(callback, {error: "'sort' param must be valid json, or a supported string"})
            return
          }
        }
      }

      if (!pagesize) {
        pagesize = 20
      }

      if (!offset) {
        offset = 0
      }

      let body = {
        query: { bool: parseQuery(where) },
        sort,
        size: pagesize,
        from: offset
      }

      console.dir(body)

      let { objectClass } = parsePath(event)
      const index = `${process.env.ES_INDEX}-${objectClass}`
      const type = objectClass
      let result = await esClient.search({ index, type, body})

      response = {
        results: result.hits.hits.map(h => h._source),
        info: {
          offset,
          total: result.hits.total,
          size: pagesize
        }
      }
    }
   
    success(callback, response)

  } else {
    const ids = objectId.split(',')

    console.log(ids.length)
    if (ids.length === 1){
      let params = {
        TableName: process.env.OBJECTS_TABLE,
        Key: { objectId, objectClass }
      }

      console.log({params})
      try {
        let { Item } = await dynamo.get(params).promise()

        console.log({Item})
        if (Item){
          success(callback,Item)
        } else {
          success(callback, { error: 'record not found'} )
        }
      } catch(err) {
        failure(callback, { error: err.message})
      }
    
    } else {
      let RequestItems = {}
      const Keys = ids.map(id => {
        return({
          objectId: id,
          objectClass
        })
      })
      RequestItems[process.env.OBJECTS_TABLE] = { Keys }

      try {
        let { Responses } = await dynamo.batchGet({ RequestItems }).promise()
        let size = Responses[process.env.OBJECTS_TABLE].length

        success(callback, { 
          results: Responses[process.env.OBJECTS_TABLE],
          info: {
            total: ids.length,
            size
          }
        })
      } catch(err) {
        failure(callback, { error: err.message})
      }

    }
  }
}