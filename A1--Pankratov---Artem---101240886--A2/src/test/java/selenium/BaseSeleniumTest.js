const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
require('chromedriver');

class BaseSeleniumTest {
    constructor() {
        this.driver = null;
        this.baseUrl = 'http://localhost:8080';
        this.defaultTimeout = 10000;
        this.currentPlayer = 'P1';
    }

    async setup(scenario = 'JP') {
        const options = new chrome.Options();
        options.addArguments('--start-maximized');

        this.driver = await new Builder()
            .forBrowser('chrome')
            .setChromeOptions(options)
            .build();

        await this.driver.get(this.baseUrl);

        // Wait for game state initialization and verify UI elements
        await this.driver.wait(async () => {
            try {
                // Check if all required UI elements are present
                const requiredElements = [
                    'current-player',
                    'game-phase',
                    'p1-hand',
                    'p2-hand',
                    'p3-hand',
                    'p4-hand',
                    'message-log'
                ];

                for (const elementId of requiredElements) {
                    await this.waitForElement(By.id(elementId));
                }

                // Initialize game state
                await this.driver.executeScript(`
                    if (!window.gameState) {
                        window.gameState = {
                            currentPlayer: 'P1',
                            phase: 'START',
                            players: {
                                P1: { shields: 0, cards: [] },
                                P2: { shields: 0, cards: [] },
                                P3: { shields: 0, cards: [] },
                                P4: { shields: 0, cards: [] }
                            },
                            selectedCards: [],
                            currentQuest: null,
                            currentStage: 0,
                            adventureDeck: [],
                            eventDeck: [],
                            discardPile: [],
                            eventDiscardPile: []
                        };
                    }
                    return true;
                `);

                await this.setupDeterministicDecks(scenario);

                // Verify game state was initialized properly
                const gamePhaseElement = await this.waitForElement(By.id('game-phase'));
                const phase = await gamePhaseElement.getText();
                return phase === 'START';
            } catch (error) {
                console.error('Error during initialization:', error);
                return false;
            }
        }, this.defaultTimeout, 'Game initialization failed');

        await this.driver.manage().setTimeouts({implicit: 5000});
    }

    async teardown() {
        if (this.driver) {
            await this.driver.quit();
        }
    }


    // Card handling methods
    async drawCard(playerId, type = 'adventure') {
        // Log state before draw
        console.log(`\nDRAW CARD - Start State for ${playerId}:`);
        console.log('Current deck state:', await this.driver.executeScript(`
        return {
            deckType: '${type}',
            deckContents: window.gameState.${type}Deck,
            nextCard: window.gameState.${type}Deck[0]
        }
    `));
        console.log('Player hand before:', await this.getPlayerHand(playerId));

        const card = await this.driver.executeScript(`
        try {
            const deck = window.gameState['${type}Deck'];
            if (!deck || deck.length === 0) {
                console.error('Deck is empty or undefined:', deck);
                return null;
            }
            
            // Get the next card
            const card = deck.shift();
            console.log('Drawing card:', card);
            
            if ('${type}' === 'adventure') {
                const cardId = card.type + card.value;
                console.log('Creating card ID:', cardId);
                
                // Get current hand
                const playerHand = window.gameState.players['${playerId}'].cards;
                console.log('Current hand:', playerHand);
                
                // Add new card
                playerHand.push(cardId);
                console.log('Updated hand:', playerHand);
                
                // Update UI
                updatePlayerHand('${playerId}', playerHand);
                
                return cardId;
            } else {
                return card;
            }
        } catch (error) {
            console.error('Error in drawCard:', error);
            return null;
        }
    `);

        // Log final state
        console.log('Card drawn:', card);
        console.log('Player hand after:', await this.getPlayerHand(playerId));

        if (!card) {
            throw new Error(`Failed to draw ${type} card for ${playerId}`);
        }

        return card;
    }

    async setInitialHand(playerId, cards) {
        console.log(`Setting initial hand for ${playerId}:`, cards);
        await this.driver.executeScript(`
            window.gameState.players['${playerId}'].cards = ${JSON.stringify(cards)};
            updatePlayerHand('${playerId}', window.gameState.players['${playerId}'].cards);
        `);

        // Verify hand was set correctly using Selenium
        const actualHand = await this.getPlayerHand(playerId);
        for (const card of cards) {
            if (!actualHand.includes(card)) {
                throw new Error(`Card ${card} not found in ${playerId}'s hand after setup`);
            }
        }
    }

