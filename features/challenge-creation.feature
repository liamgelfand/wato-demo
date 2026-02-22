Feature: Challenge Creation
  As a registered user
  I want to create challenges
  So that other users can attempt them and earn points

  Background:
    Given I am logged in as a user

  Scenario: Successfully create a valid challenge
    Given I am on the create challenge page
    When I fill in the challenge form with valid data:
      | field       | value                                    |
      | title       | Complete 100 Pushups                     |
      | description | Do 100 pushups in sets throughout the day |
      | category    | FITNESS                                  |
      | difficulty  | HARD                                     |
      | basePoints  | 150                                      |
    And I submit the challenge form
    Then I should see a success message
    And the challenge should be created in the database
    And the challenge points should be calculated correctly

  Scenario: Reject challenge with banned content
    Given I am on the create challenge page
    When I fill in the challenge form with banned words:
      | field       | value                           |
      | title       | Drinking Challenge              |
      | description | Drink alcohol and record it     |
      | category    | FUNNY                           |
      | difficulty  | EASY                            |
      | basePoints  | 50                              |
    And I submit the challenge form
    Then I should see an error message about banned content
    And the challenge should not be created

  Scenario: Validate required fields
    Given I am on the create challenge page
    When I submit the challenge form without filling required fields
    Then I should see validation errors for:
      | field       |
      | title       |
      | description |
      | category    |
      | difficulty  |
      | basePoints  |

  Scenario: Calculate points based on difficulty multiplier
    Given I am on the create challenge page
    When I create a challenge with base points "100" and difficulty "EXPERT"
    Then the challenge should have "300" total points
