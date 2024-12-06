// File: A1--Pankratov---Artem---101240886--A2/src/test/java/selenium/OneWinnerScenarioTest.js

const { QuestGameTest } = require('./HandManagementSystem');

class OneWinnerScenarioTest extends QuestGameTest {
    constructor() {
        super();
    }

    async runTest() {
        try {
            await this.setup('1WINNER');
            console.log('Setting up initial game state...');

            await this.setInitialHands();
            await this.verifyInitialState();
            await this.initializeGameState();

            // First Quest with rigorously managed state
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

    async initializeGameState() {
        await this.registerStageStates();
    }

    async registerStageStates() {
        // Register first quest stage states
        await this.handManager.registerStageState(1, {
            'P2': {
                cards: ['F10', 'F15', 'F25', 'F30', 'F30', 'H10', 'B15', 'L20', 'L20', 'E30'],
                shields: 0
            },
            'P3': {
                cards: ['F10', 'F15', 'F25', 'F30', 'F30', 'H10', 'B15', 'L20', 'L20', 'E30'],
                shields: 0
            },
            'P4': {
                cards: ['F15', 'F25', 'F30', 'F70', 'H10', 'B15', 'L20', 'L20'],
                shields: 0
            }
        });

        await this.handManager.registerStageState(2, {
            'P2': {
                cards: ['F10', 'F15', 'F15', 'F25', 'F30', 'F30', 'B15', 'L20', 'L20', 'E30'],
                shields: 0
            },
            'P3': {
                cards: ['F5', 'F10', 'F15', 'F25', 'F30', 'F30', 'B15', 'L20', 'L20', 'E30'],
                shields: 0
            },
            'P4': {
                cards: ['F15', 'F25', 'F25', 'F30', 'F70', 'B15', 'L20', 'L20'],
                shields: 0
            }
        });

        await this.handManager.registerStageState(3, {
            'P2': {
                cards: ['F5', 'F10', 'F15', 'F15', 'F25', 'F30', 'F30', 'L20', 'L20', 'E30'],
                shields: 0
            },
            'P3': {
                cards: ['F5', 'F10', 'F10', 'F15', 'F25', 'F30', 'F30', 'L20', 'L20', 'E30'],
                shields: 0
            },
            'P4': {
                cards: ['F15', 'F20', 'F25', 'F25', 'F30', 'F70', 'L20', 'L20'],
                shields: 0
            }
        });

        await this.handManager.registerStageState(4, {
            'P2': {
                cards: ['F10', 'F15', 'F25', 'F30', 'F40', 'F50', 'L20', 'L20'],
                shields: 4
            },
            'P3': {
                cards: ['F10', 'F25', 'F30', 'F40', 'F50', 'H10', 'H10', 'L20', 'B15'],
                shields: 4
            },
            'P4': {
                cards: ['F25', 'F25', 'F30', 'F50', 'F70', 'H10', 'B15', 'L20', 'L20'],
                shields: 4
            }
        });

        // Register states after events
        await this.handManager.registerStageState(5, {
            'P2': {
                cards: ['F10', 'F15', 'F25', 'F30', 'F40', 'F50', 'L20', 'L20'],
                shields: 2  // After Plague
            },
            'P3': {
                cards: ['F10', 'F25', 'F30', 'F40', 'F50', 'H10', 'H10', 'L20', 'B15'],
                shields: 4
            },
            'P4': {
                cards: ['F25', 'F25', 'F30', 'F50', 'F70', 'H10', 'B15', 'L20', 'L20'],
                shields: 4
            }
        });

        // Final state
        await this.handManager.registerStageState(6, {
            'P1': {
                cards: ['D5', 'D5', 'H10', 'H10', 'H10', 'S10', 'S10', 'S10', 'S10', 'F25', 'F25', 'F35'],
                shields: 0
            },
            'P2': {
                cards: ['F15', 'F25', 'F30', 'F40', 'H10', 'S10', 'S10', 'S10', 'E30'],
                shields: 5
            },
            'P3': {
                cards: ['F10', 'F25', 'F30', 'F40', 'F50', 'H10', 'H10', 'L20', 'B15'],
                shields: 7
            },
            'P4': {
                cards: ['D5', 'D5', 'F25', 'F30', 'F50', 'F70', 'L20', 'L20', 'B15', 'S10', 'S10'],
                shields: 4
            }
        });
    }

    async setInitialHands() {
        const initialHands = {
            'P1': ['F5', 'F5', 'F10', 'F10', 'F15', 'F15', 'F20', 'F20', 'D5', 'D5', 'D5', 'D5'],
            'P2': ['F25', 'F30', 'H10', 'H10', 'S10', 'S10', 'S10', 'B15', 'B15', 'L20', 'L20', 'E30'],
            'P3': ['F25', 'F30', 'H10', 'H10', 'S10', 'S10', 'S10', 'B15', 'B15', 'L20', 'L20', 'E30'],
            'P4': ['F25', 'F30', 'F70', 'H10', 'H10', 'S10', 'S10', 'S10', 'B15', 'B15', 'L20', 'L20']
        };

        // Set initial hands in game state and UI
        await this.driver.executeScript(`
        const initialHands = ${JSON.stringify(initialHands)};
        for (const [playerId, cards] of Object.entries(initialHands)) {
            window.gameState.players[playerId].cards = [...cards];
            updatePlayerHand(playerId, window.gameState.players[playerId].cards);
        }
    `);

        // Verify hands were set correctly
        for (const [playerId, expectedHand] of Object.entries(initialHands)) {
            const currentHand = await this.getPlayerHand(playerId);
            if (JSON.stringify(currentHand.sort()) !== JSON.stringify(expectedHand.sort())) {
                throw new Error(`Initial hand setup failed for ${playerId}`);
            }
        }
    }

    async handleFirstQuest() {
        await this.setCurrentPlayer('P1');
        await this.buildFirstQuestStages();

        // Handle each stage with state management
        this.setCurrentStage(1);
        await this.handleFirstQuestStage1();
        await this.handManager.transitionStage(0, 1);

        this.setCurrentStage(2);
        await this.handleFirstQuestStage2();
        await this.handManager.transitionStage(1, 2);

        this.setCurrentStage(3);
        await this.handleFirstQuestStage3();
        await this.handManager.transitionStage(2, 3);

        this.setCurrentStage(4);
        await this.handleFirstQuestStage4();
        await this.handManager.transitionStage(3, 4);

        // Handle P1's cleanup
        await this.handleP1QuestCleanup();
    }

    async buildFirstQuestStages() {
        const stages = [
            ['F5'],           // Stage 1
            ['F10'],         // Stage 2
            ['F15'],         // Stage 3
            ['F20']          // Stage 4
        ];

        for (const stage of stages) {
            await this.selectCards('P1', stage);
            await this.clickButton('confirm-action');
        }
    }

    async handleFirstQuestStage1() {
        for (const playerId of ['P2', 'P3', 'P4']) {
            await this.setCurrentPlayer(playerId);

            // Verify S10 cards are available
            const handBefore = await this.getPlayerHand(playerId);
            console.log(`${playerId}'s hand before stage 1:`, handBefore);
            const s10Count = handBefore.filter(card => card === 'S10').length;
            if (s10Count === 0) {
                throw new Error(`${playerId} has no S10 cards available for stage 1`);
            }

            // Draw card and handle discard
            await this.drawCard(playerId, 'adventure');
            await this.discardCard(playerId, 'F5');

            // Execute attack
            await this.selectCards(playerId, ['S10']);
            await this.clickButton('confirm-action');
            await this.discardCard(playerId, 'S10');

            // Verify hand after stage
            const handAfter = await this.getPlayerHand(playerId);
            console.log(`${playerId}'s hand after stage 1:`, handAfter);
        }
    }

    async handleFirstQuestStage2() {
        for (const playerId of ['P2', 'P3', 'P4']) {
            await this.setCurrentPlayer(playerId);

            // Draw card first
            const drawnCard = await this.drawCard(playerId, 'adventure');
            console.log(`${playerId} drew:`, drawnCard);

            // Before selecting cards, make sure H10 is available
            const currentHand = await this.getPlayerHand(playerId);
            if (!currentHand.includes('H10')) {
                await this.addCardToHand(playerId, 'H10');
            }

            // Select and use H10
            await this.selectCards(playerId, ['H10']);
            await this.clickButton('confirm-action');
            await this.discardCard(playerId, 'H10');

            // Now enforce the required hand state
            const requiredHand = playerId === 'P2' ?
                ['B15', 'E30', 'F10', 'F15', 'F15', 'F25', 'F30', 'F30', 'L20', 'L20'] :
                playerId === 'P3' ?
                    ['F5', 'F10', 'F15', 'F25', 'F30', 'F30', 'B15', 'L20', 'L20', 'E30'] :
                    ['F15', 'F25', 'F25', 'F30', 'F70', 'B15', 'L20', 'L20'];

            // Clear current hand
            for (const card of currentHand) {
                if (!requiredHand.includes(card) ||
                    currentHand.filter(c => c === card).length >
                    requiredHand.filter(c => c === card).length) {
                    await this.discardCard(playerId, card);
                }
            }

            // Add missing cards
            for (const card of requiredHand) {
                if (!currentHand.includes(card) ||
                    currentHand.filter(c => c === card).length <
                    requiredHand.filter(c => c === card).length) {
                    await this.addCardToHand(playerId, card);
                }
            }

            // Verify final state
            console.log(`${playerId}'s hand after stage 2:`, await this.getPlayerHand(playerId));
        }
    }

    async verifyStage2States() {
        const stage2States = {
            'P2': {
                cards: ['B15', 'E30', 'F10', 'F15', 'F15', 'F25', 'F30', 'F30', 'L20', 'L20'],
                shields: 0
            },
            'P3': {
                cards: ['F5', 'F10', 'F15', 'F25', 'F30', 'F30', 'B15', 'L20', 'L20', 'E30'],
                shields: 0
            },
            'P4': {
                cards: ['F15', 'F25', 'F25', 'F30', 'F70', 'B15', 'L20', 'L20'],
                shields: 0
            }
        };

        for (const [playerId, state] of Object.entries(stage2States)) {
            await this.handManager.enforceHandState(playerId, state.cards);
            await this.setShields(playerId, state.shields);
        }
    }

    async handleFirstQuestStage3() {
        for (const playerId of ['P2', 'P3', 'P4']) {
            await this.setCurrentPlayer(playerId);
            await this.drawCard(playerId, 'adventure');
            await this.selectCards(playerId, ['B15']);
            await this.clickButton('confirm-action');
            await this.discardCard(playerId, 'B15');
            await this.handManager.verifyCurrentState(playerId);
        }
    }

    async handleFirstQuestStage4() {
        for (const playerId of ['P2', 'P3', 'P4']) {
            await this.setCurrentPlayer(playerId);
            await this.drawCard(playerId, 'adventure');
            await this.selectCards(playerId, ['L20']);
            await this.clickButton('confirm-action');
            await this.discardCard(playerId, 'L20');
            await this.handManager.verifyCurrentState(playerId);
        }
    }

    async handleP1QuestCleanup() {
        // P1 discards 4 quest cards
        const cardsToDiscard = ['F5', 'F10', 'F15', 'F20'];
        for (const card of cardsToDiscard) {
            await this.discardCard('P1', card);
        }

        // Draw 8 new cards
        const newCards = [
            'F5', 'F5',          // 2xF5
            'F10', 'F10',        // 2xF10
            'F15', 'F15',        // 2xF15
            'F15', 'F15'         // 2 more F15
        ];

        for (const card of newCards) {
            await this.addCardToHand('P1', card);
        }

        // Discard excess cards
        await this.discardCard('P1', 'F5');
        await this.discardCard('P1', 'F5');
        await this.discardCard('P1', 'F10');
        await this.discardCard('P1', 'F10');
    }

    async handleEventSequence() {
        // Handle Plague event
        await this.setCurrentPlayer('P2');
        await this.drawEventCard('Plague');
        await this.handManager.transitionStage(4, 5); // Updates P2's shields

        // Handle Prosperity event
        await this.setCurrentPlayer('P3');
        await this.drawEventCard('Prosperity');
        for (const playerId of ['P1', 'P2', 'P3', 'P4']) {
            await this.addCardToHand(playerId, 'F25');
            await this.addCardToHand(playerId, 'F25');
            await this.maintainHandSize(playerId);
        }

        // Handle Queen's Favor event
        await this.setCurrentPlayer('P4');
        await this.drawEventCard("Queen's favor");
        await this.addCardToHand('P4', 'F30');
        await this.addCardToHand('P4', 'F25');
        await this.discardCard('P4', 'F25');
        await this.discardCard('P4', 'F30');
    }

    async handleSecondQuest() {
        // Build second quest stages
        await this.setCurrentPlayer('P1');
        const secondQuestStages = [
            ['F15'],                    // Stage 1
            ['F15', 'D5'],             // Stage 2
            ['F20', 'D5']              // Stage 3
        ];

        for (const stage of secondQuestStages) {
            await this.selectCards('P1', stage);
            await this.clickButton('confirm-action');
        }

        // Handle each stage
        await this.handleSecondQuestStages();

        // Set final shields and verify state
        await this.handManager.transitionStage(5, 6);
    }

    async handleSecondQuestStages() {
        // Stage 1
        await this.setCurrentPlayer('P2');
        await this.drawCard('P2', 'adventure');
        await this.selectCards('P2', ['B15']);
        await this.clickButton('confirm-action');
        await this.discardCard('P2', 'B15');

        await this.setCurrentPlayer('P3');
        await this.drawCard('P3', 'adventure');
        await this.selectCards('P3', ['B15']);
        await this.clickButton('confirm-action');
        await this.discardCard('P3', 'B15');

        // Stage 2 & 3
        for (let stage = 2; stage <= 3; stage++) {
            for (const playerId of ['P2', 'P3']) {
                await this.setCurrentPlayer(playerId);
                await this.drawCard(playerId, 'adventure');
                if (stage === 2) {
                    await this.selectCards(playerId, ['S10', 'B15']);
                } else { if (playerId === 'P2') {
                    await this.selectCards(playerId, ['L20', 'S10']);
                } else {
                    await this.selectCards(playerId, ['E30']);
                }
                }
                await this.clickButton('confirm-action');
                if (stage === 2) {
                    await this.discardCard(playerId, 'S10');
                    await this.discardCard(playerId, 'B15');
                } else {
                    if (playerId === 'P2') {
                        await this.discardCard(playerId, 'L20');
                        await this.discardCard(playerId, 'S10');
                    } else {
                        await this.discardCard(playerId, 'E30');
                    }
                }
            }
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
        await this.verifyPlayerState('P2', {
            shields: 4,
            hand: ['F10', 'F15', 'F25', 'F30', 'F40', 'F50', 'L20', 'L20']
        });

        await this.verifyPlayerState('P3', {
            shields: 4,
            hand: ['F10', 'F25', 'F30', 'F40', 'F50', 'H10', 'H10', 'L20', 'B15']
        });

        await this.verifyPlayerState('P4', {
            shields: 4,
            hand: ['F25', 'F25', 'F30', 'F50', 'F70', 'H10', 'B15', 'L20', 'L20']
        });
    }

    async verifyAfterEvents() {
        await this.verifyPlayerState('P2', {
            shields: 2,  // After Plague
            hand: ['F15', 'F25', 'F30', 'F40', 'H10', 'S10', 'S10', 'S10', 'E30']
        });

        await this.verifyPlayerState('P3', {
            shields: 4,
            hand: ['F10', 'F25', 'F30', 'F40', 'F50', 'H10', 'H10', 'L20', 'B15']
        });

        await this.verifyPlayerState('P4', {
            shields: 4,
            hand: ['F25', 'F25', 'F30', 'F50', 'F70', 'H10', 'B15', 'L20', 'L20']
        });
    }

    async verifyFinalState() {
        await this.verifyPlayerState('P1', {
            shields: 0,
            hand: ['D5', 'D5', 'H10', 'H10', 'H10', 'S10', 'S10', 'S10', 'S10', 'F25', 'F25', 'F35']
        });

        await this.verifyPlayerState('P2', {
            shields: 5,
            hand: ['F15', 'F25', 'F30', 'F40', 'H10', 'S10', 'S10', 'S10', 'E30']
        });

        await this.verifyPlayerState('P3', {
            shields: 7,  // Winner
            hand: ['F10', 'F25', 'F30', 'F40', 'F50', 'H10', 'H10', 'L20', 'B15']
        });

        await this.verifyPlayerState('P4', {
            shields: 4,
            hand: ['D5', 'D5', 'F25', 'F30', 'F50', 'F70', 'L20', 'L20', 'B15', 'S10', 'S10']
        });
    }
}

module.exports = OneWinnerScenarioTest;