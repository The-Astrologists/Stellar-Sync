// ********************** Initialize server **********************************

const server = require('../src/index'); //TODO: Make sure the path to your index.js is correctly added

// ********************** Import Libraries ***********************************

const chai = require('chai'); // Chai HTTP provides an interface for live integration testing of the API's.
const chaiHttp = require('chai-http');
chai.should();
chai.use(chaiHttp);
const {assert, expect} = chai;

// ********************** DEFAULT WELCOME TESTCASE ****************************

describe('Server!', () => {
  // Sample test case given to test / endpoint.
  it('Returns the default welcome message', done => {
    chai
      .request(server)
      .get('/welcome')
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body.status).to.equals('success');
        assert.strictEqual(res.body.message, 'Welcome!');
        done();
      });
  });
});

// *********************** TODO: WRITE 2 UNIT TESTCASES **************************
describe('Testing Add User API', () => {
  /*
  it('positive : /register', done => {
    chai
      .request(server)
      .post('/register')
      .send({username: 'John Doe', password: 'freak', birthday: '2020-02-20'})
      .end((err, res) => {
        //console.log(res);
        expect(res).to.have.status(200);
        //expect(res.body.message).to.equals('Success');
        done();
      });
  });
  */

  it('Negative : /register Checking invalid name', done => {
    chai
      .request(server)
      .post('/register')
      .send({username: 10, password: '5', birthday: '5'})
      .end((err, res) => {
        expect(res).to.have.status(400);
        //expect(res.body.message).to.equals('Error');
        done();
      });
  });
});

describe('Testing Render', () => {
  // Sample test case given to test /test endpoint.
  it('postive "/login" route should render with an html response', done => {
    chai
      .request(server)
      .get('/login') // for reference, see lab 8's login route (/login) which renders home.hbs
      .end((err, res) => {
        res.should.have.status(200); // Expecting a success status code
        res.should.be.html; // Expecting a HTML response
        done();
      });
  });

  it('negative "/login" route should render with an html response', done => {
    chai
      .request(server)
      .get('/login') // for reference, see lab 8's login route (/login) which renders home.hbs
      .end((err, res) => {
        res.should.have.status(200); // Expecting a success status code
        res.should.be.html; // Expecting a HTML response
        done();
      });
  });
});

// ********************************************************************************


// *********************************************************************************

// describe('Landing page render', () => {
//   it('successfuly loads the landing page', done => {
//     chai
//       .request(server)
//       .get('/landing')
//       .end((err, res) => {
//         expect(res).to.have.status(200);
//         expect(res.body.status).to.equals('success');
//         assert.strictEqual(res.body.message, 'landing page loaded succssfully!');
//         done();
//       });
//   });
// });

// ******************************************************************************

// describe('Testing Landing', () => {
//   // Sample test case given to test /test endpoint.
//   it('postive "/landing" route should render with an html response', done => {
//     chai
//       .request(server)
//       .get('/landing')
//       .end((err, res) => {
//         res.should.have.status(200); // Expecting a success status code
//         done();
//       });
//   });

//   it('negative "/login" route should render with an html response', done => {
//     chai
//       .request(server)
//       .get('/landing') 
//       .end((err, res) => {
//         res.should.have.status(200); // Expecting a success status code
//         done();
//       });
//   });
// });
