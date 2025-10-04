#!/usr/bin/env node

/**
 * Test Worker Integration
 * Tests the video rendering worker with emoji support
 */

const { getRenderQueue } = require('../lib/queue');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Test configuration
const TEST_RENDER_DATA = {
  compositionId: 'MessageConversation',
  inputProps: {
    messages: [
      {
        id: '1',
        text: 'Hello! 👋 This is a test message with emojis! 😊🎉',
        sender: 'user',
        timestamp: new Date().toISOString()
      },
      {
        id: '2', 
        text: 'Testing emoji rendering: 🚀✨🎬🎯💫',
        sender: 'assistant',
        timestamp: new Date().toISOString()
      },
      {
        id: '3',
        text: 'More emojis: 😀😃😄😁😆😅🤣😂🙂🙃',
        sender: 'user',
        timestamp: new Date().toISOString()
      }
    ],
    theme: 'default',
    duration: 10
  }
};

async function testWorkerIntegration() {
  console.log('🧪 Testing Worker Integration...');
  
  try {
    // Initialize Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    // Create test render record
    console.log('📝 Creating test render record...');
    const { data: renderRecord, error: insertError } = await supabase
      .from('video_renders')
      .insert({
        status: 'pending',
        composition_id: TEST_RENDER_DATA.compositionId,
        input_props: TEST_RENDER_DATA.inputProps,
        user_id: null // Test without user
      })
      .select()
      .single();
    
    if (insertError) {
      throw new Error(`Failed to create render record: ${insertError.message}`);
    }
    
    console.log(`✅ Created render record: ${renderRecord.id}`);
    
    // Add job to queue
    console.log('📤 Adding job to render queue...');
    const queue = getRenderQueue();
    
    const job = await queue.add('render-video', {
      renderId: renderRecord.id,
      compositionId: TEST_RENDER_DATA.compositionId,
      inputProps: TEST_RENDER_DATA.inputProps,
      outputFileName: `test-${Date.now()}.mp4`
    });
    
    console.log(`✅ Added job to queue: ${job.id}`);
    
    // Monitor job progress
    console.log('👀 Monitoring job progress...');
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes
    
    while (attempts < maxAttempts) {
      const { data: updatedRecord } = await supabase
        .from('video_renders')
        .select('*')
        .eq('id', renderRecord.id)
        .single();
      
      console.log(`📊 Status: ${updatedRecord.status}`);
      
      if (updatedRecord.status === 'done') {
        console.log('🎉 Render completed successfully!');
        console.log(`📹 Video URL: ${updatedRecord.url}`);
        console.log(`📁 Blob name: ${updatedRecord.blob_name}`);
        break;
      } else if (updatedRecord.status === 'error') {
        console.error('❌ Render failed:', updatedRecord.error_message);
        break;
      }
      
      attempts++;
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
    }
    
    if (attempts >= maxAttempts) {
      console.warn('⏰ Test timed out after 5 minutes');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Test Redis connection
async function testRedisConnection() {
  console.log('🔗 Testing Redis connection...');
  
  try {
    const queue = getRenderQueue();
    await queue.add('test-connection', { test: true });
    console.log('✅ Redis connection successful');
  } catch (error) {
    console.error('❌ Redis connection failed:', error);
    throw error;
  }
}

// Test Supabase connection
async function testSupabaseConnection() {
  console.log('🗄️ Testing Supabase connection...');
  
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    const { data, error } = await supabase
      .from('video_renders')
      .select('count')
      .limit(1);
    
    if (error) throw error;
    
    console.log('✅ Supabase connection successful');
  } catch (error) {
    console.error('❌ Supabase connection failed:', error);
    throw error;
  }
}

// Main test function
async function runTests() {
  console.log('🧪 Starting Worker Integration Tests...\n');
  
  try {
    await testRedisConnection();
    await testSupabaseConnection();
    await testWorkerIntegration();
    
    console.log('\n🎉 All tests completed successfully!');
  } catch (error) {
    console.error('\n❌ Tests failed:', error);
    process.exit(1);
  }
}

// Run tests if called directly
if (require.main === module) {
  runTests();
}

module.exports = { runTests, testWorkerIntegration };
