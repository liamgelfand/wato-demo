Feature: Challenge Attempts
  As a user
  I want to attempt challenges and submit proof
  So that I can earn points when verified

  Background:
    Given I am logged in as "user1"
    And there is a challenge "50 Pushups" worth "150" points

  Scenario: Start a challenge attempt
    Given I am viewing the challenge "50 Pushups"
    When I click "Attempt Challenge"
    Then a new attempt should be created with status "DRAFT"
    And I should be redirected to the attempt page

  Scenario: Submit proof for an attempt
    Given I have an attempt in "DRAFT" status
    When I upload an image as proof
    And I submit the attempt
    Then the attempt status should change to "PENDING"
    And other users should be able to verify it

  Scenario: Community verification - Approve attempt
    Given there is a pending attempt by "user1"
    And I am logged in as "user2" who is friends with "user1"
    When I view the attempt
    And I verify it as "APPROVE"
    And another friend "user3" also verifies it as "APPROVE"
    Then the attempt should be marked as "APPROVED"
    And "user1" should receive "150" points
    And a points ledger entry should be created

  Scenario: Community verification - Reject attempt
    Given there is a pending attempt by "user1"
    And I am logged in as "user2" who is friends with "user1"
    When I view the attempt
    And I verify it as "REJECT" with reason "Proof is not clear"
    Then the attempt should be marked as "REJECTED"
    And "user1" should not receive points

  Scenario: Prevent double points awarding
    Given there is an approved attempt for "user1"
    When the system tries to award points again for the same attempt
    Then it should fail due to unique constraint
    And the user should only have points awarded once
