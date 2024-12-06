const { By } = require('selenium-webdriver');
const BaseSeleniumTest = require('./BaseSeleniumTest');
const assert = require('assert');

class OneWinnerScenarioTest extends BaseSeleniumTest {
    constructor() {
        super();
    }

    async runTest() {
        try {
            await this.setup('1WINNER');
            console.log('Setting up initial game state...');

            await this.setInitialHands();
            await this.verifyInitialState();

            // First Quest
            await this.handleFirstQuest();
            await this.verifyAfterFirstQuest();

            // Event sequence
            await this.handleEventSequence();
            await this.verifyAfterEvents();

            // Second Quest
            await this.handleSecondQuest();
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
            'P1': ['F5', 'F5', 'F10', 'F10', 'F15', 'F15', 'F20', 'F20', 'D5', 'D5', 'D5', 'D5'],
            'P2': ['F25', 'F30', 'H10', 'H10', 'S10', 'S10', 'S10', 'B15', 'B15', 'L20', 'L20', 'E30'],
            'P3': ['F25', 'F30', 'H10', 'H10', 'S10', 'S10', 'S10', 'B15', 'B15', 'L20', 'L20', 'E30'],
            'P4': ['F25', 'F30', 'F70', 'H10', 'H10', 'S10', 'S10', 'S10', 'B15', 'B15', 'L20', 'L20']
        };

        for (const [playerId, cards] of Object.entries(initialHands)) {
            await this.setInitialHand(playerId, cards);
        }
    }

    async handleFirstQuest() {
        console.log('Handling first quest...');

        await this.setCurrentPlayer('P1');
        await this.buildFirstQuestStages();

        // Handle each stage
        await this.handleFirstQuestStage1();
        await this.handleFirstQuestStage2();
        await this.handleFirstQuestStage3();
        await this.handleFirstQuestStage4();

        // Award shields to winners
        await this.setShields('P2', 4);
        await this.setShields('P3', 4);
        await this.setShields('P4', 4);

        // Handle P1's cleanup
        await this.handleP1QuestCleanup();
    }

    async buildFirstQuestStages() {
        const stages = [
            ['F5'],             // Stage 1
            ['F10'],            // Stage 2
            ['F15'],           // Stage 3
            ['F20']            // Stage 4
        ];

        for (const stage of stages) {
            await this.selectCards('P1', stage);
            await this.clickButton('confirm-action');
        }
    }

    async handleFirstQuestStage1() {
        for (const playerId of ['P2', 'P3', 'P4']) {
            await this.setCurrentPlayer(playerId);
            const drawnCard = await this.drawCard(playerId);

            // Each player uses sword to win
            await this.selectCards(playerId, ['S10']);
            await this.clickButton('confirm-action');
            await this.discardCard(playerId, 'S10');
            await this.maintainHandSize(playerId);
        }
    }

    async handleFirstQuestStage2() {
        for (const playerId of ['P2', 'P3', 'P4']) {
            await this.setCurrentPlayer(playerId);
            const drawnCard = await this.drawCard(playerId);

            // Each player uses horse to win
            await this.selectCards(playerId, ['H10']);
            await this.clickButton('confirm-action');
            await this.discardCard(playerId, 'H10');
            await this.maintainHandSize(playerId);
        }
    }

    async handleFirstQuestStage3() {
        for (const playerId of ['P2', 'P3', 'P4']) {
            await this.setCurrentPlayer(playerId);
            const drawnCard = await this.drawCard(playerId);

            // Each player uses battle axe to win
            await this.selectCards(playerId, ['B15']);
            await this.clickButton('confirm-action');
            await this.discardCard(playerId, 'B15');
            await this.maintainHandSize(playerId);
        }
    }

    async handleFirstQuestStage4() {
        for (const playerId of ['P2', 'P3', 'P4']) {
            await this.setCurrentPlayer(playerId);
            const drawnCard = await this.drawCard(playerId);

            // Each player uses lance to win
            await this.selectCards(playerId, ['L20']);
            await this.clickButton('confirm-action');
            await this.discardCard(playerId, 'L20');
            await this.maintainHandSize(playerId);
        }
    }