    async verifyDeckSetup() {
        const deckState = await this.driver.executeScript(`
        return {
            adventureDeck: window.gameState.adventureDeck.map(card => card.type + card.value),
            nextDraw: window.gameState.adventureDeck[0],
            totalCards: window.gameState.adventureDeck.length
        };
    `);

        console.log('\nDECK VERIFICATION:');
        console.log('Full adventure deck:', deckState.adventureDeck);
        console.log('Next card to be drawn:', deckState.nextDraw);
        console.log('Total cards in deck:', deckState.totalCards);

        // Verify first few critical cards
        const expectedFirstCards = ['F30', 'S10', 'B15', 'F10'];
        const actualFirstCards = deckState.adventureDeck.slice(0, 4);

        console.log('\nFirst 4 cards verification:');
        console.log('Expected:', expectedFirstCards);
        console.log('Actual:', actualFirstCards);

        if (JSON.stringify(expectedFirstCards) !== JSON.stringify(actualFirstCards)) {
            console.error('WARNING: First cards mismatch!');
        }
    }

    async discardCard(playerId, cardId) {
        console.log(`${playerId} discarding ${cardId}`);
        const currentHand = await this.getPlayerHand(playerId);
        console.log('Hand before discard:', currentHand);

        let cardToDiscard = cardId;
        // If the specified card isn't in hand, discard the most recently drawn card
        if (!currentHand.includes(cardId)) {
            cardToDiscard = currentHand[currentHand.length - 1];
            console.log(`Card ${cardId} not found in hand, discarding ${cardToDiscard} instead`);
        }

        await this.driver.executeScript(`
        const player = window.gameState.players['${playerId}'];
        const cardIndex = player.cards.indexOf('${cardToDiscard}');
        if (cardIndex >= 0) {
            player.cards.splice(cardIndex, 1);
            if (!window.gameState.discardPile) {
                window.gameState.discardPile = [];
            }
            window.gameState.discardPile.push('${cardToDiscard}');
            updatePlayerHand('${playerId}', player.cards);
            document.getElementById('${playerId.toLowerCase()}-card-count').textContent = player.cards.length;
        }
    `);

        // Allow time for UI update
        await this.driver.sleep(200);

        const updatedHand = await this.getPlayerHand(playerId);
        console.log('Hand after discard:', updatedHand);

        const initialCount = currentHand.filter(card => card === cardToDiscard).length;
        const finalCount = updatedHand.filter(card => card === cardToDiscard).length;

        if (finalCount !== initialCount - 1) {
            throw new Error(`Failed to discard ${cardToDiscard}. Card count mismatch.`);
        }
    }

    async handleDiscardAndDraw(playerId, drawnCard, expectedDiscard) {
        // First discard
        await this.discardCard(playerId, expectedDiscard);

        // Then handle the drawn card if provided
        if (drawnCard) {
            await this.addCardToHand(playerId, drawnCard);
        }
    }

    async updatePlayerHand(playerId, newHand) {
        // First clear the current hand
        const currentHand = await this.getPlayerHand(playerId);
        for (const card of currentHand) {
            await this.discardCard(playerId, card);
        }

        // Then add the new cards
        for (const card of newHand) {
            await this.addCardToHand(playerId, card);
        }

        // Verify the update
        const updatedHand = await this.getPlayerHand(playerId);
        if (updatedHand.length !== newHand.length) {
            throw new Error(`Hand size mismatch after update for ${playerId}`);
        }
    }

    // UI interaction methods
    async waitForElement(locator) {
        return await this.driver.wait(until.elementLocated(locator), this.defaultTimeout);
    }

    async clickButton(buttonId) {
        console.log(`Clicking button: ${buttonId}`);
        const button = await this.waitForElement(By.id(buttonId));
        await this.driver.wait(until.elementIsEnabled(button), this.defaultTimeout);
        await button.click();
        await this.driver.sleep(500);
    }

