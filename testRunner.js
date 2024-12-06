const JPScenarioTest = require('./A1--Pankratov---Artem---101240886--A2/src/test/java/selenium/JPScenarioTest');
const TwoWinnerScenarioTest = require('./A1--Pankratov---Artem---101240886--A2/src/test/java/selenium/2WinnerScenarioTest');
const OneWinnerScenarioTest = require('./A1--Pankratov---Artem---101240886--A2/src/test/java/selenium/OneWinnerScenarioTest');

async function runTests() {
    // Run JP Scenario
    /*   console.log('Starting JP Scenario Test...');
       const jpTest = new JPScenarioTest();
       try {
           await jpTest.runTest();
           console.log('JP Scenario Test completed successfully!');
       } catch (error) {
           console.error('JP Scenario Test failed:', error);
       }

       // Run 2 Winner Scenario
       console.log('Starting 2 Winner Scenario Test...');
       const twoWinnerTest = new TwoWinnerScenarioTest();
       try {
           await twoWinnerTest.runTest();
           console.log('2 Winner Scenario Test completed successfully!');
       } catch (error) {
           console.error('2 Winner Scenario Test failed:', error);
       }
   */
    // Run One Winner Scenario

    console.log('Starting One Winner Scenario Test...');
    const oneWinnerTest = new OneWinnerScenarioTest();
    try {

        await oneWinnerTest.runTest();

        console.log('One Winner Scenario Test completed successfully!');

    } catch (error) {

        console.error('One Winner Scenario Test failed:', error);

    }
}

runTests();
