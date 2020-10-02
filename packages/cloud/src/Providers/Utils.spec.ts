import expect from 'expect.js';
import { getCORSHeaders } from './Utils';

module.exports = {
  Utils: {
    getCORSHeaders: {
      'should allow the incoming origin if it is supplied as a string': () => {
        const clientOrigin = 'https://app.example.com';
        const currentOrigin = 'https://app.example.com';
        const {
          'Access-Control-Allow-Origin': accessControlAllowOrigin,
        } = getCORSHeaders(clientOrigin, currentOrigin);

        expect(accessControlAllowOrigin).to.equal(currentOrigin);
      },
      'should not allow the incoming origin if it is not supplied as a string': () => {
        const clientOrigin = 'https://app.example.com';
        const currentOrigin = 'https://app.incorrect.com';
        const {
          'Access-Control-Allow-Origin': accessControlAllowOrigin,
        } = getCORSHeaders(clientOrigin, currentOrigin);

        expect(accessControlAllowOrigin).to.not.equal(currentOrigin);
      },
      'should allow the incoming origin if it is supplied as a string in an array': () => {
        const clientOrigin = ['https://app.example.com'];
        const currentOrigin = 'https://app.example.com';
        const {
          'Access-Control-Allow-Origin': accessControlAllowOrigin,
        } = getCORSHeaders(clientOrigin, currentOrigin);

        expect(accessControlAllowOrigin).to.equal(currentOrigin);
      },
      'should not allow the incoming origin if it is not supplied as a string in an array': () => {
        const clientOrigin = ['https://app.example.com'];
        const currentOrigin = 'https://app.incorrect.com';
        const {
          'Access-Control-Allow-Origin': accessControlAllowOrigin,
        } = getCORSHeaders(clientOrigin, currentOrigin);

        expect(accessControlAllowOrigin).to.not.equal(currentOrigin);
      },
    },
  },
};
