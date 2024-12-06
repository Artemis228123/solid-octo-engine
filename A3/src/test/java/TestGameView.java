import Model.*;

import View.GameView;

import java.util.*;

public class TestGameView implements GameView {

    private Queue<Boolean> yesNoResponses = new LinkedList<>();

    private Queue<Integer> cardChoices = new LinkedList<>();
    private int responseCounter = 0;
    private static final int MAX_RESPONSES = 100;
    private boolean debugMode = true;

    public void addYesNoResponse(boolean response) {

        yesNoResponses.offer(response);

    }

    public void addCardChoice(int choice) {

        cardChoices.offer(choice);

    }

    public void clearResponses() {
        yesNoResponses.clear();
        cardChoices.clear();
        responseCounter = 0;
    }

    @Override

    public void displayMessage(String message) {

// Optionally print or log messages

    }

    @Override

    public void displayError(String error) {

// Optionally print or log errors

    }

    @Override

    public void displayPlayerHand(Player player) {

// Optionally display player's hand

    }

    @Override

    public void displayCurrentStage(Stage stage) {

// Optionally display current stage

    }

    @Override

    public void displayAttack(Attack attack) {

// Optionally display attack

    }

    @Override

    public void clearScreen() {

// No action needed for tests

    }

    public void resetResponseCounter() {
        responseCounter = 0;
    }

    @Override

    public void waitForKeyPress() {

// No action needed for tests

    }

    @Override
    public int getCardChoice(Player player) {
        responseCounter++;
        if (responseCounter > MAX_RESPONSES) {
            String errorMsg = String.format(
                    "Response limit exceeded after %d responses. Current player: %s. Remaining choices: %d",
                    responseCounter, player.getId(), cardChoices.size());
            System.err.println(errorMsg);
            throw new RuntimeException(errorMsg); // Force test failure instead of infinite loop
        }

        if (cardChoices.isEmpty()) {
            String errorMsg = String.format(
                    "No more card choices queued for player %s after %d responses",
                    player.getId(), responseCounter);
            System.err.println(errorMsg);
            throw new RuntimeException(errorMsg); // Force test failure instead of infinite loop
        }

        int choice = cardChoices.poll();
        if (debugMode) {
            System.out.printf("DEBUG: Card choice %d for player %s (response #%d)%n",
                    choice, player.getId(), responseCounter);
        }
        return choice;
    }

    @Override
    public boolean getYesNoChoice(String prompt) {
        if (yesNoResponses.isEmpty()) {
            String errorMsg = String.format(
                    "No more yes/no responses queued for prompt: '%s' after %d responses",
                    prompt, responseCounter);
            System.err.println(errorMsg);
            throw new RuntimeException(errorMsg); // Force test failure instead of infinite loop
        }

        boolean response = yesNoResponses.poll();
        if (debugMode) {
            System.out.printf("DEBUG: Yes/No response %b for prompt '%s'%n",
                    response, prompt);
        }
        return response;
    }
}