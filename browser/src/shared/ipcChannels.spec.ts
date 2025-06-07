import { CHANNELS } from './ipcChannels.js';

/**
 * Test that all IPC channel values are unique
 */
function testUniqueChannels() {
  const channelValues = Object.values(CHANNELS);
  const uniqueValues = new Set(channelValues);
  
  // Check if there are any duplicates
  if (uniqueValues.size !== channelValues.length) {
    // Find and report duplicates
    const seen = new Set();
    const duplicates = channelValues.filter(channel => {
      const isDuplicate = seen.has(channel);
      seen.add(channel);
      return isDuplicate;
    });
    
    console.error('❌ Test failed: Found duplicate IPC channel values:', duplicates);
    console.log('All channels:', JSON.stringify(CHANNELS, null, 2));
    return false;
  }
  
  console.log('✅ All IPC channel values are unique');
  return true;
}

// Run the test and exit with appropriate status code
const success = testUniqueChannels();
process.exit(success ? 0 : 1);