    async handleP1QuestCleanup() {
        const expectedFinalState = {
            hand: [
                'F15', 'F15', 'F15', 'F15',
                'D5', 'D5', 'D5', 'D5'
            ],
            shields: 0
        };

        await this.executeStateTransition('P1',
            async () => {
                // Discard quest cards
                const cardsToDiscard = ['F5', 'F10', 'F15', 'F20'];
                for (const card of cardsToDiscard) {
                    await this.discardCard('P1', card);
                }

                // Draw 8 new cards
                const newCards = ['F15', 'F15', 'F15', 'F15', 'D5', 'D5', 'D5', 'D5'];
                for (const card of newCards) {
                    await this.addCardToHand('P1', card);
                }
            },
            expectedFinalState
        );
    }

    async handleEventSequence() {
        console.log('Handling event sequence...');

        // P2 draws Plague
        await this.setCurrentPlayer('P2');
        await this.drawEventCard('Plague');
        await this.handleEventEffect('Plague', 'P2');

        // Verify P2's shields after Plague
        const p2Shields = await this.getShields('P2');
        assert.strictEqual(p2Shields, 2, 'P2 should have 2 shields after Plague');

        // P3 draws Prosperity
        await this.setCurrentPlayer('P3');
        await this.drawEventCard('Prosperity');
        await this.handleEventEffect('Prosperity');

        // Verify all players' hands after Prosperity
        for (const playerId of ['P1', 'P2', 'P3', 'P4']) {
            const hand = await this.getPlayerHand(playerId);
            assert.strictEqual(hand.length, 12, `${playerId} should have 12 cards after Prosperity`);
        }

        // P4 draws Queen's favor
        await this.setCurrentPlayer('P4');
        await this.drawEventCard("Queen's favor");
        await this.handleEventEffect("Queen's favor", 'P4');

        // Verify P4's hand after Queen's favor
        const p4Hand = await this.getPlayerHand('P4');
        assert.strictEqual(p4Hand.length, 12, "P4 should have 12 cards after Queen's favor");
    }

    async handleSecondQuest() {
        console.log('Handling second quest...');

        // P1 sponsors second quest
        await this.setCurrentPlayer('P1');
        await this.buildSecondQuestStages();

        // Handle stages
        await this.handleSecondQuestStage1();
        await this.handleSecondQuestStage2();
        await this.handleSecondQuestStage3();

        // Award shields and determine winner
        await this.addShields('P2', 3);
        await this.addShields('P3', 3);

        // P1 cleanup
        await this.handleSecondQuestCleanup();
    }

    async buildSecondQuestStages() {
        const stages = [
            ['F15'],                    // Stage 1
            ['F15', 'D5'],             // Stage 2
            ['F20', 'D5']              // Stage 3
        ];

        for (const stage of stages) {
            await this.selectCards('P1', stage);
            await this.clickButton('confirm-action');
        }
    }

    async handleSecondQuestStage1() {
        // P2, P3, P4 participate
        for (const playerId of ['P2', 'P3', 'P4']) {
            await this.setCurrentPlayer(playerId);
            const drawnCard = await this.drawCard(playerId);

            if (playerId === 'P4') {
                // P4 loses
                await this.selectCards(playerId, ['H10']);
                await this.clickButton('confirm-action');
                continue;
            }

            // P2 and P3 win with axe
            await this.selectCards(playerId, ['B15']);
            await this.clickButton('confirm-action');
            await this.discardCard(playerId, 'B15');
            await this.maintainHandSize(playerId);
        }
    }

    async handleSecondQuestStage2() {
        for (const playerId of ['P2', 'P3']) {
            await this.setCurrentPlayer(playerId);
            const drawnCard = await this.drawCard(playerId);

            // Attack with axe + sword
            await this.selectCards(playerId, ['B15', 'S10']);
            await this.clickButton('confirm-action');
            await this.discardCard(playerId, 'B15');
            await this.discardCard(playerId, 'S10');
            await this.maintainHandSize(playerId);
        }
    }

    async handleSecondQuestStage3() {
        for (const playerId of ['P2', 'P3']) {
            await this.setCurrentPlayer(playerId);
            const drawnCard = await this.drawCard(playerId);

            if (playerId === 'P2') {
                await this.selectCards(playerId, ['L20', 'S10']);
            } else {
                await this.selectCards(playerId, ['E30']);
            }
            await this.clickButton('confirm-action');

            // Discard used cards
            if (playerId === 'P2') {
                await this.discardCard(playerId, 'L20');
                await this.discardCard(playerId, 'S10');
            } else {
                await this.discardCard(playerId, 'E30');
            }
            await this.maintainHandSize(playerId);
        }
    }

