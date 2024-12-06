package SpringBoot;

import Controller.GameController;
import Model.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.HashMap;
import java.util.List;
import java.util.*;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:8080")
public class GameRestController {
    private final Game game;
    private final GameController gameController;

    public GameRestController(Game game, GameController gameController) {
        this.game = game;
        this.gameController = gameController;
    }

    @PostMapping("/init-game")
    public ResponseEntity<?> initializeGame(@RequestBody Map<String, List<String>> initialHands) {
        try {
            for (Map.Entry<String, List<String>> entry : initialHands.entrySet()) {
                Player player = game.getPlayers().stream()
                        .filter(p -> p.getId().equals(entry.getKey()))
                        .findFirst()
                        .orElseThrow();

                player.clearHand();
                for (String cardId : entry.getValue()) {
                    player.addCardToHand(createCard(cardId));
                }
            }
            return ResponseEntity.ok(getGameState());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/game-state")
    public Map<String, Object> getGameState() {
        Map<String, Object> state = new HashMap<>();
        state.put("currentPlayer", game.getCurrentPlayer().getId());

        Map<String, Object> players = new HashMap<>();
        for (Player player : game.getPlayers()) {
            Map<String, Object> playerState = new HashMap<>();
            playerState.put("shields", player.getShields());
            playerState.put("cards", player.getHand().stream()
                    .map(Card::getId)
                    .toList());
            players.put(player.getId(), playerState);
        }
        state.put("players", players);

        return state;
    }

    @PostMapping("/game-action")
    public ResponseEntity<?> handleAction(@RequestBody GameAction action) {
        try {
            switch (action.getAction()) {
                case "DRAW":
                    handleDrawAction(action.getPlayer());
                    break;
                case "SELECT_CARDS":
                    handleCardSelection(action.getPlayer(), (List<String>) action.getData().get("cards"));
                    break;
                case "CONFIRM":
                    handleConfirmAction(action.getPlayer());
                    break;
                case "DECLINE":
                    handleDeclineAction(action.getPlayer());
                    break;
                case "END_TURN":
                    handleEndTurnAction();
                    break;
                default:
                    return ResponseEntity.badRequest().body("Unknown action");
            }
            return ResponseEntity.ok(getGameState());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/draw-card")
    public ResponseEntity<?> drawCard(@RequestParam String playerId) {
        try {
            Player player = findPlayer(playerId);
            AdventureCard card = game.drawAdventureCard();
            player.addCardToHand(card);
            return ResponseEntity.ok(getGameState());
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", e.getMessage()));
        }
    }
    @PostMapping("/handle-quest-cleanup")
    public ResponseEntity<?> handleQuestCleanup(@RequestParam String playerId, @RequestBody Map<String, Object> data) {
        try {
            Player player = findPlayer(playerId);
            List<String> usedCards = (List<String>) data.get("usedCards");
            int stages = (Integer) data.get("stages");

            // Remove used cards
            for (String cardId : usedCards) {
                AdventureCard cardToRemove = player.getHand().stream()
                        .filter(card -> card.getId().equals(cardId))
                        .findFirst()
                        .orElseThrow();
                player.removeCardFromHand(cardToRemove);
                game.discardAdventureCard(cardToRemove);
            }

            // Draw new cards (used cards + stages)
            int cardsToDraw = usedCards.size() + stages;
            for (int i = 0; i < cardsToDraw; i++) {
                AdventureCard newCard = game.drawAdventureCard();
                player.addCardToHand(newCard);
            }

            // Trim hand if necessary
            while (player.getHand().size() > 12) {
                // Remove the first excess card
                AdventureCard cardToDiscard = player.getHand().get(0);
                player.removeCardFromHand(cardToDiscard);
                game.discardAdventureCard(cardToDiscard);
            }

            return ResponseEntity.ok(getGameState());
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", e.getMessage()));
        }
    }


    private void handleDrawAction(String playerId) {
        Player player = findPlayer(playerId);
        EventCard card = game.drawEventCard();
        // Handle the drawn card based on its type
        if (card instanceof QuestCard) {
            // Quest card handling
        } else if (card instanceof EventActionCard) {
            // Event card handling
        }
    }

    private void handleCardSelection(String playerId, List<String> selectedCards) {
        Player player = findPlayer(playerId);
        // Implement card selection logic
    }

    private void handleConfirmAction(String playerId) {
        Player player = findPlayer(playerId);
        // Implement confirmation logic
    }

    private void handleDeclineAction(String playerId) {
        Player player = findPlayer(playerId);
        // Implement decline logic
    }

    private void handleEndTurnAction() {
        game.nextTurn();
    }

    private Player findPlayer(String playerId) {
        return game.getPlayers().stream()
                .filter(p -> p.getId().equals(playerId))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Player not found: " + playerId));
    }

    private AdventureCard createCard(String cardId) {
        char type = cardId.charAt(0);
        switch (type) {
            case 'F':
                return new FoeCard(Integer.parseInt(cardId.substring(1)));
            case 'D':
                return new WeaponCard(WeaponCard.WeaponType.DAGGER);
            case 'S':
                return new WeaponCard(WeaponCard.WeaponType.SWORD);
            case 'H':
                return new WeaponCard(WeaponCard.WeaponType.HORSE);
            case 'B':
                return new WeaponCard(WeaponCard.WeaponType.BATTLE_AXE);
            case 'L':
                return new WeaponCard(WeaponCard.WeaponType.LANCE);
            case 'E':
                return new WeaponCard(WeaponCard.WeaponType.EXCALIBUR);
            default:
                throw new IllegalArgumentException("Unknown card type: " + type);
        }
    }
}

class GameAction {
    private String action;
    private String player;
    private Map<String, Object> data;

    // Getters and setters
    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }
    public String getPlayer() { return player; }
    public void setPlayer(String player) { this.player = player; }
    public Map<String, Object> getData() { return data; }
    public void setData(Map<String, Object> data) { this.data = data; }
}