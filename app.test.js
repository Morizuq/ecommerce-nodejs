const request = require('supertest');
const app = require('express');

//Ancestor Test functions
const testGetAll = (url) => {
  return it('respond with an array of products', async () => {
    request(app)
      .get(url)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .then((response) => {
        expect(response.body).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              name: expect.any(String),
              price: expect.any(Number),
            }),
          ])
        );
      });
  });
};

const testCreate = (url) => {
  return it('respond with json', () => {
    request(app)
      .post(url)
      .send({ name: 'Katana', price: 2000 })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(201);
  });
};

const testGetOne = (url) => {
  return it('respond with json', () => {
    request(app)
      .get(url)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);
  });
};

const testUpdateOne = (url) => {
  return it('respond with json', () => {
    request(app)
      .patch(url)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);
  });
};

const testDeleteOne = (url) => {
  return it('respond with json', () => {
    request(app)
      .delete(url)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(204);
  });
};

describe('Products', () => {
  //Test for the get all products endpoint
  testGetAll('/api/v1/products/');
  //Test for the create product endpoint
  testCreate('api/v1/products/');
  //Test for the get one product endpoint
  testGetOne('/api/v1/products/:id');
  //Test for the update one product endpoint
  testUpdateOne('/api/v1/products/:id');
  //Test for the delete one product endpoint
  testDeleteOne('/api/v1/products/:id');
});

describe('Users', () => {
  //Test for the get all user endpoint
  testGetAll('/api/v1/users/');
  //Test for the signup user endpoint
  testCreate('api/v1/users/signup');
  //Test for the get one user endpoint
  testGetOne('/api/v1/users/:id');
  //Test for the update one product endpoint
  testUpdateOne('/api/v1/users/updateMe');
  //Test for the delete one product endpoint
  testDeleteOne('/api/v1/users/:id');
});
