import { parsePath } from './path'

const buildEvent = (route) => ({ pathParameters: { route } }) 

test('root collection', () => {
  let event = buildEvent('users')
  expect(parsePath(event)).toMatchObject({ objectId: null, objectClass: 'user'});
})

test('root object', () => {
  let event = buildEvent('users/1')
  expect(parsePath(event)).toMatchObject(
    {
      objectId: '1', 
      objectClass: 'user',
      parent: null
    }
  )
})

test('nested collection', () => {
  let event = buildEvent('users/1/apps')

  expect(parsePath(event)).toMatchObject({ 
    parent: { objectId: '1', objectClass: 'user', parent: null},
    objectId: null, 
    objectClass: 'app'})
})

test('nested object', () => {
  let event = buildEvent('users/1/apps/5')

  expect(parsePath(event)).toMatchObject(
    {
      objectId: "5",
      objectClass: "app",
      parent: {
        objectId: "1",
        objectClass: "user",
        parent: null
      },
    }
  )
})

test('deeply nested collection', () => {
  let event = buildEvent('users/1/apps/5/screens/3/tabs')
  expect(parsePath(event)).toMatchObject(
    {
      objectId: null,
      objectClass: "tab",
      parent: {
        objectId: "3",
        objectClass: "screen",
        parent: {
          objectId: "5",
          objectClass: "app",
          parent: {
            objectId: "1",
            objectClass: "user",
            parent: null
          }
        },
      },
    }
  )
})

test('deeply nested object', () => {
  let event = buildEvent('users/1/apps/5/screens/3/tabs/2')
  expect(parsePath(event)).toMatchObject(
    {
      objectId: "2",
      objectClass: "tab",
      parent: {
        objectId: "3",
        objectClass: "screen",
        parent: {
          objectId: "5",
          objectClass: "app",
          parent: {
            objectId: "1",
            objectClass: "user",
            parent: null
          }
        },
      },
    }
  )
})