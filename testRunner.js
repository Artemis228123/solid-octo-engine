const JPScenarioTest = require('./A1--Pankratov---Artem---101240886--A2/src/test/java/selenium/JPScenarioTest');

async function runTests() {
    console.log('Starting JP Scenario Test...');
    const test = new JPScenarioTest();
    try {
        await test.runTest();
        console.log('Test completed successfully!');
    } catch (error) {
        console.error('Test failed:', error);
    }
}

runTests();