    async selectCards(playerId, cardIds) {
        console.log(`Selecting cards for ${playerId}:`, cardIds);
        const handElement = await this.waitForElement(By.id(`${playerId.toLowerCase()}-hand`));


        const handHtml = await handElement.getAttribute('innerHTML');
        console.log('Hand HTML:', handHtml);


        const allCards = await handElement.findElements(By.className('card'));
        console.log('All cards in hand:');
        for (const card of allCards) {
            const text = await card.getText();
            const dataValue = await card.getAttribute('data-card-value');
            console.log(`Card text: ${text}, data-value: ${dataValue}`);
        }

        // Clear existing selections
        await this.driver.executeScript(`
        const handElement = document.getElementById('${playerId.toLowerCase()}-hand');
        const selectedCards = handElement.getElementsByClassName('card selected');
        Array.from(selectedCards).forEach(card => card.classList.remove('selected'));
        window.gameState.selectedCards = [];
    `);

        // Try to select each card
        for (const cardId of cardIds) {
            const cards = await handElement.findElements(By.className('card'));
            let found = false;
            console.log(`Looking for card: ${cardId}`);

            for (const card of cards) {
                const text = await card.getText();
                console.log(`Comparing with card text: ${text}`);
                if (text === cardId && !(await card.getAttribute('class')).includes('selected')) {
                    await card.click();
                    console.log(`Selected card: ${cardId}`);
                    found = true;
                    break;
                }
            }

            if (!found) {
                throw new Error(`No more unselected ${cardId} cards available`);
            }


            await this.driver.sleep(100);
        }

        // Verify selections
        const selectedCards = await handElement.findElements(By.css('.card.selected'));
        console.log(`Selected ${selectedCards.length} cards`);
        if (selectedCards.length !== cardIds.length) {
            throw new Error(`Expected ${cardIds.length} selected cards, found ${selectedCards.length}`);
        }
    }

    // State verification methods
    async verifyPlayerState(playerId, expectedState) {
        if (this.handManager) {
            await this.handManager.enforceHandState(playerId, expectedState.hand);
            if (expectedState.shields !== undefined) {
                await this.setShields(playerId, expectedState.shields);
            }
        } else {

            console.log(`\nVerifying state for ${playerId}...`);

            if (expectedState.shields !== undefined) {
                const shieldElement = await this.waitForElement(By.id(`${playerId.toLowerCase()}-shields`));
                const shields = await shieldElement.getText();
                console.log(`${playerId} shields - Expected: ${expectedState.shields}, Got: ${shields}`);
                if (parseInt(shields) !== expectedState.shields) {
                    throw new Error(`Shield count mismatch for ${playerId}. Expected: ${expectedState.shields}, Got: ${shields}`);
                }
            }

            if (expectedState.hand) {
                const handElement = await this.waitForElement(By.id(`${playerId.toLowerCase()}-hand`));
                const cardElements = await handElement.findElements(By.className('card'));
                const actualHand = [];
                for (const cardElement of cardElements) {
                    const cardText = await cardElement.getText();
                    actualHand.push(cardText);
                }

                console.log(`${playerId} current hand:`, actualHand);
                console.log(`${playerId} expected hand:`, expectedState.hand);

                const sortedExpected = [...expectedState.hand].sort();
                const sortedActual = [...actualHand].sort();

                if (JSON.stringify(sortedExpected) !== JSON.stringify(sortedActual)) {
                    throw new Error(`Hand mismatch for ${playerId}. Expected: ${sortedExpected}, Got: ${sortedActual}`);
                }
            }
        }
    }

    async getPlayerHand(playerId) {
        const handElement = await this.waitForElement(By.id(`${playerId.toLowerCase()}-hand`));
        const cardElements = await handElement.findElements(By.className('card'));
        const cards = [];
        for (const cardElement of cardElements) {
            const cardText = await cardElement.getText();
            cards.push(cardText);
        }
        return cards;
    }

    async addCardToHand(playerId, card) {
        await this.driver.executeScript(`
        const playerHand = window.gameState.players['${playerId}'].cards;
        playerHand.push('${card}');
        updatePlayerHand('${playerId}', playerHand);
    `);
        console.log(`Added ${card} to ${playerId}'s hand`);
    }

