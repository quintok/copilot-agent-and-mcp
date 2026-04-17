describe('Book Reviews', () => {
  const username = `reviewer${Math.floor(Math.random() * 10000)}`;
  const password = `pass${Math.floor(Math.random() * 10000)}`;

  before(() => {
    // Register a user up-front
    cy.visit('http://localhost:5173');
    cy.contains('Create Account').click();
    cy.get('input[name="username"]').type(username);
    cy.get('input[name="password"]').type(password);
    cy.get('button#register').click();
    cy.contains('Registration successful! You can now log in.').should('exist');
  });

  beforeEach(() => {
    cy.visit('http://localhost:5173');
    cy.contains('Login').click();
    cy.get('input[name="username"]').type(username);
    cy.get('input[name="password"]').type(password);
    cy.get('button#login').click();
    cy.contains('Books').click();
    cy.contains('h2', 'Books').should('exist');
  });

  it('shows a reviews section on each book card and allows submitting a review', () => {
    // Every book card should have a reviews section with a Show Reviews toggle
    cy.contains('button', 'Show Reviews').first().click();
    cy.contains('No reviews yet').should('exist');

    // Select 4 stars
    cy.get('[role="radio"][aria-label="4 stars"]').first().click();
    cy.get('textarea[aria-label="Review text"]').first()
      .type('A thoughtful and compelling read.');
    cy.contains('button', 'Submit Review').first().click();

    // Newly submitted review should appear in the list and update the count
    cy.contains('A thoughtful and compelling read.').should('exist');
    cy.contains('(1 review)').should('exist');
  });

  it('validates required fields in the review form', () => {
    cy.contains('button', 'Show Reviews').first().click();
    // Submit without selecting a rating or text
    cy.contains('button', 'Submit Review').first().click();
    cy.contains('Please select a rating').should('exist');
  });
});
