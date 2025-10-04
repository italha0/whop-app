// Test Appwrite Connection
// Run with: node test-appwrite-connection.js

const { Client, Databases, Query } = require('node-appwrite');
require('dotenv').config({ path: '.env.local' });

const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

async function testConnection() {
  console.log('🔍 Testing Appwrite Connection...\n');

  // Test 1: Check environment variables
  console.log('✓ Step 1: Environment Variables');
  console.log('  Endpoint:', process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT);
  console.log('  Project ID:', process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID);
  console.log('  Database ID:', process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID);
  console.log('  Jobs Collection:', process.env.APPWRITE_VIDEO_JOBS_COLLECTION_ID);
  console.log('  Renders Collection:', process.env.APPWRITE_VIDEO_RENDERS_COLLECTION_ID);
  console.log('  API Key:', process.env.APPWRITE_API_KEY ? '***' + process.env.APPWRITE_API_KEY.slice(-10) : 'MISSING');
  console.log('');

  try {
    // Test 2: List databases
    console.log('✓ Step 2: Testing Database Connection...');
    const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
    
    // Test 3: Check video_jobs collection
    console.log('✓ Step 3: Testing video_jobs Collection...');
    try {
      const jobs = await databases.listDocuments(
        databaseId,
        process.env.APPWRITE_VIDEO_JOBS_COLLECTION_ID,
        [Query.limit(1)]
      );
      console.log('  ✅ video_jobs collection accessible');
      console.log('  Total jobs:', jobs.total);
    } catch (error) {
      console.log('  ❌ video_jobs collection error:', error.message);
      console.log('  → Create collection in Appwrite Console');
    }

    // Test 4: Check video_renders collection
    console.log('✓ Step 4: Testing video_renders Collection...');
    try {
      const renders = await databases.listDocuments(
        databaseId,
        process.env.APPWRITE_VIDEO_RENDERS_COLLECTION_ID,
        [Query.limit(1)]
      );
      console.log('  ✅ video_renders collection accessible');
      console.log('  Total renders:', renders.total);
    } catch (error) {
      console.log('  ❌ video_renders collection error:', error.message);
      console.log('  → Create collection in Appwrite Console');
    }

    // Test 5: Create a test job
    console.log('\n✓ Step 5: Creating Test Job...');
    const testJobId = `test_${Date.now()}`;
    try {
      const testJob = await databases.createDocument(
        databaseId,
        process.env.APPWRITE_VIDEO_JOBS_COLLECTION_ID,
        testJobId,
        {
          userId: 'test_user',
          status: 'queued',
          conversation: JSON.stringify({
            contactName: 'Test',
            messages: [{ text: 'Test message', sent: true }]
          }),
          estimatedDuration: 10,
          uploadToAppwrite: true,
          createdAt: new Date().toISOString()
        }
      );
      console.log('  ✅ Test job created:', testJobId);

      // Test 6: Update test job
      console.log('✓ Step 6: Updating Test Job...');
      await databases.updateDocument(
        databaseId,
        process.env.APPWRITE_VIDEO_JOBS_COLLECTION_ID,
        testJobId,
        { status: 'completed' }
      );
      console.log('  ✅ Test job updated');

      // Test 7: Delete test job
      console.log('✓ Step 7: Cleaning Up Test Job...');
      await databases.deleteDocument(
        databaseId,
        process.env.APPWRITE_VIDEO_JOBS_COLLECTION_ID,
        testJobId
      );
      console.log('  ✅ Test job deleted');

    } catch (error) {
      console.log('  ❌ Test job error:', error.message);
      console.log('  → Check collection attributes and permissions');
    }

    console.log('\n🎉 All tests passed! Appwrite is configured correctly.\n');

  } catch (error) {
    console.error('\n❌ Connection failed:', error.message);
    console.log('\n📋 Troubleshooting:');
    console.log('  1. Check your .env.local file');
    console.log('  2. Verify API Key has correct permissions');
    console.log('  3. Ensure database and collections exist');
    console.log('  4. Check Appwrite Console for errors\n');
  }
}

// Run the test
testConnection().catch(console.error);