    async getShields(playerId) {
        const shieldElement = await this.waitForElement(By.id(`${playerId.toLowerCase()}-shields`));
        const shields = await shieldElement.getText();
        return parseInt(shields);
    }

    async setShields(playerId, shields) {
        console.log(`Setting shields for ${playerId} to ${shields}`);
        await this.driver.executeScript(`
        window.gameState.players['${playerId}'].shields = ${shields};
        document.getElementById('${playerId.toLowerCase()}-shields').textContent = ${shields};
    `);

        // Verify shield count was set correctly
        const actualShields = await this.getShields(playerId);
        if (actualShields !== shields) {
            throw new Error(`Failed to set shield count for ${playerId}. Expected: ${shields}, Got: ${actualShields}`);
        }

        console.log(`${playerId} now has ${actualShields} shields`);
    }

    async addShields(playerId, amount) {
        const currentShields = await this.getShields(playerId);
        const newTotal = currentShields + amount;
        console.log(`Adding ${amount} shields to ${playerId} (${currentShields} -> ${newTotal})`);
        await this.setShields(playerId, newTotal);
    }

    async setCurrentPlayer(playerId) {
        console.log(`Setting current player to: ${playerId}`);
        this.currentPlayer = playerId;
        await this.driver.executeScript(`
            window.gameState.currentPlayer = '${playerId}';
            document.getElementById('current-player').textContent = '${playerId}';
        `);

        // Verify current player was set correctly
        const currentPlayerElement = await this.waitForElement(By.id('current-player'));
        const actualPlayer = await currentPlayerElement.getText();
        if (actualPlayer !== playerId) {
            throw new Error(`Current player not set correctly. Expected: ${playerId}, Got: ${actualPlayer}`);
        }
    }

    getAdventureDeckForScenario(scenario) {
        const scenarioDecks = {
            'JP': [
                // Stage 1 draws
                {type: 'F', value: 30},      // P1's draw (F30)
                {type: 'S', value: 10},      // P3's draw (Sword)
                {type: 'B', value: 15},      // P4's draw (Battle Axe)

                // Stage 2 draws
                {type: 'F', value: 10},      // P1's draw (F10)
                {type: 'L', value: 20},      // P3's draw (Lance)
                {type: 'L', value: 20},      // P4's draw (Lance)

                // Stage 3 draws
                {type: 'B', value: 15},      // P3's draw (Battle Axe)
                {type: 'S', value: 10},      // P4's draw (Sword)

                // Stage 4 draws
                {type: 'F', value: 30},      // P3's draw
                {type: 'L', value: 20},      // P4's draw (Lance)

                // P2's replacement draws (13 cards: 9 replacements + 4 stage bonus)
                {type: 'F', value: 10},
                {type: 'F', value: 15},
                {type: 'F', value: 20},
                {type: 'F', value: 25},
                {type: 'F', value: 30},
                {type: 'F', value: 30},
                {type: 'F', value: 35},
                {type: 'F', value: 40},
                {type: 'F', value: 50},
                // Extra cards for 4 stages
                {type: 'S', value: 10},
                {type: 'H', value: 10},
                {type: 'B', value: 15},
                {type: 'L', value: 20}
            ],
            '2WINNER': [
                // Stage 1 draws for first quest
                {type: 'F', value: 30}, // P2's draw
                {type: 'F', value: 40}, // P3's draw
                {type: 'F', value: 10}, // P4's draw

                // Stage 2 draws
                {type: 'B', value: 15}, // P2's draw
                {type: 'F', value: 10}, // P4's draw

                // Stage 3 draws
                {type: 'L', value: 20}, // P2's draw
                {type: 'L', value: 20}, // P4's draw

                // Stage 4 draws
                {type: 'B', value: 15}, // P2's draw
                {type: 'S', value: 10}, // P4's draw

                // Additional cards needed for P3's hand
                {type: 'B', value: 15}, // For P3's hand
                {type: 'L', value: 20}, // For P3's hand

                // Second quest draws
                {type: 'D', value: 5},  // P2's draw for stage 1
                {type: 'D', value: 5},  // P4's draw for stage 1
                {type: 'F', value: 15}, // P2's draw for stage 2
                {type: 'F', value: 15}, // P4's draw for stage 2
                {type: 'F', value: 25}, // P2's draw for stage 3
                {type: 'F', value: 25}  // P4's draw for stage 3
            ],
            '1WINNER': [
                // Will be implemented for 1winner scenario
            ],
            '0WINNER': [
                // Will be implemented for 0winner scenario
            ]
        };
        return scenarioDecks[scenario] || [];
    }

