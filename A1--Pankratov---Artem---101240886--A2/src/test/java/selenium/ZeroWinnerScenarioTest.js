const { QuestGameTest } = require('./HandManagementSystem');

class ZeroWinnerScenarioTest extends QuestGameTest {
    constructor() {
        super();
    }

    async runTest() {
        try {
            await this.setup('0WINNER');
            console.log('Starting 0 Winner Quest Scenario...');

            await this.setupDeterministicDecks('0WINNER'); // Ensure deterministic deck setup
            await this.setInitialHands();
            await this.verifyInitialState();

            // Quest setup and execution
            await this.handleQuest();

            // Verification
            await this.verifyPostQuestState();
            console.log('0 Winner Quest Scenario completed successfully!');

        } catch (error) {
            console.error('0 Winner Quest Scenario failed:', error);
            throw error;
        } finally {
            await this.teardown();
        }
    }

    async setInitialHands() {
        const initialHands = {
            'P1': ['F50', 'F70', 'D5', 'D5', 'H10', 'H10', 'S10', 'S10', 'B15', 'B15', 'L20', 'L20'],
            'P2': ['F5', 'F5', 'F10', 'F15', 'F15', 'F20', 'F20', 'F25', 'F30', 'F30', 'F40', 'E30'],
            'P3': ['F5', 'F5', 'F10', 'F15', 'F15', 'F20', 'F20', 'F25', 'F25', 'F30', 'F40', 'L20'],
            'P4': ['F5', 'F5', 'F10', 'F15', 'F15', 'F20', 'F20', 'F25', 'F25', 'F30', 'F50', 'E30']
        };
        for (const [playerId, cards] of Object.entries(initialHands)) {
            await this.setInitialHand(playerId, cards);
        }
    }

    async verifyInitialState() {
        const initialStates = {
            'P1': { shields: 0, hand: ['B15', 'B15', 'D5', 'D5', 'F50', 'F70', 'H10', 'H10', 'L20', 'L20', 'S10', 'S10'] },
            'P2': { shields: 0, hand: ['E30', 'F5', 'F5', 'F10', 'F15', 'F15', 'F20', 'F20', 'F25', 'F30', 'F30', 'F40'] },
            'P3': { shields: 0, hand: ['F5', 'F5', 'F10', 'F15', 'F15', 'F20', 'F20', 'F25', 'F25', 'F30', 'F40', 'L20'] },
            'P4': { shields: 0, hand: ['E30', 'F5', 'F5', 'F10', 'F15', 'F15', 'F20', 'F20', 'F25', 'F25', 'F30', 'F50'] }
        };

        for (const playerId in initialStates) {

            await this.verifyPlayerState(playerId, initialStates[playerId]);

        }
    }

    async handleQuest() {
        await this.setCurrentPlayer('P1');

        // Rig event card draw (Q2)
        await this.drawEventCard('TestQuest');

        // P1 sponsors the quest

        await this.clickButton('confirm-action');

        const questStages = [

            ['F50', 'D5', 'S10', 'H10', 'B15', 'L20'],

            ['F70', 'D5', 'S10', 'H10', 'B15', 'L20']

        ];

        for (const stageCards of questStages) {

            await this.selectCards('P1', stageCards);

            await this.clickButton('confirm-action');

        }



        // Stage 1: All players participate and draw cards, then make insufficient attacks

        const players = ['P2', 'P3', 'P4'];



        for (const playerId of players) {

            await this.setCurrentPlayer(playerId);

            await this.drawSpecificCard(playerId, 'F5');  // All players draw F5

            await this.discardCard(playerId, 'F5')

            await this.selectCards(playerId, ['E30']);

            await this.clickButton('confirm-action');

            // Discard attack cards (even if insufficient)

            await this.discardCard(playerId, 'E30');

        }



        // P1 cleanup (discard quest cards and draw new ones)

        const usedCards = ['F50', 'F70', 'D5', 'D5', 'H10', 'H10', 'S10', 'S10', 'B15', 'B15', 'L20', 'L20'];



        for (const card of usedCards) {
            await this.discardCard('P1', card);
        }



        const drawnCards = [
            'F5', 'F10', 'F15', 'D5', 'D5', 'D5', 'D5', 'H10', 'H10', 'H10', 'H10', 'S10', 'S10','S10'
        ];
        for (const card of drawnCards) {
            await this.addCardToHand('P1', card);
        }

        await this.discardCard('P1', 'F5')
        await this.discardCard('P1', 'F10')
        await this.maintainHandSize('P1')
    }





    async verifyPostQuestState() {



        const expectedStates = {

            'P1': {

                shields: 0,

                hand: ['F15', 'D5', 'D5', 'D5', 'D5', 'H10', 'H10', 'H10', 'H10', 'S10', 'S10', 'S10']

            },

            'P2': { shields: 0, hand: ['F5', 'F5', 'F10', 'F15', 'F15', 'F20', 'F20', 'F25', 'F30', 'F30', 'F40'] },
            'P3': {

                shields: 0,

                hand: ['F5','F5','F10','F15','F15','F20','F20','F25','F25','F30','F40','L20']

            },

            'P4': {

                shields: 0,

                hand: ['F5','F5','F10','F15','F15','F20','F20','F25','F25','F30','F50']

            }

        };



        for (const playerId in expectedStates) {

            await this.verifyPlayerState(playerId, expectedStates[playerId]);

        }

    }

}



module.exports = ZeroWinnerScenarioTest;