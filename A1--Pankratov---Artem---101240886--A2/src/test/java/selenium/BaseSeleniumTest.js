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

        await this.driver.manage().setTimeouts({ implicit: 5000 });
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
        console.log('Hand before discard:', await this.getPlayerHand(playerId));

        // Get initial count of this card
        const initialHand = await this.getPlayerHand(playerId);
        const initialCount = initialHand.filter(card => card === cardId).length;

        // Perform discard and update UI
        await this.driver.executeScript(`
            if (!window.gameState.discardPile) {
                window.gameState.discardPile = [];
            }
            const player = window.gameState.players['${playerId}'];
            
            // Find first occurrence of the card and remove it
            const cardIndex = player.cards.indexOf('${cardId}');
            if (cardIndex >= 0) {
                player.cards.splice(cardIndex, 1);
                window.gameState.discardPile.push('${cardId}');
                
                // Force UI update
                const handElement = document.getElementById('${playerId.toLowerCase()}-hand');
                handElement.innerHTML = '';
                player.cards.forEach(card => {
                    const cardElement = document.createElement('div');
                    cardElement.className = 'card';
                    cardElement.textContent = card;
                    cardElement.onclick = () => window.selectCard(cardElement, card);
                    handElement.appendChild(cardElement);
                });
                document.getElementById('${playerId.toLowerCase()}-card-count').textContent = player.cards.length;
            }
        `);

        // Allow time for UI update
        await this.driver.sleep(200);

        // Get updated hand for verification
        const updatedHand = await this.getPlayerHand(playerId);
        console.log('Hand after discard:', updatedHand);

        // Count occurrences of the card after discard
        const finalCount = updatedHand.filter(card => card === cardId).length;
        console.log(`Occurrences of ${cardId} before: ${initialCount}, after: ${finalCount}`);

        // Verify exactly one card was removed
        if (finalCount !== initialCount - 1) {
            console.error('Current hand:', updatedHand);
            throw new Error(`Failed to discard ${cardId}. Expected ${initialCount - 1} occurrences, found ${finalCount}`);
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

        // Debug: Log the entire hand HTML
        const handHtml = await handElement.getAttribute('innerHTML');
        console.log('Hand HTML:', handHtml);

        // Debug: Log all available cards
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

            // Small delay between selections
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
        await this.driver.executeScript(`
            window.gameState.players['${playerId}'].shields = ${shields};
            document.getElementById('${playerId.toLowerCase()}-shields').textContent = ${shields};
        `);

        // Verify shields were set correctly
        const actualShields = await this.getShields(playerId);
        if (actualShields !== shields) {
            throw new Error(`Shield count not set correctly for ${playerId}. Expected: ${shields}, Got: ${actualShields}`);
        }
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
                { type: 'F', value: 30 },      // P1's draw (F30)
                { type: 'S', value: 10 },      // P3's draw (Sword)
                { type: 'B', value: 15 },      // P4's draw (Battle Axe)

                // Stage 2 draws
                { type: 'F', value: 10 },      // P1's draw (F10) - critical for the test
                { type: 'L', value: 20 },      // P3's draw (Lance)
                { type: 'L', value: 20 },      // P4's draw (Lance)

                // Stage 3 draws
                { type: 'B', value: 15 },      // P3's draw (Battle Axe)
                { type: 'S', value: 10 },      // P4's draw (Sword)

                // Stage 4 draws
                { type: 'F', value: 30 },      // P3's draw
                { type: 'L', value: 20 },      // P4's draw (Lance)

                // P2's replacement draws (13 cards: 9 replacements + 4 stage bonus)
                { type: 'F', value: 10 },
                { type: 'F', value: 15 },
                { type: 'F', value: 20 },
                { type: 'F', value: 25 },
                { type: 'F', value: 30 },
                { type: 'F', value: 30 },
                { type: 'F', value: 35 },
                { type: 'F', value: 40 },
                { type: 'F', value: 50 },
                // Extra cards for 4 stages
                { type: 'S', value: 10 },
                { type: 'H', value: 10 },
                { type: 'B', value: 15 },
                { type: 'L', value: 20 }
            ],
            '2WINNER': [
                // Will be implemented for 2winner scenario
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

    getEventDeckForScenario(scenario) {
        const eventDecks = {
            'JP': [
                { type: 'QUEST', stages: 4 }    // Initial quest card for P1 to decline
            ],
            '2WINNER': [
                // Will be implemented for 2winner scenario
            ],
            '1WINNER': [
                // Will be implemented for 1winner scenario
            ],
            '0WINNER': [
                // Will be implemented for 0winner scenario
            ]
        };
        return eventDecks[scenario] || [];
    }

    async setupDeterministicDecks(scenario) {
        // First initialize empty decks
        await this.driver.executeScript(`
        window.gameState.adventureDeck = [];
        window.gameState.eventDeck = [];
    `);

        // Set up exact card sequence for JP scenario
        const adventureCards = [];

        // Stage 1 sequence
        adventureCards.push({ type: 'F', value: 30 });  // P1's first draw
        adventureCards.push({ type: 'F', value: 10 });  // P1's second draw (F10)
        adventureCards.push({ type: 'S', value: 10 });  // P3's draw
        adventureCards.push({ type: 'B', value: 15 });  // P4's draw

        // Stage 2 sequence
        adventureCards.push({ type: 'F', value: 10 });  // P1's draw
        adventureCards.push({ type: 'L', value: 20 });  // P3's draw (Lance)
        adventureCards.push({ type: 'L', value: 20 });  // P4's draw (Lance)

        // Stage 3 sequence
        adventureCards.push({ type: 'B', value: 15 });  // P3's draw (Axe)
        adventureCards.push({ type: 'S', value: 10 });  // P4's draw (Sword)

        // Stage 4 sequence
        adventureCards.push({ type: 'F', value: 30 });  // P3's draw
        adventureCards.push({ type: 'L', value: 20 });  // P4's draw (Lance)

        // P2's cleanup draws (13 cards = 9 replacements + 4 stage bonus)
        for (let i = 0; i < 13; i++) {
            adventureCards.push({ type: 'F', value: 10 });
        }

        // Set up event deck
        const eventCards = [{ type: 'QUEST', stages: 4 }];

        // Update the game state with both decks
        await this.driver.executeScript(`
        window.gameState.adventureDeck = ${JSON.stringify(adventureCards)};
        window.gameState.eventDeck = ${JSON.stringify(eventCards)};
    `);

        // Verify deck setup
        const deckState = await this.driver.executeScript(`
        return {
            adventureDeck: window.gameState.adventureDeck.length,
            eventDeck: window.gameState.eventDeck.length,
            firstFourCards: window.gameState.adventureDeck.slice(0,4)
        };
    `);
        console.log('Adventure deck setup:', deckState);
    }

}

module.exports = BaseSeleniumTest;