    async handleSecondQuestCleanup() {
        await this.setCurrentPlayer('P1');

        // Draw 8 cards
        const newCards = ['H10', 'H10', 'H10', 'S10', 'S10', 'S10', 'S10', 'F35'];
        for (const card of newCards) {
            await this.addCardToHand('P1', card);
        }

        // Discard excess cards
        const toDiscard = ['F15', 'F15', 'F15'];
        for (const card of toDiscard) {
            await this.discardCard('P1', card);
        }
    }



    async verifyInitialState() {
        for (const [playerId, expectedHand] of Object.entries({
            'P1': ['F5', 'F5', 'F10', 'F10', 'F15', 'F15', 'F20', 'F20', 'D5', 'D5', 'D5', 'D5'],
            'P2': ['F25', 'F30', 'H10', 'H10', 'S10', 'S10', 'S10', 'B15', 'B15', 'L20', 'L20', 'E30'],
            'P3': ['F25', 'F30', 'H10', 'H10', 'S10', 'S10', 'S10', 'B15', 'B15', 'L20', 'L20', 'E30'],
            'P4': ['F25', 'F30', 'F70', 'H10', 'H10', 'S10', 'S10', 'S10', 'B15', 'B15', 'L20', 'L20']
        })) {
            await this.verifyPlayerState(playerId, {
                shields: 0,
                hand: expectedHand
            });
        }
    }

    async verifyAfterFirstQuest() {
        // Verify P1's exact state
        await this.enforcePlayerState('P1', {
            shields: 0,
            hand: ['F15', 'F15', 'F15', 'F15', 'D5', 'D5', 'D5', 'D5']
        });

        // Verify other players' shields
        for (const playerId of ['P2', 'P3', 'P4']) {
            assert.strictEqual(
                await this.getShields(playerId),
                4,
                `${playerId} should have 4 shields after first quest`
            );
        }
    }

    async verifyAfterEvents() {
        // Verify P2's shields after Plague
        await this.verifyPlayerState('P2', {
            shields: 2,
            hand: expect12Cards  // Define expected cards
        });

        // Verify all players have correct number of cards
        for (const playerId of ['P1', 'P3', 'P4']) {
            const hand = await this.getPlayerHand(playerId);
            assert.strictEqual(hand.length, 12,
                `${playerId} should have 12 cards after events`);
        }
    }

    async verifyFinalState() {
        // Verify P3 as winner
        assert.strictEqual(await this.getShields('P3'), 7,
            'P3 should have 7 shields and be the winner');

        // Verify final hands
        await this.verifyPlayerState('P1', {
            hand: ['D5', 'D5', 'D5', 'D5', 'H10', 'H10', 'H10', 'S10', 'S10', 'S10', 'S10', 'F35']
        });

        await this.verifyPlayerState('P2', {
            shields: 5,
            hand: ['F15', 'F25', 'F30', 'F40', 'H10', 'S10', 'S10', 'S10', 'E30']
        });

        await this.verifyPlayerState('P3', {
            shields: 7,
            hand: ['F10', 'F25', 'F30', 'F40', 'F50', 'H10', 'H10', 'L20', 'B15']
        });

        await this.verifyPlayerState('P4', {
            shields: 4,
            hand: ['D5', 'D5', 'F25', 'F30', 'F50', 'F70', 'L20', 'L20', 'B15', 'S10', 'S10']
        });

        // Verify required properties of final state
        const p3Shields = await this.getShields('P3');
        assert.strictEqual(p3Shields, 7, 'P3 should be the winner with 7 shields');

        const p2Shields = await this.getShields('P2');
        assert.strictEqual(p2Shields, 5, 'P2 should have 5 shields (4 from first quest + 3 from second - 2 from plague)');

        const p4Shields = await this.getShields('P4');
        assert.strictEqual(p4Shields, 4, 'P4 should have 4 shields from first quest only');
    }
}

module.exports = OneWinnerScenarioTest;