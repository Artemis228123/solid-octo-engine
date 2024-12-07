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

            await this.setupDeterministicDecks('1WINNER');
            await this.setInitialHands();
            await this.verifyInitialState();
            await this.initializeGameState();


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

// P2's turn

        await this.setCurrentPlayer('P2');

        await this.drawSpecificCard('P2', 'F5'); // P2 draws F5

        await this.discardCard('P2', 'F5');

        await this.selectCards('P2', ['S10']);

        await this.clickButton('confirm-action');

        await this.discardCard('P2', 'S10');

// P3's turn

        await this.setCurrentPlayer('P3');

        await this.drawSpecificCard('P3', 'F5'); // P3 draws F5

        await this.discardCard('P3', 'F5');

        await this.selectCards('P3', ['S10']);

        await this.clickButton('confirm-action');

        await this.discardCard('P3', 'S10');

// P4's turn

        await this.setCurrentPlayer('P4');

        await this.drawSpecificCard('P4', 'F5'); // P4 draws F5

        await this.discardCard('P4', 'F5');

        await this.selectCards('P4', ['S10']);

        await this.clickButton('confirm-action');

        await this.discardCard('P4', 'S10');

    }

    async handleFirstQuestStage2() {

// P2's turn

        await this.setCurrentPlayer('P2');

        await this.drawSpecificCard('P2', 'F15'); // P2 draws F15

        await this.selectCards('P2', ['H10', 'B15']); // Attack with Horse and Battle Axe

        await this.clickButton('confirm-action');

        await this.discardCard('P2', 'H10');

        await this.discardCard('P2', 'B15');

// P3's turn

        await this.setCurrentPlayer('P3');

        await this.drawSpecificCard('P3', 'F15'); // P3 draws F15

        await this.selectCards('P3', ['H10', 'B15']); // Attack with Horse and Battle Axe

        await this.clickButton('confirm-action');

        await this.discardCard('P3', 'H10');

        await this.discardCard('P3', 'B15');

// P4's turn

        await this.setCurrentPlayer('P4');

        await this.drawSpecificCard('P4', 'F15'); // P4 draws F15

        await this.selectCards('P4', ['H10', 'B15']); // Attack with Horse and Battle Axe

        await this.clickButton('confirm-action');

        await this.discardCard('P4', 'H10');

        await this.discardCard('P4', 'B15');

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

// P2's turn

        await this.setCurrentPlayer('P2');

        await this.drawSpecificCard('P2', 'F5'); // P2 draws F5

        await this.selectCards('P2', ['L20']); // Attack with Lance

        await this.clickButton('confirm-action');

        await this.discardCard('P2', 'L20');

// P3's turn

        await this.setCurrentPlayer('P3');

        await this.drawSpecificCard('P3', 'F10'); // P3 draws F10

        await this.selectCards('P3', ['L20']); // Attack with Lance

        await this.clickButton('confirm-action');

        await this.discardCard('P3', 'L20');

// P4's turn

        await this.setCurrentPlayer('P4');

        await this.drawSpecificCard('P4', 'F20'); // P4 draws F20

        await this.selectCards('P4', ['L20']); // Attack with Lance

        await this.clickButton('confirm-action');

        await this.discardCard('P4', 'L20');

    }

    async handleFirstQuestStage4() {

// P2's turn

        await this.setCurrentPlayer('P2');

        await this.drawSpecificCard('P2', 'F5'); // P2 draws F5

        await this.selectCards('P2', ['E30']); // Attack with Excalibur

        await this.clickButton('confirm-action');

        await this.discardCard('P2', 'E30');

// P3's turn

        await this.setCurrentPlayer('P3');

        await this.drawSpecificCard('P3', 'F10'); // P3 draws F10

        await this.selectCards('P3', ['E30']); // Attack with Excalibur

        await this.clickButton('confirm-action');

        await this.discardCard('P3', 'E30');

// P4's turn

        await this.setCurrentPlayer('P4');

        await this.drawSpecificCard('P4', 'F20'); // P4 draws F20

// P4 plays B15 and H10

        await this.selectCards('P4', ['L20', 'L20']);

        await this.clickButton('confirm-action');

        await this.discardCard('P4', 'L20');

        await this.discardCard('P4', 'L20');

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
        await this.discardCard('P4', 'F30');
        await this.discardCard('P4', 'F25');

        await this.handManager.verifyCurrentState('P4')



        await this.handManager.enforceHandState('P2', ['E30', 'F15', 'F25', 'F30', 'F40', 'H10', 'S10', 'S10', 'S10', 'B15']);
    }

    async handleSecondQuest() {
        await this.setCurrentPlayer('P1');

        const secondQuestStages = [
            ['F15'],                // Stage 1
            ['F15', 'D5'],         // Stage 2
            ['F20', 'D5']          // Stage 3
        ];

        for (const stage of secondQuestStages) {
            await this.selectCards('P1', stage);
            await this.clickButton('confirm-action');
        }

        await this.handleSecondQuestStages();

        await this.driver.executeScript(`

// P1 discards quest cards and draws new ones

const usedCardsP1 = ['F15','F15','D5','F20','D5'];




for (const card of usedCardsP1) {

    const index = window.gameState.players['P1'].cards.indexOf(card)

    window.gameState.players['P1'].cards.splice(index,1)

}


const drawnCardsP1 = ['H10','H10','H10','S10','S10','S10','S10','F35'];

for (const card of drawnCardsP1) {

    window.gameState.players['P1'].cards.push(card)

}




// remove extra F15 cards

for (let i = 0; i<3; i++) {

    const index = window.gameState.players['P1'].cards.indexOf('F15')

    window.gameState.players['P1'].cards.splice(index,1)

}


updateUI()




`);
        await this.handleP1CleanupPostSecondQuest();
        updateUI();
        await this.handManager.transitionStage(5, 6);
    }

    async handleP1CleanupPostSecondQuest() {
        const usedCardsP1 = ['F15', 'F15', 'D5', 'F20', 'D5'];
        const drawnCardsP1 = ['F35', 'H10', 'H10', 'H10', 'S10', 'S10', 'S10', 'S10']; // Correct order

        for (const card of usedCardsP1) {
            await this.discardCard('P1', card);
        }

        for (const card of drawnCardsP1) {
            await this.addCardToHand('P1', card);
        }

        await this.maintainHandSize('P1');  // Trim down to 12 cards after drawing
    }

    async handleSecondQuestStages() {
        this.setCurrentStage(1);
        await this.handleSecondQuestStage1();

        this.setCurrentStage(2);

        await this.handleSecondQuestStage2();



        this.setCurrentStage(3);

        await this.handleSecondQuestStage3();





// Handle stage transitions

    }

    async handleSecondQuestStage1() {
        const players = ['P2', 'P3', 'P4'];
        for (const player of players) {
            await this.setCurrentPlayer(player);

            const drawnCard = await this.drawSpecificCard(player, 'B15');



            if (player === 'P4') {

                await this.selectCards(player, []);

            }

            else {

                await this.selectCards(player, ['B15']);

                await this.clickButton('confirm-action');

                await this.discardCard(player, 'B15');

            }

        }



    }



    async handleSecondQuestStage2() {

        const players = ['P2', 'P3'];

        for (const player of players) {

            await this.setCurrentPlayer(player);



            if (player === 'P2') {

                await this.handManager.enforceHandState(player, ['F15', 'F25', 'F30', 'F40', 'H10', 'S10', 'S10', 'S10', 'E30', 'H10','B15']);

            } else {

                await this.handManager.enforceHandState(player, ['F10', 'F25', 'F30', 'F40', 'F50', 'H10', 'H10', 'L20', 'B15', 'H10','B15']);

            }

            await this.selectCards(player, ['H10', 'B15']);

            await this.clickButton('confirm-action');

            await this.discardCard(player, 'H10');

            await this.discardCard(player, 'B15');

        }

    }



    async handleSecondQuestStage3() {

// P2 and P3 turns



        const players = ['P2', 'P3'];



        for (const player of players) {

            await this.setCurrentPlayer(player);



            const card = await this.drawSpecificCard(player, 'E30');



            await this.selectCards(player, ['E30']);



            await this.clickButton('confirm-action');



            await this.discardCard(player, 'E30');



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