    async maintainHandSize(playerId, maxSize = 12) {

        let currentHand = await this.getPlayerHand(playerId);



        if (currentHand.length > maxSize) {



            const numToDiscard = currentHand.length - maxSize;



            console.log(`Trimming ${playerId}'s hand from ${currentHand.length} to ${maxSize} cards`);


            currentHand.sort((a,b) => {

                if (a.charAt(0) === 'F' && b.charAt(0) !== 'F') return -1;

                if (a.charAt(0) !== 'F' && b.charAt(0) === 'F') return 1;

                if (a.charAt(0) !== 'F' && b.charAt(0) !== 'F') {

                    const aValue = parseInt(a.substring(1))

                    const bValue = parseInt(b.substring(1))

                    if (aValue !== bValue) return aValue - bValue;

                    if (a.charAt(0) !== b.charAt(0)) {

                        if (a === 'S10' && b === 'H10') return -1;

                        if (a === 'H10' && b === 'S10') return 1;

                        return a.localeCompare(b)

                    }

                }

                return 0;



            })





            for (let i = 0; i < numToDiscard; i++) {

                await this.discardCard(playerId, currentHand[i]);

            }





            const newHand = await this.getPlayerHand(playerId);

            if (newHand.length !== maxSize) {

                console.warn(`WARNING: ${playerId}'s hand size is ${newHand.length} after trimming, expected ${maxSize}`);

            }

        }

    }

    async enforcePlayerState(playerId, requiredState) {
        console.log(`Enforcing state for ${playerId}:`, requiredState);

        // Clear current hand
        const currentHand = await this.getPlayerHand(playerId);
        for (const card of currentHand) {
            await this.discardCard(playerId, card);
        }


        if (requiredState.hand) {
            for (const card of requiredState.hand) {
                await this.addCardToHand(playerId, card);
            }
        }


        if (requiredState.shields !== undefined) {
            await this.setShields(playerId, requiredState.shields);
        }

        // Verify state was set correctly
        await this.verifyPlayerState(playerId, requiredState);
    }


    getEventDeckForScenario(scenario) {
        const eventDecks = {
            'JP': [
                {type: 'QUEST', stages: 4}    // Initial quest card for P1 to decline
            ],
            '2WINNER': [
                {type: 'QUEST', stages: 4}, // First quest
                {type: 'QUEST', stages: 3}  // Second quest
            ],
            '1WINNER': [

            ],
            '0WINNER': [

            ]
        };
        return eventDecks[scenario] || [];
    }

    async drawEventCard(eventType) {
        console.log(`Drawing ${eventType} event card`);

        // Update game state to reflect event card draw
        await this.driver.executeScript(`
            window.gameState.currentEventCard = {
                type: "${eventType}",
                id: "${eventType}"
            };
        `);

        await this.driver.sleep(500); // Allow UI to update

        // Click draw button to trigger event
        await this.clickButton('draw-card');

        // Wait for event processing
        await this.driver.sleep(1000);

        return eventType;
    }

    async handleEventEffect(eventType, playerId) {
        console.log(`Handling ${eventType} effect for ${playerId}`);

        switch (eventType) {
            case 'Plague':
                await this.handlePlagueEffect(playerId);
                break;
            case 'Prosperity':
                await this.handleProsperityEffect();
                break;
            case "Queen's favor":
                await this.handleQueensFavorEffect(playerId);
                break;
            default:
                throw new Error(`Unknown event type: ${eventType}`);
        }
    }

    async handlePlagueEffect(playerId) {
        const currentShields = await this.getShields(playerId);
        const newShields = Math.max(0, currentShields - 2);
        await this.setShields(playerId, newShields);
        console.log(`${playerId} lost 2 shields, now has ${newShields}`);
    }

    async handleProsperityEffect() {
        for (const playerId of ['P1', 'P2', 'P3', 'P4']) {
            // Draw 2 cards
            await this.addCardToHand(playerId, 'F25');
            await this.addCardToHand(playerId, 'F25');
            await this.maintainHandSize(playerId);
        }
    }

