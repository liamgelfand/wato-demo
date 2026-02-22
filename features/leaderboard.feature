Feature: Leaderboard
  As a user
  I want to see rankings of users by points
  So that I can compete with my friends

  Background:
    Given the following users exist with points:
      | username | totalPoints | weeklyPoints |
      | alice    | 1500        | 300          |
      | bob      | 1200        | 450          |
      | charlie  | 1800        | 200          |
      | diana    | 900         | 500          |

  Scenario: View total points leaderboard
    Given I am logged in as "alice"
    When I navigate to the leaderboard page
    And I select the "Total Points" tab
    Then I should see users ranked in this order:
      | rank | username | points |
      | 1    | charlie  | 1800   |
      | 2    | alice    | 1500   |
      | 3    | bob      | 1200   |
      | 4    | diana    | 900    |

  Scenario: View weekly points leaderboard
    Given I am logged in as "alice"
    When I navigate to the leaderboard page
    And I select the "Weekly Points" tab
    Then I should see users ranked in this order:
      | rank | username | points |
      | 1    | diana    | 500    |
      | 2    | bob      | 450    |
      | 3    | alice    | 300    |
      | 4    | charlie  | 200    |

  Scenario: Current user is highlighted
    Given I am logged in as "bob"
    When I navigate to the leaderboard page
    Then my entry "bob" should be highlighted
    And I should see my current rank

  Scenario: Only show friends' rankings
    Given I am logged in as "alice"
    And I am friends with "bob" and "charlie"
    And I am not friends with "diana"
    When I navigate to the leaderboard page
    Then I should see "bob" and "charlie" in the rankings
    And I should not see "diana" in the rankings
