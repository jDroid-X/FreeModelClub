const ProgramMappingAgent = require('./src/services/ProgramMappingAgent');
const result = ProgramMappingAgent.syncAndVerifyAll();
console.log('Audit Result:', JSON.stringify(result, null, 2));