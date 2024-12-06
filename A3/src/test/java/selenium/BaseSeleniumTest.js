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

    // Deck setup methods
    async setupDeterministicDecks(scenario) {
        const adventureCards = this.getAdventureDeckForScenario(scenario);
        const eventCards = this.getEventDeckForScenario(scenario);

        await this.driver.executeScript(`
            window.gameState.adventureDeck = ${JSON.stringify(adventureCards)};
            window.gameState.eventDeck = ${JSON.stringify(eventCards)};
        `);

        // Verify decks were set up correctly
        const deckState = await this.driver.executeScript(`
            return {
                adventureDeck: window.gameState.adventureDeck.length,
                eventDeck: window.gameState.eventDeck.length
            };
        `);
        console.log('Decks initialized for scenario:', scenario, deckState);
    }

    // Card handling methods
    async drawCard(playerId, type = 'adventure') {
        console.log(`Drawing ${type} card for ${playerId}`);
        const card = await this.driver.executeScript(`
            const deck = '${type}' === 'adventure' ? 
                window.gameState.adventureDeck : 
                window.gameState.eventDeck;
            if (deck.length === 0) return null;
            const card = deck.shift();
            if ('${type}' === 'adventure') {
                const cardId = card.type + card.value;
                window.gameState.players['${playerId}'].cards.push(cardId);
                updatePlayerHand('${playerId}', window.gameState.players['${playerId}'].cards);
                return cardId;
            } else {
                return card;
            }
        `);

        // Verify card was added to player's hand if it's an adventure card
        if (type === 'adventure' && card) {
            const hand = await this.getPlayerHand(playerId);
            if (!hand.includes(card)) {
                throw new Error(`Drawn card ${card} not found in ${playerId}'s hand`);
            }
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

        // First, clear any existing selections
        await this.driver.executeScript(`
            const handElement = document.getElementById('${playerId.toLowerCase()}-hand');
            const selectedCards = handElement.getElementsByClassName('card selected');
            Array.from(selectedCards).forEach(card => card.classList.remove('selected'));
            window.gameState.selectedCards = [];
        `);

        // Then make new selections
        for (const cardId of cardIds) {
            const cards = await handElement.findElements(By.className('card'));
            let found = false;
            for (const card of cards) {
                const text = await card.getText();
                if (text === cardId) {
                    await card.click();
                    found = true;
                    break;
                }
            }
            if (!found) {
                throw new Error(`Card ${cardId} not found in ${playerId}'s hand for selection`);
            }
            await this.driver.sleep(100);
        }

        // Verify correct number of cards are selected
        const selectedCards = await handElement.findElements(By.css('.card.selected'));
        if (selectedCards.length !== cardIds.length) {
            throw new Error(`Expected ${cardIds.length} selected cards, found ${selectedCards.length}`);
        }

        // Verify correct cards are selected
        for (const cardId of cardIds) {
            let cardFound = false;
            for (const selectedCard of selectedCards) {
                const text = await selectedCard.getText();
                if (text === cardId) {
                    cardFound = true;
                    break;
                }
            }
            if (!cardFound) {
                throw new Error(`Selected card ${cardId} not found in selection state`);
            }
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
                { type: 'F', value: 30 },      // P1's draw
                { type: 'S', value: 10 },      // P3's draw (Sword)
                { type: 'B', value: 15 },      // P4's draw (Battle Axe)

                // Stage 2 draws
                { type: 'F', value: 10 },      // P1's draw
                { type: 'L', value: 20 },      // P3's draw (Lance)
                { type: 'L', value: 20 },      // P4's draw (Lance)

                // Stage 3 draws
                { type: 'B', value: 15 },      // P3's draw (Battle Axe)
                { type: 'S', value: 10 },      // P4's draw (Sword)

                // Stage 4 draws
                { type: 'F', value: 30 },      // P3's draw
                { type: 'E', value: 30 },      // P4's draw (Excalibur)

                // P2's cleanup draws (13 cards: 9 replacements + 4 stage bonus)
                { type: 'F', value: 5 },
                { type: 'F', value: 10 },
                { type: 'F', value: 15 },
                { type: 'F', value: 20 },
                { type: 'F', value: 25 },
                { type: 'F', value: 30 },
                { type: 'S', value: 10 },
                { type: 'H', value: 10 },
                { type: 'B', value: 15 },
                { type: 'L', value: 20 },
                { type: 'D', value: 5 },
                { type: 'D', value: 5 },
                { type: 'S', value: 10 }
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
}

module.exports = BaseSeleniumTest;