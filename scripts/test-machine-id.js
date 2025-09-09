#!/usr/bin/env node

/**
 * Machine ID Test Script
 * 
 * This script tests the machine-id package functionality
 * to ensure it works correctly before running the full application.
 */

const machineId = require('machine-id');

console.log('🧪 Testing Machine ID Functionality...\n');

try {
  // Test getting machine ID
  console.log('📋 Getting machine ID...');
  const id = machineId();
  
  if (id && typeof id === 'string' && id.length > 0) {
    console.log('✅ Machine ID retrieved successfully!');
    console.log('🖥️  Machine ID:', id);
    console.log('📏 Length:', id.length, 'characters');
    console.log('🔍 Type:', typeof id);
    
    // Test if it's consistent (should be the same each time)
    console.log('\n🔄 Testing consistency...');
    const id2 = machineId();
    
    if (id === id2) {
      console.log('✅ Machine ID is consistent across calls');
    } else {
      console.log('❌ Machine ID is NOT consistent - this might be an issue');
    }
    
    console.log('\n🎉 Machine ID test completed successfully!');
    console.log('💡 This ID will be logged when the Electron app starts');
    
  } else {
    console.log('❌ Machine ID is invalid or empty');
    console.log('   ID:', id);
    console.log('   Type:', typeof id);
    process.exit(1);
  }
  
} catch (error) {
  console.error('❌ Failed to get machine ID:', error.message);
  console.error('   Error details:', error);
  process.exit(1);
}
