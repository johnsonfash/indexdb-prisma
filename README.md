# Prisma for IndexDB

Primsa for IndexDB is a promise based library with close resemblance to the well documented prisma query library.

## Purpose

Given the major advantage IndexDB possess in storage space, along with the non serialisation benefit. About 60Gb or more allowed from one source, compared to 5-10MB max storage space for local storage, the next/closest competitor, there were only few-easy to use library that tackles the use of IndexDb. So i took it upon myself to build this library.

## Comparison

|     |     |
| --- | --- |
| Local Storage | IndexDB |
| 5-10MB max storage | 20GB - 100GB max storage (depends on system drive) |
| No key/auto increment indexes | Can use auto increment index, search query |
| Stores only string | Can store anything from array, object, string, number and more.. |
| No structure | Well structured like a typical relational database |
| For simple use cases | For advanced use cases & speed |

## Usage

### Database Initialisation

1\. import database instance to your project file

```typescript
import { IndexedDatabase } from 'indexdb-prisma';

const initialise  = async () => {
   const db = await IndexedDatabase('pos', { schema: schemaMockup });
}
```

**2\. Schema**
Database schema is required in order to initialise indexdb database. It must be an object with object properties/keys representing a database table, and the value of each key/property must be an object with each properties/keys value of type  `DBTypes`

**3\. DBTypes**

A DBType represent the type for each tables column in a schema object. Available types include 
`StringType`, `NumberType`, `ArrayType`, `ObjectType`, `BooleanType`, `BigIntType`, `SymbolType`, `DateType`, `AutoIncrement`

These types can be imported for use in your schema file.

**4\. Example schema object and explanation**

```typescript
import { AutoIncrement, StringType, DateType } from 'indexdb-prisma';

const schemaMockup = {
  users: {
    id: AutoIncrement,
    email: StringType,
    first_name: StringType,
    last_name: StringType,
    password: StringType,
    created_at: DateType,
  },
  posts: {
    id: AutoIncrement,
    title: StringType,
    summary: StringType,
    article: StringType,
    created_at: DateType
  },
  comments: {
    id: AutoIncrement,
    userId: NumberType,
    summary: StringType,
    postId: NumberType,
    created_at: DateType
  }
}
```

This created a database with three tables `users`, `posts`, `comments`. `users`, with columns `id` of type `AutoIncrement`, `email` of type `string` ........... , `posts` table with columns `id`, `title` , `summary` etc.

**5\. Querying the database**
Promise base query (much like prisma) makes using IndexDb much easier and straighforward

**6\. To create new `user`**

```typescript
import { IndexedDatabase } from 'indexdb-prisma';

const initialise  = async () => {
   const db = await IndexedDatabase('pos', { schema: schemaMockup });
    const create = await db.users.createOne({
      created_at: new Date(),
      email: 'leeroy7johnson@gmail.com',
      first_name: 'Leeroy',
      last_name: 'Johnson',
      password: 'qwerty',
    })
    console.log(create.password)
}
```

**7\. To get a `user`**

```typescript
import { IndexedDatabase } from 'indexdb-prisma';

const initialise  = async () => {
   const db = await IndexedDatabase('pos', { schema: schemaMockup });
   let get = await db.users.getOne('email', 'leeroy7johnson@gmail.com');
   // OR
   let get = await db.users.getOne(1);
   console.log(get.email)
}
```

**8\. To update a `user`**

```typescript
import { IndexedDatabase } from 'indexdb-prisma';

const initialise  = async () => {
   const db = await IndexedDatabase('pos', { schema: schemaMockup });
   const update = await db.users.updateOne(1, { email: 'game@gmail.com' })
   // OR
   const update = await db.users.updateOne({column: 'email', value: 'fashanutosin7@gmail.com'}, { email: 'game@gmail.com' })
   console.log(update)
}
```

**9\. To delete a `user`**

```typescript
import { IndexedDatabase } from 'indexdb-prisma';

const initialise  = async () => {
   const db = await IndexedDatabase('pos', { schema: schemaMockup });
   const del =  const del = await db.users.deleteOne(1);
   // OR
   const del = await db.users.deleteOne({column: 'email', value: 'fashanutosin7@gmail.com'})
   console.log(del)
}
```

**6\. To delete, add new tables a `table`**
**Deleting a table is much more complicated compared to deleting a database in indexdb due to running process/transactions. To do so, you must ensure you do two things.

- Insert the array of table names you want to delete as an option in the db initialization and also update your schema file to add/remove new table names
- Increase your database version to higher number. Must be a whole number for this to work
- All this can be done in the options provided while initialising your database

```typescript
import { IndexedDatabase, AutoIncrement , StringType, DateType } from 'indexdb-prisma';


const schemaMockup = {
  users: {
    id: AutoIncrement,
    email: StringType,
    first_name: StringType,
    last_name: StringType,
    password: StringType,
    created_at: DateType,
  },
  posts: {
    id: AutoIncrement,
    title: StringType,
    summary: StringType,
    article: StringType,
    created_at: DateType
  }
}

const initialise  = async () => {
   const db = await IndexedDatabase('pos', { schema: schemaMockup , version: 2, deleteTables: ['comments']})
}
```

**11\. To delete `database`**

```typescript
import { IndexedDatabase } from 'indexdb-prisma';

const initialise  = async () => {
   const db = await IndexedDatabase('pos', { schema: schemaMockup });
   const delDB =  await db.$transaction.deleteDatabase()
   console.log(delDB)
}
```

**I have so much i am doing right now. PR is welcomed**