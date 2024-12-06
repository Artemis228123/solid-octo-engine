Feature: Game Scenarios

  Scenario: JP_scenario

    Given the game is initialized

    And the hands of the players are set as follows:

      | Player | Cards |

      | P1 | F5, F5, F15, F15, D5, S10, H10, B15, B15, L20 |

      | P2 | F15, F25, F45, F65, S10, H10, B15, L20, E30 |

      | P3 | F5, F5, F5, F15, D5, S10, H10, B15 |

      | P4 | F5, F15, F15, F40, D5, S10, H10, L20 |

    When P1 draws a Quest card of 4 stages

    And P1 declines to sponsor the quest

    And P2 sponsors the quest

    And P2 builds the quest stages with the following cards:

      | Stage | Cards |

      | 1 | F15 |

      | 2 | F25 |

      | 3 | F45 |

      | 4 | F65 |

    And the following players participate:

      | Player |

      | P1 |

      | P3 |

      | P4 |

    And each participating player draws and discards cards as follows:

      | Player | Draws | Discards |

      | P1 | F30 | F5 |

      | P3 | S10 | F5 |

      | P4 | B15 | F5 |

    And the players build their attacks for stage 1 as follows:

      | Player | Attack |

      | P1 | D5, S10 |

      | P3 | S10, D5 |

      | P4 | D5, H10 |

    And each participating player draws and discards cards for stage 2 as follows:

      | Player | Draws | Discards |

      | P1 | F10 | |

      | P3 | L20 | |

      | P4 | L20 | |

    And the players build their attacks for stage 2 as follows:

      | Player | Attack |

      | P1 | H10 |

      | P3 | B15, S10 |

      | P4 | H10, B15 |

    And each participating player draws and discards cards for stage 3 as follows:

      | Player | Draws | Discards |

      | P3 | B15 | |

      | P4 | S10 | |

    And the players build their attacks for stage 3 as follows:

      | Player | Attack |

      | P3 | L20, H10, S10 |

      | P4 | B15, S10, L20 |

    And each participating player draws and discards cards for stage 4 as follows:

      | Player | Draws | Discards |

      | P3 | F30 | |

      | P4 | E30 | |

    And the players build their attacks for stage 4 as follows:

      | Player | Attack |

      | P3 | B15, H10, L20 |

      | P4 | D5, S10, L20, E30 |

    And the game processes the turn

    Then P1 loses and cannot proceed to the next stage

    And assert that P1 has no shields and has the hand:

      | Player | Hand |

      | P1 | F5, F10, F15, F15, F30, B15, B15, L20 |

    Then P3 loses and receives no shields

    And P4 wins the quest and receives 4 shields

    And assert that P3 has no shields and has the hand:

      | Player | Hand |

      | P3 | F5, F5, F15, F30, S10 |

    And assert that P4 has 4 shields and has the hand:

      | Player | Hand |

      | P4 | F15, F15, F40, L20 |

    When P2 discards all cards used in the quest and draws 13 random cards and trims down to 12 cards

    Then assert that P2 has 12 cards in hand

  Scenario: 2winner_game_2winner_quest

    Given the game is initialized

    And the hands of the players are set as follows:

      | Player | Cards |

      | P1 | F5, F10, D5, S10, H10, B15, L20 |

      | P2 | F15, F20, D5, S10, H10, B15, L20, E30 |

      | P3 | F5, F15, D5, S10, H10 |

      | P4 | F5, F20, D5, S10, H10, B15 |

    When P1 draws a Quest card of 4 stages

    And P1 sponsors the quest

    And "P1" builds the quest stages with the following cards:

      | Stage | Cards |

      | 1 | F15 |

      | 2 | F20, D5 |

      | 3 | F25, S10 |

      | 4 | F30, H10 |

    And the following players participate:

      | Player |

      | P2 |

      | P3 |

      | P4 |

    And the players build their attacks for stage 1 as follows:

      | Player | Attack |

      | P2 | D5, S10 |

      | P3 | D5 |

      | P4 | H10 |

    Then P2 and P4 proceed to the next stage

    And P3 loses and cannot proceed to the next stage

    And assert that P3 has no shields and has the hand:

      | Player | Hand |

      | P3 | F5, F15, S10 |

    And P2 and P4 participate in and win stages 2, 3, and 4

    Then P2 and P4 each earn 4 shields

    When "P2" draws a Quest card of 3 stages

    And P2 declines to sponsor the quest

    And "P3" sponsors the quest

    And "P3" builds the quest stages with the following cards:

      | Stage | Cards |

      | 1 | F15 |

      | 2 | F25 |

      | 3 | F35 |

    And the following players participate:

      | Player |

      | P2 |

      | P4 |

    And "P1" declines to participate

    And the players build their attacks for stage 1 as follows:

      | Player | Attack |

      | P2 | B15 |

      | P4 | B15 |

    And the players build their attacks for stage 2 as follows:

      | Player | Attack |

      | P2 | S10, D5 |

      | P4 | S10, D5 |

    And the players build their attacks for stage 3 as follows:

      | Player | Attack |

      | P2 | E30 |

      | P4 | L20 |

    Then P2 and P4 each earn 3 shields and both are declared winners

    And assert that "P2" has 7 shields

    And assert that "P4" has 7 shields

    And assert that "P1" has 0 shields

    And assert that "P3" has 0 shields

  Scenario: 1winner_game_with_events

    Given the game is initialized

    And the hands of the players are set as follows:

      | Player | Cards |

      | P1 | F15, F20, F25, F30, F5, F5, F10, F10 |

      | P2 | D5, S10, H10, B15, L20, E30, F5, F10 |

      | P3 | D5, S10, H10, B15, L20, E30, F5, F10 |

      | P4 | D5, S10, H10, B15, L20, F5, F10, F15 |

    When P1 draws a Quest card of 4 stages

    And P1 sponsors the quest

    And "P1" builds the quest stages with the following cards:

      | Stage | Cards |

      | 1 | F15 |

      | 2 | F20 |

      | 3 | F25 |

      | 4 | F30 |

    And the following players participate:

      | Player |

      | P2 |

      | P3 |

      | P4 |

    And the players build their attacks for stage 1 as follows:

      | Player | Attack |

      | P2 | D5, S10 |

      | P3 | D5, S10 |

      | P4 | D5, S10 |

    And the players build their attacks for stage 2 as follows:

      | Player | Attack |

      | P2 | H10, B15 |

      | P3 | H10, B15 |

      | P4 | H10, B15 |

    And the players build their attacks for stage 3 as follows:

      | Player | Attack |

      | P2 | L20 |

      | P3 | L20 |

      | P4 | L20 |

    And the players build their attacks for stage 4 as follows:

      | Player | Attack |

      | P2 | E30 |

      | P3 | E30 |

      | P4 | B15, H10 |

    Then P2, P3, and P4 each earn 4 shields

    When "P2" draws an event card "Plague"

    Then "P2" loses 2 shields

    When "P3" draws an event card "Prosperity"

    Then all players draw 2 adventure cards and trim their hands if necessary

    When "P4" draws an event card "Queen's Favor"

    Then "P4" draws 2 adventure cards and trims their hand if necessary

    When P1 draws a Quest card of 3 stages

    And P1 sponsors the quest

    And "P1" builds the quest stages with the following cards:

      | Stage | Cards |

      | 1 | F25 |

      | 2 | F30 |

      | 3 | F35 |

    And the following players participate:

      | Player |

      | P2 |

      | P3 |

      | P4 |

    And "P1" declines to participate

    And the players build their attacks for stage 1 as follows:

      | Player | Attack |

      | P2 | D5 |

      | P3 | D5 |

      | P4 | |

    Then "P4" loses and cannot proceed to the next stage

    And P2 and P3 participate in and win stages 2 and 3

    Then P2 and P3 each earn 3 shields

    And assert that "P3" has 7 shields

    And assert that "P2" has 5 shields

    And assert that "P4" has 4 shields

  Scenario: 0_winner_quest
    Given the game is initialized
    And the hands of the players are set as follows:
      | Player | Cards |
      | P1 | F15, F20, F25, F30, D5, S10, H10, B15, L20 |
      | P2 | F5, F10, D5, S10, H10, B15 |
      | P3 | F5, F10, D5, S10, H10, B15 |
      | P4 | F5, F10, D5, S10, H10, B15 |

    When P1 draws a Quest card of 2 stages
    And P1 sponsors the quest
    And "P1" builds the quest stages with the following cards:
      | Stage | Cards |
      | 1 | F20 |
      | 2 | F30 |

    And the following players participate:
      | Player |
      | P2 |
      | P3 |
      | P4 |

    And the players build their attacks for stage 1 as follows:
      | Player | Attack |
      | P2 | D5 |
      | P3 | D5 |
      | P4 | D5 |

    When the game processes the turn
    Then all players lose the quest
    And the quest ends with no winner

    When P1 discards the quest cards and draws 4 new cards
    Then assert that "P1" has 0 shields and has the hand:
      | Hand |
      | F15, F25, D5, S10, H10, B15, L20 |

    And assert that "P2" has 0 shields and has the hand:
      | Hand |
      | F5, F10, S10, H10, B15 |

    And assert that "P3" has 0 shields and has the hand:
      | Hand |
      | F5, F10, S10, H10, B15 |

    And assert that P4 has 0 shields and has the hand:
      | Hand |
      | F5, F10, S10, H10, B15 |