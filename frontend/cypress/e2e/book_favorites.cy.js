describe('Book Favorites App', () => {
  // generate a random username and password for the e2e tests
  const username = `e2euser${Math.floor(Math.random() * 1000)}`;
  const password = `e2epass${Math.floor(Math.random() * 1000)}`;
  const user = { username, password };
  const verifyAlphabeticalOrder = (selector, transform = value => value.trim()) => {
    cy.get(selector).then($elements => {
      const values = [...$elements].map(el => transform(el.innerText));
      const sortedValues = [...values].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
      expect(values).to.deep.equal(sortedValues);
    });
  };

  beforeEach(() => {
    cy.visit('http://localhost:5173');
  });

  it('should allow a new user to register and login', () => {
    cy.contains('Create Account').click();
    cy.get('input[name="username"]').type(user.username);
    cy.get('input[name="password"]').type(user.password);
    cy.get('button#register').click();
    cy.contains('Registration successful! You can now log in.').should('exist');
    // wait for a bit to ensure the success message is visible
    cy.wait(2000);
    cy.get('input[name="username"]').type(user.username);
    cy.get('input[name="password"]').type(user.password);
    cy.get('button#login').click();
    cy.contains(`Hi, ${user.username}`).should('exist');
    cy.contains('Favorites').should('exist');
  });

  it('should show books and allow adding to favorites', () => {
    // Login first
    cy.contains('Login').click();
    cy.get('input[name="username"]').type(user.username);
    cy.get('input[name="password"]').type(user.password);
    cy.get('button#login').click();
    cy.contains('Books').click();
    cy.contains('h2', 'Books').should('exist');
    cy.get('button').contains('Add to Favorites').first().click();
    cy.get('a#favorites-link').click();
    cy.get('h2').contains('My Favorite Books').should('exist');
  });

  it('should allow sorting books and keep sort selection when navigating', () => {
    cy.contains('Login').click();
    cy.get('input[name="username"]').type(user.username);
    cy.get('input[name="password"]').type(user.password);
    cy.get('button#login').click();
    cy.contains('Books').click();

    cy.get('select#book-sort').should('have.value', 'title');
    cy.contains('Currently sorted by Title (A-Z)').should('exist');
    verifyAlphabeticalOrder('[data-testid="book-title"]');

    cy.get('select#book-sort').select('author');
    cy.get('select#book-sort').should('have.value', 'author');
    cy.contains('Currently sorted by Author (A-Z)').should('exist');
    verifyAlphabeticalOrder('[data-testid="book-author"]', value => value.replace(/^by\s+/, '').trim());

    cy.get('a#favorites-link').click();
    cy.get('h2').contains('My Favorite Books').should('exist');

    cy.get('a#books-link').click();
    cy.get('select#book-sort').should('have.value', 'author');
    cy.contains('Currently sorted by Author (A-Z)').should('exist');
    verifyAlphabeticalOrder('[data-testid="book-author"]', value => value.replace(/^by\s+/, '').trim());
  });

  it('should logout and protect routes', () => {
    // Login first
    cy.contains('Login').click();
    cy.get('input[name="username"]').type(user.username);
    cy.get('input[name="password"]').type(user.password);
    cy.get('button#login').click();
    cy.get('button#logout').click();
    cy.contains('Login').should('exist');
    cy.visit('http://localhost:5173/books');
    cy.url().should('eq', 'http://localhost:5173/');
  });
});
