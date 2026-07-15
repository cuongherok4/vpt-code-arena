import axios from 'axios';

const JUDGE0_URL = process.env.JUDGE0_URL || 'http://localhost:2358';

async function testJava() {
  console.log('Testing Judge0 Java support at:', JUDGE0_URL);

  try {
    // Test 1: Check system info
    console.log('\n=== Test 1: System Info ===');
    const sysInfo = await axios.get(`${JUDGE0_URL}/system_info`);
    console.log('✅ Judge0 is running!');
    if (sysInfo.data.languages && Array.isArray(sysInfo.data.languages)) {
      console.log('Sample languages:', sysInfo.data.languages.slice(0, 5).map(l => `${l.name} (${l.id})`).join(', '));
    } else {
      console.log('System Info:', JSON.stringify(sysInfo.data, null, 2).substring(0, 200));
    }

    // Test 2: Simple Python (working baseline)
    console.log('\n=== Test 2: Python (Baseline) ===');
    const pythonRes = await axios.post(
      `${JUDGE0_URL}/submissions?base64_encoded=false&wait=true`,
      {
        source_code: "print('Hello Python')",
        language_id: 71,
      }
    );
    console.log('Status:', pythonRes.data.status.description);
    console.log('Output:', pythonRes.data.stdout);

    // Test 3: Java with public class Main
    console.log('\n=== Test 3: Java - Without filename ===');
    const javaCode = `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, Java!");
    }
}`;

    const javaRes = await axios.post(
      `${JUDGE0_URL}/submissions?base64_encoded=false&wait=true`,
      {
        source_code: javaCode,
        language_id: 62,
      }
    );
    console.log('Status:', javaRes.data.status.description);
    console.log('Message:', javaRes.data.message);

    // Test 3b: Java WITH filename
    console.log('\n=== Test 3b: Java - With source_code_filename ===');
    const javaResWithFile = await axios.post(
      `${JUDGE0_URL}/submissions?base64_encoded=false&wait=true`,
      {
        source_code: javaCode,
        language_id: 62,
        source_code_filename: 'Main.java'
      }
    );
    console.log('Status:', javaResWithFile.data.status.description);
    console.log('Stdout:', javaResWithFile.data.stdout);
    console.log('Compile Output:', javaResWithFile.data.compile_output);
    console.log('Stderr:', javaResWithFile.data.stderr);

    // Test 4: Java with base64 encoding
    console.log('\n=== Test 4: Java - Base64 + filename ===');
    const encoded = Buffer.from(javaCode).toString('base64');
    const javaBase64Res = await axios.post(
      `${JUDGE0_URL}/submissions?base64_encoded=true&wait=true`,
      {
        source_code: encoded,
        language_id: 62,
        base64_encoded: true,
        source_code_filename: 'Main.java'
      }
    );
    console.log('Status:', javaBase64Res.data.status.description);
    console.log('Stdout:', javaBase64Res.data.stdout ? Buffer.from(javaBase64Res.data.stdout, 'base64').toString() : '(none)');
    console.log('Compile Output:', javaBase64Res.data.compile_output ? Buffer.from(javaBase64Res.data.compile_output, 'base64').toString() : '(none)');

  } catch (error) {
    console.error('❌ Test failed');
    if (error.response) {
      console.error('Error:', error.response.data);
    } else {
      console.error(error.message);
    }
  }
}

testJava();
