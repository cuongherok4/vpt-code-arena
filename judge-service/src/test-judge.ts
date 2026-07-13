import axios from 'axios';

const JUDGE0_URL = process.env.JUDGE0_URL || 'http://localhost:2358';

async function runTest() {
  console.log('Testing Judge0 connection at:', JUDGE0_URL);

  try {
    // Check system info
    const sysInfo = await axios.get(`${JUDGE0_URL}/system_info`);
    console.log('✅ Judge0 is running!');
    console.log('System Info:', sysInfo.data);

    // Submit a simple program
    console.log('\nSubmitting test code (Python: print("Hello World"))...');
    const response = await axios.post(`${JUDGE0_URL}/submissions?base64_encoded=false&wait=true`, {
      source_code: "print('Hello World')",
      language_id: 71, // Python
    });

    console.log('Submission result:', response.data);
    
    if (response.data.status.id === 3) {
      console.log('✅ Code executed successfully (Accepted)');
      console.log('Output:', response.data.stdout);
    } else {
      console.log('❌ Code execution failed:', response.data.status.description);
      console.log('Error/Stderr:', response.data.stderr || response.data.compile_output);
    }
    
  } catch (error: any) {
    console.error('❌ Failed to connect to Judge0 or execution failed.');
    if (error.response) {
      console.error('Error Details:', error.response.data);
    } else {
      console.error(error.message);
    }
  }
}

runTest();
