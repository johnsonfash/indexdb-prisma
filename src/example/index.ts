import { AutoIncrement, DateType, IndexedDatabase, NumberType, StringType } from "..";

const schemaMockup = {
  users: {
    id: AutoIncrement,
    email: StringType,
    first_name: StringType,
    last_name: StringType,
    password: StringType,
    created_at: DateType,
  },
  post: {
    id: AutoIncrement,
    title: StringType,
    summary: StringType,
    article: StringType,
    created_at: DateType
  },
  comment: {
    id: AutoIncrement,
    userId: NumberType,
    summary: StringType,
    postId: NumberType,
    created_at: DateType
  }
}

const users = [
  {
    email: 'leeroy7johnson@gmail.com',
    first_name: 'Leeroy',
    last_name: 'Johnson',
    password: '@Qwerty12345',
    created_at: new Date(),
  },
  {
    email: 'fashanutosin7@gmail.com',
    first_name: 'Fashanu',
    last_name: 'Tosin',
    password: '@Qwerty12345',
    created_at: new Date(),
  }
]

const testDB = async () => {
  try {
    const db = await IndexedDatabase('pos', { schema: schemaMockup });
    const create = await db.users.createOne({
      created_at: new Date(),
      email: 'leeroy7johnson@gmail.com',
      first_name: 'Leeroy',
      last_name: 'Johnson',
      password: 'qwerty',
    })
    console.log(create)
    const get = await db.users.getOne('email', 'leeroy7johnson@gmail.com');
    console.log(get);
    const update = await db.users.updateOne(1, { email: 'game@gmail.com' })
    console.log(update);
    const del = await db.users.deleteOne(1);
    console.log(del);
  } catch (error: any) {
    console.log(error);
  }
}
testDB()