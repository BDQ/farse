# Farse

A basic RESTful Backend as a service using AWS Lambda, DynamoDb & ElasticSearch. All objects are persisted in DynamoDB and then streamed to ElasticSearch for more flexible queryability.


## Setup

1. Install dependencies:

```bash
yarn install
```

2. Deploy to AWS:

```bash
serverless deploy
```

**NOTE:** Watch the output and note API endpoint, it'll look like something like: ` https://abc123def456.execute-api.us-east-1.amazonaws.com/dev/` ignore the `{route+}` bit at the end.

## Testing

### 1. Creating new object(s)

You can `POST` an array of objects to any path under the root of the API endpoint, for example:

```http
POST /products/

[
  {
    "name": "LEGO® Star Wars Millennium Falcon",
    "sku": "75192",
    "price": "€799.99",
    "stock": 3
  }
]
```

Which will return:

```json
[{
  "name": "LEGO® Star Wars Millennium Falcon",
  "sku": "75192",
  "price": "€799.99",
  "stock": 3,
  "objectId": "5adb9a88829c600001514eb7",
  "objectClass": "product"
}]
```

Farse will add two new keys to the object submitted:

1. `objectId` - BSON::ObjectId for the newly created object
2. `objectClass` - singularized object type / class

#### Nested objects

You can also `POST` objects to nested paths, for example:

```http
POST /products/5adb9a88829c600001514eb7/parts

[
  {
    "name": "Han Solo minifig",
    "sku": "75192-hs1"
  }
]
```

**NOTE:** Nested objects aren't linked to their parent objects... yet.


### 2. Updating objects

Farse supports two mechanisms for updating objects:

#### 2.a. Replacing the entire object:

Sending a `PUT` request will replace the entire object.

```http
PUT /products/5adb9a88829c600001514eb7 

{
  "name": "LEGO® Star Wars Millennium Falcon",
  "sku": "75192",
  "stock": 3,
  "description": "Travel the LEGO® galaxy in the ultimate Millennium Falcon!"
}
```

#### 2.b. Partial (conditional) object updates:

Farse uses [JSONPatch](http://jsonpatch.com/) syntax to describe partial updates and conditional tests, using a `PATCH` request as follows:

```http
PATCH /products/5adb9a88829c600001514eb7

[
  { "op": "replace", "path": "/stock", "value": 2 }
]
```

Which returns the updated object:

```json
{
    "objectId": "5adb9a88829c600001514eb7",
    "stock": 2,
    "objectClass": "product",
    "description": "Travel the LEGO® galaxy in the ultimate Millennium Falcon!",
    "name": "LEGO® Star Wars Millennium Falcon",
    "sku": "75192"
}
```

You can do the same update, while including a `test` operation to ensure the stock level is the value you expect, before the update is applied.

```http
PATCH /products/5adb9a88829c600001514eb7

[
  { "op": "replace", "path": "/stock", "value": 2 },
  { "op": "test", "path": "/stock", "value": 3 }
]
```

Now if `stock` does not equal `3` the entire update will fail, the response will look like:

```json
{
    "error": "One or more operations where invalid.",
    "messages": {
        "message": "Test operation failed",
        "name": "TEST_OPERATION_FAILED",
        "index": 0,
        "operation": {
            "op": "test",
            "path": "/stock",
            "value": 3
        },
        "tree": {
            "objectId": "5adb9a88829c600001514eb7",
            "stock": 2,
            "objectClass": "product",
            "description": "Travel the LEGO® galaxy in the ultimate Millennium Falcon!",
            "name": "LEGO® Star Wars Millennium Falcon",
            "sku": "75192"
        }
    }
}
```

### 3. Querying objects

They are three ways to query objects.

#### 3.1 Querying for single object by it's objectId 

A `GET` request to the objects path:

```http
GET /products/5adb9a88829c600001514eb7
```

Returns a the object (if found):

```json
{
    "objectId": "5adb9a88829c600001514eb7",
    "stock": 2,
    "objectClass": "product",
    "description": "Travel the LEGO® galaxy in the ultimate Millennium Falcon!",
    "name": "LEGO® Star Wars Millennium Falcon",
    "sku": "75192"
}
```

#### 3.2 Querying for multiple objects using their objectId's (comma seperated list)

```http
GET /products/5adb9a88829c600001514eb7,5adcde5dd47ffb00015cf78e
```

Returns an array of objects:

```json
{
    "results": [
        {
            "objectId": "5adcde5dd47ffb00015cf78e",
            "objectClass": "product",
            "price": "€499.99",
            "name": "LEGO® Star Wars Death Star™",
            "sku": "75159"
        },
        {
            "objectId": "5adb9a88829c600001514eb7",
            "stock": 2,
            "objectClass": "product",
            "description": "Travel the LEGO® galaxy in the ultimate Millennium Falcon!",
            "name": "LEGO® Star Wars Millennium Falcon",
            "sku": "75192"
        }
    ],
    "info": {
        "total": 2,
        "size": 2
    }
}
```

#### 3.3 Conditional filtering a collection of objects.

A `GET` request to the collection root URL with a `where` param that is JSON formatted, it can contain both exact matches and nested operators:

```http
GET /dev/products?where={"sku": "75192"}
```

```http
GET /dev/products?where={"name": {"$like": "le*" }}
```

```http
GET /dev/products?where={"stock": {"$gt": 0 }}
```

The `where` params can currently contain all of the following comparison operators:

- $like - text search with wildcard support
- $gt / $gte - greater than (equal to)
- $lt / $lte - less than (eqaul to)

By default all conditions are AND'd together:

```http
GET /dev/products?where={"sku": "75192", "stock": {"$gt": 0 }}
```

But you may also provide the `$or` condition for more advanced queries:

```http
GET /products?where={"stock": {"$gt": 0 }, "$or": {"name": {"$like": "Falcon*"},  "sku": {"$like": "75*"}} }
```
In the above example, we're searching for products where:

1. `stock` is greater than `0` **AND**
2. `name` is like `'Faclon*'` OR `sku` is like `'75*'`

And it would return something like:

```json
{
    "results": [
        {
            "price": "€499.99",
            "name": "LEGO® Star Wars Death Star™",
            "objectClass": "product",
            "sku": "75159",
            "stock": 7,
            "objectId": "5adcde5dd47ffb00015cf78e"
        },
        {
            "name": "LEGO® Star Wars Millennium Falcon",
            "objectClass": "product",
            "description": "Travel the LEGO® galaxy in the ultimate Millennium Falcon!",
            "sku": "75192",
            "stock": 3,
            "objectId": "5adb9a88829c600001514eb7"
        }
    ],
    "info": {
        "offset": 0,
        "total": 2,
        "size": 20
    }
}
```


## Todos

Farse is just a proof of concept currently, there's a lot of remaining items to be considered:

- [ ] Application Provisioning - each "app" that uses Farse will require it's own DynamoDB table for object storage, and API Key.
- [ ] Authenetication - yeah...
- [ ] Sorting - this depends on Elastic Search and requires config, so we need to provide a way to indiciate which fields we maybe sorting on.
- [ ] Object Associations - we can currently create objects within a nested structure but we're not persisting this structure data (so objects must be queried flat / at the top level)
- [ ] Tests - also yeah...