const resources = require('./ops/resources')
// const functions = require('./ops/functions')

const create = {
  handler: "src/create.handler",
  events: [
    {
      http: {
        method: "post",
        cors: true,
        path: "/{route+}"
      }
    }
  ]
}

const update = {
  handler: "src/update.handler",
  events: [
    {
      http: {
        method: "put",
        cors: true,
        path: "/{route+}"
      }
    }
  ]
}

const patch = {
  handler: "src/patch.handler",
  events: [
    {
      http: {
        method: "patch",
        cors: true,
        path: "/{route+}"
      }
    }
  ]
}

const show = {
  handler: "src/show.handler",
  events: [
    {
      http: {
        method: "get",
        cors: true,
        path: "/{route+}"
      }
    }
  ]
}

const toElastic = {
  handler: 'src/toElastic.handler',
  events: [
    { 
      stream: {
        type: 'dynamodb',
        arn: {
          'Fn::GetAtt': [ 'ObjectsTable', 'StreamArn' ]
        }
      }
    }
  ]
}

module.exports = {
  service: 'farse',
  provider: {
    name: 'aws', 
    runtime: 'nodejs8.10',
    memorySize: 256,
    timeout: 300,
    environment: {
      OBJECTS_TABLE: '${self:service}-${self:provider.stage}-objects',
      ELASTIC_SEARCH_URL: '${cf:farse-dev.ESDomainEndpoint}',
      ES_INDEX: 'passport-${self:provider.stage}'
    },
    iamRoleStatements: [
      { Effect: "Allow",
        Action: [
          'es:*',
          's3:GetObject',
          'ssm:GetParameter',
          'lambda:InvokeFunction',
          'dynamodb:Query',
          'dynamodb:GetItem',
          'dynamodb:PutItem',
          'dynamodb:UpdateItem',
          'dynamodb:BatchWriteItem', 
          'dynamodb:BatchGetItem' ],
        Resource: "*" }
    ]
  },
  custom: {
    webpack: {
      packager: 'yarn',
      includeModules: {
        forceExclude: ['aws-sdk']
      }
    },
    "serverless-offline": {
      port: 4000
    }
  },
  plugins: [
    'serverless-webpack',
    'serverless-offline'
  ],
  resources,
  functions: {
    create,
    patch,
    update,
    show,
    toElastic
  }
}