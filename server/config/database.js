// Mock database for API-only deployment
// No MySQL dependency required

// Mock database for API-only deployment
const mockDatabase = {
  connected: true,
  data: new Map()
};

// Test connection (mock)
const testConnection = async () => {
  try {
    console.log('✅ Mock database connected successfully');
    return true;
  } catch (error) {
    console.error('❌ Mock database connection failed:', error.message);
    return false;
  }
};

// Mock query execution
const executeQuery = async (query, params = []) => {
  try {
    // Simulate database delay
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Return mock results based on query type
    if (query.includes('SELECT')) {
      return []; // Mock empty results
    } else if (query.includes('INSERT')) {
      return { insertId: Math.floor(Math.random() * 1000) + 1, affectedRows: 1 };
    } else if (query.includes('UPDATE') || query.includes('DELETE')) {
      return { affectedRows: 1 };
    }
    
    return [];
  } catch (error) {
    console.error('Mock query execution error:', error.message);
    throw error;
  }
};

// Mock transaction helper
const executeTransaction = async (queries) => {
  try {
    const results = [];
    for (const { query, params } of queries) {
      const result = await executeQuery(query, params);
      results.push(result);
    }
    return results;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  executeQuery,
  executeTransaction,
  testConnection,
  getConnection: () => Promise.resolve({ release: () => {} })
};