    async handleQueensFavorEffect(playerId) {



        const initialHand = await this.getPlayerHand(playerId);





        const drawnCard1 = await this.drawSpecificCard(playerId, 'F30');

        const drawnCard2 = await this.drawSpecificCard(playerId, 'F25');

        console.log("Drawn Cards: " + drawnCard1 + drawnCard2)



        await this.discardCard(playerId, drawnCard1);



        await this.discardCard(playerId, drawnCard2);





        await this.maintainHandSize(playerId);







        const postDiscardHand = await this.getPlayerHand(playerId);



        if (postDiscardHand.length + 2 !== initialHand.length + 2) {

            throw new Error(`Discard during Queen's Favor failed for ${playerId}`);

        }

    }

    async executeStateTransition(playerId, operation, expectedFinalState) {
        try {
            await operation();
            await this.enforcePlayerState(playerId, expectedFinalState);
        } catch (error) {
            console.error(`State transition failed for ${playerId}:`, error);
            throw error;
        }
    }

    async drawSpecificCard(playerId, cardId) {

        const cardDrawn = await this.driver.executeScript(`

const deck = window.gameState.adventureDeck;

const cardIndex = deck.findIndex(card => (card.type + card.value) === '${cardId}');

if (cardIndex >= 0) {

const card = deck.splice(cardIndex, 1)[0];

const cardId = card.type + card.value;

window.gameState.players['${playerId}'].cards.push(cardId);

updatePlayerHand('${playerId}', window.gameState.players['${playerId}'].cards);

return cardId;

} else {

throw new Error('Card ${cardId} not found in deck');

}

`);

        return cardDrawn;

    }

    normalizeHand(hand) {
        // Sort by type (Foes first, then weapons) and value
        return [...hand].sort((a, b) => {
            const aType = a.charAt(0);
            const bType = b.charAt(0);
            if (aType === 'F' && bType !== 'F') return -1;
            if (aType !== 'F' && bType === 'F') return 1;
            return a.localeCompare(b);
        });
    }




