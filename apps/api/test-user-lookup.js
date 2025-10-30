/**
 * Test if user exists in database after registration
 */
const { MongoClient } = require('mongodb');

async function test() {
  const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017/famly');

  try {
    await client.connect();
    const db = client.db();

    console.log('Checking user collection...');
    const users = await db.collection('user').find({}).toArray();
    console.log('Found users:', users.length);
    users.forEach(user => {
      console.log('- Email:', user.email, 'ID:', user._id);
    });

    // Check verification collection for tokens
    console.log('\nChecking verification collection...');
    const verifications = await db.collection('verification').find({}).toArray();
    console.log('Found verifications:', verifications.length);
    verifications.forEach(v => {
      console.log('- ID:', v._id, 'Identifier:', v.identifier, 'Type:', v.type);
    });

  } finally {
    await client.close();
  }
}

test().catch(console.error);
