const BaseSeleniumTest = require('./BaseSeleniumTest');

class HandState {
    constructor(baseSeleniumTest) {
        this.test = baseSeleniumTest;
        this.playerStates = new Map();
        this.stageTransitions = [];
    }

    // Register expected hand state for a stage
    async registerStageState(stageNum, playerStates) {
        this.stageTransitions[stageNum] = playerStates;
    }

    // Force exact hand composition
    async enforceHandState(playerId, expectedCards) {
        console.log(`Enforcing hand state for ${playerId}`);
        console.log('Expected cards:', expectedCards);

        // Get current hand
        const currentHand = await this.test.getPlayerHand(playerId);
        console.log('Current hand:', currentHand);

        // Remove all unexpected cards
        for (const card of currentHand) {
            if (!this.shouldKeepCard(card, expectedCards)) {
                await this.test.discardCard(playerId, card);
            }
        }

        // Add all missing cards
        const updatedHand = await this.test.getPlayerHand(playerId);
        for (const expectedCard of expectedCards) {
            if (!this.hasCorrectCount(expectedCard, updatedHand, expectedCards)) {
                await this.test.addCardToHand(playerId, expectedCard);
            }
        }

        // Verify final state
        await this.test.maintainHandSize(playerId);
        const finalHand = await this.test.getPlayerHand(playerId);
        console.log('Final hand:', finalHand);
    }

    shouldKeepCard(card, expectedCards) {
        const expectedCount = expectedCards.filter(c => c === card).length;
        return expectedCount > 0;
    }

    hasCorrectCount(card, currentHand, expectedHand) {
        const currentCount = currentHand.filter(c => c === card).length;
        const expectedCount = expectedHand.filter(c => c === card).length;
        return currentCount >= expectedCount;
    }

    // Handle stage transition
    async transitionStage(fromStage, toStage) {
        if (!this.stageTransitions[toStage]) {
            throw new Error(`No registered state for stage ${toStage}`);
        }

        console.log(`Transitioning from stage ${fromStage} to ${toStage}`);

        const targetState = this.stageTransitions[toStage];
        for (const [playerId, handState] of Object.entries(targetState)) {
            await this.enforceHandState(playerId, handState.cards);
            if (handState.shields !== undefined) {
                await this.test.setShields(playerId, handState.shields);
            }
        }
    }

    // Verify current state matches expected
    async verifyCurrentState(playerId) {
        const currentHand = await this.test.getPlayerHand(playerId);
        const expectedState = this.getCurrentExpectedState(playerId);

        console.log(`\nVerifying state for ${playerId}:`);
        console.log('Current hand:', currentHand.sort());
        console.log('Expected hand:', expectedState.cards.sort());

        if (!this.compareHands(currentHand, expectedState.cards)) {
            // Get detailed differences
            const missing = expectedState.cards.filter(card =>
                !currentHand.includes(card) ||
                currentHand.filter(c => c === card).length < expectedState.cards.filter(c => c === card).length
            );
            const extra = currentHand.filter(card =>
                !expectedState.cards.includes(card) ||
                currentHand.filter(c => c === card).length > expectedState.cards.filter(c => c === card).length
            );

            console.error('Missing cards:', missing);
            console.error('Extra cards:', extra);

            throw new Error(
                `Hand mismatch for ${playerId}. ` +
                `Expected: ${expectedState.cards.sort()}, ` +
                `Got: ${currentHand.sort()}`
            );
        }
    }

    getCurrentExpectedState(playerId) {
        const currentStage = this.test.getCurrentStage();
        return this.stageTransitions[currentStage][playerId];
    }

    compareHands(hand1, hand2) {
        const sorted1 = [...hand1].sort();
        const sorted2 = [...hand2].sort();
        return JSON.stringify(sorted1) === JSON.stringify(sorted2);
    }
}

class QuestGameTest extends BaseSeleniumTest {
    constructor() {
        super();
        this.handManager = new HandState(this);
        this.currentStage = 0;
    }

    getCurrentStage() {
        return this.currentStage;
    }

    setCurrentStage(stage) {
        this.currentStage = stage;
    }
}

module.exports = { HandState, QuestGameTest };