//import * as mocha from 'mocha';
import 'mocha';
import 'chai';
//import * as chai from 'chai';

// chai.use(chaiHttp);
// const expect = chai.expect;

// let id = '';

// beforeEach((done) => {
//   mongoose.connect('mongodb://localhost/x2');

//   var email = new Email({
//     descriptorNodeId: 300000,
//     senderEmailAddress: 'foo@bar.com',
//     senderName: 'Foo Bar',
//     subject: 'beyond all repair',
//     body: "it'a totally...",
//     creationTime: 'March 19, 2016',
//     messageSize: 42
//   });
//   id = email._id;
//   email.save(function(err) {
//     if (err) return handleError(err);
//     done();
//   });
// });

// afterEach(() => {
//   Email.remove({ id: 300000 }, function(err) {
//     if (err) return handleError(err);
//   });

//   mongoose.disconnect();
// });

describe('hello world', () => {
  it('should say hello world', () => {
    console.log('hello world')
  });
});

// describe('GET email', () => {
//   it('responds with JSON array', () => {
//     return chai
//       .request(app)
//       .get('/email')
//       .then(res => {
//         expect(res.status).to.equal(200);
//         expect(res).to.be.json;
//         expect(res.body).to.be.an('array');
//       });
//   });

//   it('should include Foo Bar', () => {
//     return chai
//       .request(app)
//       .get('/email')
//       .then(res => {
//         let email = res.body.find(email => email.senderName === 'Foo Bar');
//         expect(email).to.exist;
//       });
//   });

// });
  
// describe('GET specific email', () => {
//   it('responds with JSON object', () => {
//     return chai
//       .request(app)
//       .get('/email/' + id)
//       .then(res => {
//         expect(res.status).to.equal(200);
//         expect(res).to.be.json;
//         expect(res.body).to.be.an('object');
//       });
//   });

//   it('should be Foo Bar', () => {
//     return chai
//       .request(app)
//       .get('/email/' + id)
//       .then(res => {
//         expect(res.body.senderName).to.equal('Foo Bar');
//       });
//   });
// });