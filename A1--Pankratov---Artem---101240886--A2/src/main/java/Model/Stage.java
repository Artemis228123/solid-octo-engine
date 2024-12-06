package Model;

import java.util.*;

public class Stage {
    private final List<AdventureCard> cards;
    private int value;
    private FoeCard foe;

    public Stage() {
        this.cards = new ArrayList<>();
        this.value = 0;
    }

    public boolean addCard(AdventureCard card) {
        // Validate card type first
        if (card instanceof FoeCard) {
            if (foe != null) {
                return false;
            }
        } else if (!(card instanceof WeaponCard)) {
            return false;
        }

        // Check for duplicate weapons
        if (card instanceof WeaponCard) {
            WeaponCard weaponCard = (WeaponCard) card;
            if (cards.stream()
                    .filter(c -> c instanceof WeaponCard)
                    .map(c -> (WeaponCard) c)
                    .anyMatch(w -> w.getType() == weaponCard.getType())) {
                return false;
            }
        }

        // Add card and update value
        cards.add(card);
        value += card.getValue();
        if (card instanceof FoeCard) {
            foe = (FoeCard) card;
        }
        return true;
    }

    public int getValue() {
        return value;
    }

    public List<AdventureCard> getCards() {
        return Collections.unmodifiableList(cards);
    }

    public boolean isValid() {
        return foe != null;
    }
}
