const { By } = require('selenium-webdriver');
const BaseSeleniumTest = require('./BaseSeleniumTest');
const assert = require('assert');

class JPScenarioTest extends BaseSeleniumTest {
    constructor() {
        super();
    }

    async runTest() {
        try {
            // Set up with JP scenario
            await this.setup('JP');
            console.log('Setting up initial game state...');
            await this.setInitialHands();

            // P1 draws Q4 and declines
            console.log('P1 drawing and declining quest...');
            const questCard = await this.drawCard('P1', 'event');
            assert.strictEqual(questCard.stages, 4, 'Expected a 4-stage quest card');
            await this.clickButton('decline-action');

            // P2 sponsors and builds quest
            console.log('P2 sponsoring quest...');
            await this.setCurrentPlayer('P2');
            await this.clickButton('confirm-action');
            await this.buildQuestStages();

            // Handle each stage
            await this.handleStages();

            // Verify final state
            await this.verifyFinalState();

            console.log('Test completed successfully!');
        } catch (error) {
            console.error('Test failed:', error);
            throw error;
        } finally {
            await this.teardown();
        }
    }

    async setInitialHands() {
        const initialHands = {
            P1: ['F5', 'F5', 'F15', 'F15', 'D5', 'S10', 'H10', 'B15', 'B15', 'L20'],
            P2: ['F15', 'F25', 'F45', 'F65', 'S10', 'H10', 'B15', 'L20', 'E30'],
            P3: ['F5', 'F5', 'F5', 'F15', 'D5', 'S10', 'H10', 'B15'],
            P4: ['F5', 'F15', 'F15', 'F40', 'D5', 'S10', 'H10', 'L20']
        };

        for (const [playerId, cards] of Object.entries(initialHands)) {
            await this.setInitialHand(playerId, cards);
        }
    }

    async buildQuestStages() {
        const stages = [
            ['F15'],  // Stage 1
            ['F25'],  // Stage 2
            ['F45'],  // Stage 3
            ['F65']   // Stage 4
        ];

        for (const cards of stages) {
            await this.selectCards('P2', cards);
            await this.clickButton('confirm-action');
        }
    }

    async handleStages() {
        // Handle Stage 1
        await this.handleStage1();
        await this.verifyStage1Results();

        // Handle Stage 2
        await this.handleStage2();
        await this.verifyStage2Results();

        // Handle Stage 3
        await this.handleStage3();
        await this.verifyStage3Results();

        // Handle Stage 4
        await this.handleStage4();
        await this.verifyStage4Results();
    }

    async handleStage1() {
        console.log('Stage 1: Starting...');

        // P1's turn
        await this.setCurrentPlayer('P1');
        console.log('P1 hand before draw:', await this.getPlayerHand('P1'));
        const drawnCard = await this.drawCard('P1', 'adventure'); // Should be F30
        console.log('P1 drew card:', drawnCard);
        console.log('P1 hand after draw:', await this.getPlayerHand('P1'));

        await this.discardCard('P1', 'F5');
        console.log('P1 hand after discard:', await this.getPlayerHand('P1'));

        await this.selectCards('P1', ['D5', 'S10']);
        await this.clickButton('confirm-action');

        // P3's turn
        await this.setCurrentPlayer('P3');
        await this.drawCard('P3', 'adventure'); // Should be S10
        await this.discardCard('P3', 'F5');
        await this.selectCards('P3', ['S10', 'D5']);
        await this.clickButton('confirm-action');

        // P4's turn
        await this.setCurrentPlayer('P4');
        await this.drawCard('P4', 'adventure'); // Should be B15
        await this.discardCard('P4', 'F5');
        await this.selectCards('P4', ['D5', 'H10']);
        await this.clickButton('confirm-action');
    }

    async handleStage2() {
        console.log('Stage 2: Starting...');

        // P1's insufficient attack
        await this.setCurrentPlayer('P1');
        await this.drawCard('P1', 'adventure'); // F10
        await this.selectCards('P1', ['H10']);
        await this.clickButton('confirm-action');

        // P3's attack
        await this.setCurrentPlayer('P3');
        await this.drawCard('P3', 'adventure'); // L20
        await this.selectCards('P3', ['B15', 'S10']);
        await this.clickButton('confirm-action');

        // P4's attack
        await this.setCurrentPlayer('P4');
        await this.drawCard('P4', 'adventure'); // L20
        await this.selectCards('P4', ['H10', 'B15']);
        await this.clickButton('confirm-action');
    }

    async handleStage3() {
        console.log('Stage 3: Starting...');

        // P3's attack
        await this.setCurrentPlayer('P3');
        await this.drawCard('P3', 'adventure'); // B15
        await this.selectCards('P3', ['L20', 'H10', 'S10']);
        await this.clickButton('confirm-action');

        // P4's attack
        await this.setCurrentPlayer('P4');
        await this.drawCard('P4', 'adventure'); // S10
        await this.selectCards('P4', ['B15', 'S10', 'L20']);
        await this.clickButton('confirm-action');
    }

    async handleStage4() {
        console.log('Stage 4: Starting...');

        // P3's unsuccessful attack
        await this.setCurrentPlayer('P3');
        await this.drawCard('P3', 'adventure'); // F30
        await this.selectCards('P3', ['B15', 'H10', 'L20']);
        await this.clickButton('confirm-action');

        // P4's winning attack
        await this.setCurrentPlayer('P4');
        await this.drawCard('P4', 'adventure'); // E30
        await this.selectCards('P4', ['D5', 'S10', 'L20', 'E30']);
        await this.clickButton('confirm-action');

        // Update P4's shields
        await this.setShields('P4', 4);

        // P2's cleanup
        await this.handleP2Cleanup();
    }

    async handleP2Cleanup() {
        await this.setCurrentPlayer('P2');

        // Remove quest cards
        const questCards = ['F15', 'F25', 'F45', 'F65'];
        for (const card of questCards) {
            await this.discardCard('P2', card);
        }

        // Draw 13 new cards (9 replacements + 4 for stages)
        for (let i = 0; i < 13; i++) {
            await this.drawCard('P2', 'adventure');
        }

        // Trim to 12 cards if necessary
        await this.trimHand('P2');
    }

    async verifyStage1Results() {
        await this.verifyPlayerState('P1', {
            shields: 0,
            hand: ['F5', 'F10', 'F15', 'F15', 'F30', 'H10', 'B15', 'B15', 'L20']
        });
    }

    async verifyStage2Results() {
        await this.verifyPlayerState('P1', {
            shields: 0,
            hand: ['F5', 'F10', 'F15', 'F15', 'F30', 'H10', 'B15', 'B15', 'L20']
        });
    }

    async verifyStage3Results() {
        const p3Shields = await this.getShields('P3');
        const p4Shields = await this.getShields('P4');
        assert.strictEqual(p3Shields, 0);
        assert.strictEqual(p4Shields, 0);
    }

    async verifyStage4Results() {
        await this.verifyPlayerState('P3', {
            shields: 0,
            hand: ['F5', 'F5', 'F15', 'F30', 'S10']
        });

        await this.verifyPlayerState('P4', {
            shields: 4,
            hand: ['F15', 'F15', 'F40', 'L20']
        });
    }

    async verifyFinalState() {
        const p2Hand = await this.getPlayerHand('P2');
        assert.strictEqual(p2Hand.length, 12, 'P2 should have exactly 12 cards after cleanup');
    }
}

module.exports = JPScenarioTest;