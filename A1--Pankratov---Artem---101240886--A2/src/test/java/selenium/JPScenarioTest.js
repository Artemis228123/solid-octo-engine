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
            await this.setupDeterministicDecks('JP');
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

        // P1 draws F30 and discards F5
        await this.drawCard('P1', 'adventure'); // Draws F30
        await this.discardCard('P1', 'F5');

        // P1's attack with D5 + S10
        await this.selectCards('P1', ['D5', 'S10']);
        await this.clickButton('confirm-action');

        // Discard attack cards
        await this.discardCard('P1', 'D5');
        await this.discardCard('P1', 'S10');

        // Draw F10 immediately after Stage 1 attack
        await this.drawCard('P1', 'adventure'); // Draws F10 here
        console.log('P1 hand after F10 draw:', await this.getPlayerHand('P1'));

        // P3's turn
        await this.setCurrentPlayer('P3');
        await this.drawCard('P3', 'adventure'); // Should be S10
        await this.discardCard('P3', 'F5');
        await this.selectCards('P3', ['S10', 'D5']);
        await this.clickButton('confirm-action');
        await this.discardCard('P3', 'S10');
        await this.discardCard('P3', 'D5');

        // P4's turn
        await this.setCurrentPlayer('P4');
        await this.drawCard('P4', 'adventure'); // Draws Battle Axe
        await this.discardCard('P4', 'F5');
        await this.selectCards('P4', ['D5']);
        await this.clickButton('confirm-action');
        await this.discardCard('P4', 'D5');

        // Verify P1's hand after Stage 1
        await this.verifyPlayerState('P1', {
            shields: 0,
            hand: ['F5', 'F10', 'F15', 'F15', 'F30', 'H10', 'B15', 'B15', 'L20']
        });
    }

    async handleStage2() {
        console.log('Stage 2: Starting...');

        // P1's insufficient attack
        await this.setCurrentPlayer('P1');




        const drawnCard = await this.drawCard('P1', 'adventure'); // Should draw F10
        console.log('P1 drew:', drawnCard);


        if (drawnCard === 'F10') {
            await this.discardCard('P1', 'F10');
        }


        await this.selectCards('P1', ['H10']);
        await this.clickButton('confirm-action');



        // P3's turn
        await this.setCurrentPlayer('P3');
        await this.drawCard('P3', 'adventure'); // Draws Lance
        await this.selectCards('P3', ['B15', 'S10']);
        await this.clickButton('confirm-action');
        await this.discardCard('P3', 'B15');
        await this.discardCard('P3', 'S10');

        // P4's turn
        await this.setCurrentPlayer('P4');
        await this.drawCard('P4', 'adventure'); // Draws Lance


        await this.selectCards('P4', ['H10', 'B15']);
        await this.clickButton('confirm-action');

        // now discard the attack cards
        await this.discardCard('P4', 'H10');
        await this.discardCard('P4', 'B15');

        // Verify P1's final hand after Stage 2
        await this.verifyPlayerState('P1', {
            shields: 0,
            hand: ['F5', 'F10', 'F15', 'F15', 'F30', 'H10', 'B15', 'B15', 'L20']
        });
    }

    async handleStage3() {
        console.log('Stage 3: Starting...');

        // P3's attack
        await this.setCurrentPlayer('P3');
        await this.drawCard('P3', 'adventure'); // B15
        console.log('P3 hand before attack:', await this.getPlayerHand('P3'));

        // P3's attack: Lance + Horse => value of 30
        await this.selectCards('P3', ['L20', 'H10']);
        await this.clickButton('confirm-action');
        await this.discardCard('P3', 'L20');
        await this.discardCard('P3', 'H10');

        // P4's attack
        await this.setCurrentPlayer('P4');
        await this.drawCard('P4', 'adventure'); // S10
        console.log('P4 hand before attack:', await this.getPlayerHand('P4'));

        // First, discard all S10s to ensure we have the right cards remaining
        await this.discardCard('P4', 'S10');
        await this.discardCard('P4', 'S10');

        // P4's attack: using two L20s
        await this.selectCards('P4', ['L20', 'L20']);
        await this.clickButton('confirm-action');
        await this.discardCard('P4', 'L20');

        // Verify final hands
        await this.verifyPlayerState('P3', {
            shields: 0,
            hand: ['F5', 'F5', 'F15', 'B15']
        });

        await this.verifyPlayerState('P4', {
            shields: 0,
            hand: ['F15', 'F15', 'F40', 'L20']
        });
    }

    async handleStage4() {
        console.log('Stage 4: Starting...');

        // P3's attack
        await this.setCurrentPlayer('P3');
        await this.drawCard('P3', 'adventure'); // F30
        console.log('P3 hand before attack:', await this.getPlayerHand('P3'));


        await this.addCardToHand('P3', 'S10');

        // P3's unsuccessful attack with just B15
        await this.selectCards('P3', ['B15']);
        await this.clickButton('confirm-action');
        await this.discardCard('P3', 'B15');

        // P4's attack
        await this.setCurrentPlayer('P4');
        await this.drawCard('P4', 'adventure'); // L20
        console.log('P4 hand before attack:', await this.getPlayerHand('P4'));

        // P4's winning attack with two L20s
        await this.selectCards('P4', ['L20', 'L20']);
        await this.clickButton('confirm-action');
        await this.discardCard('P4', 'L20');

        // P4 wins and gets 4 shields
        await this.setShields('P4', 4);

        await this.cleanupQuestStages()

        // Verify final hands
        await this.verifyPlayerState('P3', {
            shields: 0,
            hand: ['F5', 'F5', 'F15', 'F30', 'S10']  // Now includes S10
        });

        await this.verifyPlayerState('P4', {
            shields: 4,
            hand: ['F15', 'F15', 'F40', 'L20']
        });

        // Verify P2's final hand count
        const p2Hand = await this.getPlayerHand('P2');
        console.log('P2 final hand after cleanup:', p2Hand);
        if (p2Hand.length !== 12) {
            throw new Error(`P2 should have 12 cards after cleanup, but has ${p2Hand.length}`);
        }
    }

    async cleanupQuestStages() {
        console.log('Cleaning up quest stages...');

        // Get P2's current hand
        const p2Hand = await this.getPlayerHand('P2');
        console.log('P2 hand before cleanup:', p2Hand);

        // 1. Remove the staged cards
        await this.driver.executeScript(`
        const hand = window.gameState.players['P2'].cards;
        window.gameState.players['P2'].cards = hand.filter(card => 
            !['F15', 'F25', 'F45', 'F65'].includes(card)
        );
        updatePlayerHand('P2', window.gameState.players['P2'].cards);
    `);

        // 2. Draw 13 random cards
        for (let i = 0; i < 13; i++) {
            await this.drawCard('P2', 'adventure');
        }

        // 3. Trim down to 12 cards (remove the last card)
        await this.driver.executeScript(`
        const hand = window.gameState.players['P2'].cards;
        window.gameState.players['P2'].cards = hand.slice(0, 12);
        updatePlayerHand('P2', window.gameState.players['P2'].cards);
    `);

        // Verify final count
        const finalHand = await this.getPlayerHand('P2');
        console.log('P2 final hand after cleanup:', finalHand);
        if (finalHand.length !== 12) {
            throw new Error(`P2 should have 12 cards after cleanup, but has ${finalHand.length}`);
        }
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
        // Verify P3's hand after attack
        await this.verifyPlayerState('P3', {
            shields: 0,
            hand: ['F5', 'F5', 'F15', 'B15']  // Remaining cards after discarding attack cards
        });

        // Verify P4's hand after attack
        await this.verifyPlayerState('P4', {
            shields: 0,
            hand: ['F15', 'F15', 'F40', 'L20']  // Remaining cards after discarding attack cards
        });
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