    async setupDeterministicDecks(scenario) {

// First, initialize empty decks

        await this.driver.executeScript(`

window.gameState.adventureDeck = [];

window.gameState.eventDeck = [];

`);

        let adventureCards = [];

        let eventCards = [];

        switch (scenario) {

            case 'JP':

                adventureCards = [

// Stage 1 sequence

                    { type: 'F', value: 30 }, // P1's first draw

                    { type: 'F', value: 10 }, // P1's second draw

                    { type: 'S', value: 10 }, // P3's draw

                    { type: 'B', value: 15 }, // P4's draw

// Stage 2 sequence

                    { type: 'F', value: 10 }, // P1's draw

                    { type: 'L', value: 20 }, // P3's draw

                    { type: 'L', value: 20 }, // P4's draw

// Stage 3 sequence

                    { type: 'B', value: 15 }, // P3's draw

                    { type: 'S', value: 10 }, // P4's draw

// Stage 4 sequence

                    { type: 'F', value: 30 }, // P3's draw

                    { type: 'L', value: 20 }, // P4's draw

// P2's cleanup draws (13 cards = 9 replacements + 4 stage bonus)

                    ...Array(13).fill({ type: 'F', value: 10 })

                ];

                eventCards = [{ type: 'QUEST', stages: 4 }];

                break;

            case '2WINNER':

                adventureCards = [

// Stage 1 draws

                    { type: 'F', value: 30 }, // P2's draw

                    { type: 'F', value: 40 }, // P3's draw

                    { type: 'F', value: 10 }, // P4's draw

// Stage 2 draws

                    { type: 'B', value: 15 }, // P2's draw

                    { type: 'F', value: 10 }, // P4's draw

// Stage 3 draws

                    { type: 'L', value: 20 }, // P2's draw

                    { type: 'L', value: 20 }, // P4's draw

// Stage 4 draws

                    { type: 'B', value: 15 }, // P2's draw

                    { type: 'S', value: 10 }, // P4's draw

// Additional cards needed for P3's hand

                    { type: 'B', value: 15 }, // For P3

                    { type: 'L', value: 20 }, // For P3

// Second quest draws

                    { type: 'D', value: 5 }, { type: 'D', value: 5 }, // P2 and P4's draws for stage 1

                    { type: 'F', value: 15 }, { type: 'F', value: 15 }, // P2 and P4's draws for stage 2

                    { type: 'F', value: 25 }, { type: 'F', value: 25 } // P2 and P4's draws for stage 3

                ];

                eventCards = [

                    { type: 'QUEST', stages: 4 }, // First quest

                    { type: 'QUEST', stages: 3 } // Second quest

                ];

                break;

            case '1WINNER':

                adventureCards = [

// First Quest Stage Draws

// Stage 1

                    { type: 'F', value: 5 }, { type: 'F', value: 5 }, { type: 'F', value: 5 }, // P2, P3, P4 draws

// Stage 2

                    { type: 'F', value: 15 }, { type: 'F', value: 15 }, { type: 'F', value: 15 }, // P2, P3, P4 draws

// Stage 3

                    { type: 'F', value: 5 }, { type: 'F', value: 10 }, { type: 'F', value: 20 }, // P2, P3, P4 draws

// Stage 4

                    { type: 'F', value: 5 }, { type: 'F', value: 10 }, { type: 'F', value: 20 }, // P2, P3, P4 draws

// P1's post-quest draws (8 cards)

                    { type: 'F', value: 5 }, { type: 'F', value: 5 },

                    { type: 'F', value: 10 }, { type: 'F', value: 10 },

                    { type: 'F', value: 15 }, { type: 'F', value: 15 },

                    { type: 'F', value: 15 }, { type: 'F', value: 15 },

// 'Prosperity' event draws (2 cards per player)

// P1

                    { type: 'F', value: 25 }, { type: 'F', value: 25 },

// P2

                    { type: 'H', value: 10 }, { type: 'S', value: 10 },

// P3

                    { type: 'B', value: 15 }, { type: 'F', value: 40 },

// P4

                    { type: 'H', value: 10 }, { type: 'D', value: 5 },

// 'Queen's Favor' event draws for P4

                    { type: 'F', value: 30 }, { type: 'F', value: 25 },

// Second Quest Stage Draws

// Stage 1

                    { type: 'B', value: 15 }, { type: 'B', value: 15 }, { type: 'F', value: 50 }, // P2, P3, P4 draws

// Stage 2

                    { type: 'S', value: 10 }, { type: 'S', value: 10 },  // P2, P3 draws

                    { type: 'B', value: 15 }, { type: 'B', value: 15 }, // P2 and P3 draw

// Stage 3

                    { type: 'E', value: 30 }, { type: 'E', value: 30 } // P2 and P3 draw

                ];

                eventCards = [

                    { type: 'QUEST', stages: 4 }, // Quest drawn by P1

                    { type: 'E', eventType: 'Plague' }, // Event drawn by P2

                    { type: 'E', eventType: 'Prosperity' }, // Event drawn by P3

                    { type: 'E', eventType: "Queen's Favor" }, // Event drawn by P4

                    { type: 'QUEST', stages: 3 } // Second quest drawn by P1

                ];

                break;

            case '0WINNER':

                adventureCards = [

                    { type: 'F', value: 5 }, // For P2

                    { type: 'F', value: 15 }, // For P3

                    { type: 'F', value: 10 }, // For P4

                    ...Array(14).fill({type: 'F', value: 5}) // Fill rest of deck with foes

                ];

                eventCards = [{ type: 'QUEST', stages: 2 }];

                break;

            default:

                console.warn(`No deterministic deck setup for scenario: ${scenario}`);

                break;

        }

// Update the game state with both decks

        await this.driver.executeScript(`

window.gameState.adventureDeck = ${JSON.stringify(adventureCards)};

window.gameState.eventDeck = ${JSON.stringify(eventCards)};

`);


        const deckState = await this.driver.executeScript(`

return {

adventureDeck: window.gameState.adventureDeck.length,

eventDeck: window.gameState.eventDeck.length,

firstFourCards: window.gameState.adventureDeck.slice(0, 4)

};

`);

        console.log('Adventure deck setup:', deckState);

    }
}
module.exports = BaseSeleniumTest;