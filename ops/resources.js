const ObjectsTable = {
  Type: 'AWS::DynamoDB::Table',
  Properties: {
    AttributeDefinitions: [
      {
        AttributeName: 'objectId',
        AttributeType: 'S'
      },
      {
        AttributeName: 'objectClass',
        AttributeType: 'S'
      }
    ],
    KeySchema: [
      {
        AttributeName: 'objectId',
        KeyType: 'HASH'
      }, 
      {
        AttributeName: 'objectClass',
        KeyType: 'RANGE'
      }
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 1,
      WriteCapacityUnits: 1
    },
    TableName: '${self:provider.environment.OBJECTS_TABLE}',
    StreamSpecification: {
      StreamViewType: 'NEW_IMAGE'
    },
    SSESpecification: {
      SSEEnabled: true
    }
  }
}

const elasticSearchDomain = {
  Type: "AWS::Elasticsearch::Domain",
  Properties: {
    DomainName: '${self:provider.environment.ES_INDEX}',
    ElasticsearchVersion: '6.2',
    ElasticsearchClusterConfig: {
      DedicatedMasterEnabled: false,
      InstanceCount: 1,
      ZoneAwarenessEnabled: false,
      InstanceType: "t2.medium.elasticsearch",
    },
    EBSOptions: {
      EBSEnabled: true,
      Iops: 0,
      VolumeSize: 10,
      VolumeType: "standard"
    },
    AccessPolicies: {
      Version: "2012-10-17",
      Statement: [{
        Effect: "Allow",
        Principal: {
          AWS: "223031453984"
        },
        Action: "es:*",
        Resource: "arn:aws:es:us-east-1:123456789012:domain/${self:provider.environment.ES_INDEX}/*"
      }]
    }
  }
}

const Outputs = {
  ESDomainEndpoint: {
    Value: {
      "Fn::GetAtt": ["elasticSearchDomain", "DomainEndpoint"]
    }
  }
}

module.exports = { 
  Resources: {
    elasticSearchDomain,
    ObjectsTable,
  },
  Outputs
}
