import expect from 'expect.js';
import { DEP_NAMES, AWS, Google } from './index.jsx';
import MockAPIGatewayEvent from '../Mock Data/AWS/Mock API Gateway Event';
import MockGCFRequestContext from '../Mock Data/Google/Mock GCF Request Context';

class MockResponse {
  response = {
    statusCode: 200,
    headers: {},
    body: '',
  };

  set = (key, value) => {
    this.response.headers[key] = value;
  };

  status = statusCode => {
    this.response.statusCode = statusCode;

    return this;
  };

  send = body => (this.response.body = body);
}

const createTestWithAllowedOrigin = (
  allowedOrigin = '',
  eventData = MockAPIGatewayEvent,
  expectOrigin = 'http://example.com'
) => async () => {
  const cloudFunction = AWS({
    incarnateConfig: {
      subMap: {
        package: {
          subMap: {
            service: {
              factory: () => {
                return {
                  methodName: a1 => a1,
                };
              },
            },
          },
        },
      },
    },
    allowedPaths: ['/package/service/method-name'],
    allowedOrigin,
  });
  const resp = await cloudFunction(eventData);
  const {
    headers: { 'Access-Control-Allow-Origin': allowedCorsOrigin = '' } = {},
    body: responseBody,
  } = resp;

  expect(responseBody).to.be.a('string');
  expect(allowedCorsOrigin).to.be(expectOrigin);
};

module.exports = {
  AWS: {
    'should return a response': async () => {
      const cloudFunction = AWS({
        incarnateConfig: {
          subMap: {
            package: {
              subMap: {
                service: {
                  factory: () => {
                    return {
                      methodName: a1 => a1,
                    };
                  },
                },
              },
            },
          },
        },
        allowedPaths: ['/package/service/method-name'],
        allowedOrigin: 'http://example.com',
      });
      const { body: responseBody } = await cloudFunction(MockAPIGatewayEvent);

      expect(responseBody).to.be.a('string');

      const parsedResponseBody = JSON.parse(responseBody);

      expect(parsedResponseBody).to.be.a('string');
      expect(parsedResponseBody).to.equal('Arguments in JSON');
    },
    'should return asynchronous dependency errors': async () => {
      const errorMessage = 'X_FAILED';
      const cloudFunction = AWS({
        incarnateConfig: {
          subMap: {
            config: {
              subMap: {
                x: {
                  factory: async () => {
                    throw new Error(errorMessage);
                  },
                },
              },
            },
            package: {
              shared: {
                config: 'config',
              },
              subMap: {
                service: {
                  dependencies: {
                    x: 'config/x',
                  },
                  strict: true,
                  factory: () => {
                    return {
                      methodName: a1 => a1,
                    };
                  },
                },
              },
            },
          },
        },
        allowedPaths: ['/package/service/method-name'],
        allowedOrigin: 'http://example.com',
      });
      const result = await cloudFunction(MockAPIGatewayEvent);
      const { statusCode, body: responseBody = 'undefined' } = result || {};
      const { source: { message: sourceMessage } = {} } =
        JSON.parse(responseBody) || {};

      expect(statusCode).to.be(500);
      expect(sourceMessage).to.be(errorMessage);
    },
    'should handle missing strict dependencies gracefully': async () => {
      const cloudFunction = AWS({
        incarnateConfig: {
          subMap: {
            config: {
              subMap: {
                x: {
                  factory: () => undefined,
                },
              },
            },
            package: {
              shared: {
                config: 'config',
              },
              subMap: {
                service: {
                  dependencies: {
                    x: 'config/x',
                  },
                  strict: true,
                  factory: () => {
                    return {
                      methodName: a1 => a1,
                    };
                  },
                },
              },
            },
          },
        },
        allowedPaths: ['/package/service/method-name'],
        allowedOrigin: 'http://example.com',
        // IMPORTANT: Add a reasonable timeout.
        dependencyResolutionTimeoutMS: 1000,
      });
      const result = await cloudFunction(MockAPIGatewayEvent);
      const { statusCode, body: responseBody = '{}' } = result || {};
      const { message } = JSON.parse(responseBody) || {};

      expect(statusCode).to.be(500);
      expect(message).to.be('RESOLUTION_TIMEOUT');
    },
    'should supply request specific built-in dependencies': async () => {
      const getDepPath = p => `${DEP_NAMES.INPUT}/${p}`;
      const cloudFunction = AWS({
        incarnateConfig: {
          subMap: {
            package: {
              shared: {
                [DEP_NAMES.INPUT]: DEP_NAMES.INPUT,
              },
              subMap: {
                service: {
                  dependencies: {
                    event: getDepPath(DEP_NAMES.EVENT),
                    context: getDepPath(DEP_NAMES.CONTEXT),
                    identity: getDepPath(DEP_NAMES.IDENTITY),
                  },
                  factory: d => ({
                    methodName: () => d,
                  }),
                },
              },
            },
          },
        },
        allowedPaths: ['/package/service/method-name'],
        allowedOrigin: 'http://example.com',
        // IMPORTANT: Add a reasonable timeout.
        dependencyResolutionTimeoutMS: 1000,
      });
      const result = await cloudFunction(MockAPIGatewayEvent);
      const { statusCode, body: responseBody = '{}' } = result || {};
      const { event, context, identity } = JSON.parse(responseBody) || {};

      expect(statusCode).to.be(200);

      expect(event).to.be.an(Object);
      expect(event.test).to.be('TEST_EVENT');

      expect(context).to.be.an(Object);
      expect(context.test).to.be('TEST_CONTEXT');

      expect(identity).to.be.an(Object);
      expect(identity.test).to.be('TEST_IDENTITY');
    },
    'should process allowed origins by string, regex or function': async () =>
      Promise.all([
        createTestWithAllowedOrigin('http://example.com')(),
        createTestWithAllowedOrigin(/^.*?example\.com$/gim)(),
        createTestWithAllowedOrigin(() => true)(),
      ]),
    'should process allowed origins as an array of either string, regex or function': async () =>
      Promise.all([
        createTestWithAllowedOrigin(['http://example.com'])(),
        createTestWithAllowedOrigin([/^.*?example\.com$/gim])(),
        createTestWithAllowedOrigin(
          ['http://example.com', /^.*?example\.com($|:[0-9]*$)/gim],
          {
            ...MockAPIGatewayEvent,
            headers: {
              ...MockAPIGatewayEvent.headers,
              Origin: 'http://example.com:5000',
            },
          },
          'http://example.com:5000'
        )(),
        createTestWithAllowedOrigin(
          ['http://example.com', /^.*?example\.com($|:[0-9]*$)/gim],
          {
            ...MockAPIGatewayEvent,
            headers: {
              // TRICKY: Test lowercase origin header key.
              origin: 'http://example.com:5000',
            },
          },
          'http://example.com:5000'
        )(),
        createTestWithAllowedOrigin([() => true])(),
      ]),
  },
  Google: {
    'should return a response': async () => {
      const cloudFunction = Google({
        incarnateConfig: {
          subMap: {
            package: {
              subMap: {
                service: {
                  factory: () => {
                    return {
                      methodName: a1 => a1,
                    };
                  },
                },
              },
            },
          },
        },
        allowedPaths: ['/package/service/method-name'],
        allowedOrigin: 'http://example.com',
      });
      const MockResponseInstance = new MockResponse();

      await cloudFunction(MockGCFRequestContext, MockResponseInstance);

      const { body: responseBody } = MockResponseInstance.response || {};

      expect(responseBody).to.be.a('string');

      const parsedResponseBody = JSON.parse(responseBody);

      expect(parsedResponseBody).to.be.a('string');
      expect(parsedResponseBody).to.equal('Arguments in JSON');
    },
    'should return asynchronous dependency errors': async () => {
      const errorMessage = 'X_FAILED';
      const cloudFunction = Google({
        incarnateConfig: {
          subMap: {
            config: {
              subMap: {
                x: {
                  factory: async () => {
                    throw new Error(errorMessage);
                  },
                },
              },
            },
            package: {
              shared: {
                config: 'config',
              },
              subMap: {
                service: {
                  dependencies: {
                    x: 'config/x',
                  },
                  strict: true,
                  factory: () => {
                    return {
                      methodName: a1 => a1,
                    };
                  },
                },
              },
            },
          },
        },
        allowedPaths: ['/package/service/method-name'],
        allowedOrigin: 'http://example.com',
      });
      const MockResponseInstance = new MockResponse();

      await cloudFunction(MockGCFRequestContext, MockResponseInstance);

      const { statusCode, body: responseBody = 'undefined' } =
        MockResponseInstance.response || {};
      const { source: { message: sourceMessage } = {} } =
        JSON.parse(responseBody) || {};

      expect(statusCode).to.be(500);
      expect(sourceMessage).to.be(errorMessage);
    },
    'should handle missing strict dependencies gracefully': async () => {
      const cloudFunction = Google({
        incarnateConfig: {
          subMap: {
            config: {
              subMap: {
                x: {
                  factory: () => undefined,
                },
              },
            },
            package: {
              shared: {
                config: 'config',
              },
              subMap: {
                service: {
                  dependencies: {
                    x: 'config/x',
                  },
                  strict: true,
                  factory: () => {
                    return {
                      methodName: a1 => a1,
                    };
                  },
                },
              },
            },
          },
        },
        allowedPaths: ['/package/service/method-name'],
        allowedOrigin: 'http://example.com',
        // IMPORTANT: Add a reasonable timeout.
        dependencyResolutionTimeoutMS: 1000,
      });
      const MockResponseInstance = new MockResponse();

      await cloudFunction(MockGCFRequestContext, MockResponseInstance);

      const { statusCode, body: responseBody = '{}' } =
        MockResponseInstance.response || {};
      const { message } = JSON.parse(responseBody) || {};

      expect(statusCode).to.be(500);
      expect(message).to.be('RESOLUTION_TIMEOUT');
    },
    'should supply request specific built-in dependencies': async () => {
      const getDepPath = p => `${DEP_NAMES.INPUT}/${p}`;
      const cloudFunction = Google({
        incarnateConfig: {
          subMap: {
            package: {
              shared: {
                [DEP_NAMES.INPUT]: DEP_NAMES.INPUT,
              },
              subMap: {
                service: {
                  dependencies: {
                    event: getDepPath(DEP_NAMES.EVENT),
                    context: getDepPath(DEP_NAMES.CONTEXT),
                    identity: getDepPath(DEP_NAMES.IDENTITY),
                  },
                  factory: d => ({
                    methodName: () => d,
                  }),
                },
              },
            },
          },
        },
        allowedPaths: ['/package/service/method-name'],
        allowedOrigin: 'http://example.com',
        // IMPORTANT: Add a reasonable timeout.
        dependencyResolutionTimeoutMS: 1000,
      });
      const MockResponseInstance = new MockResponse();

      await cloudFunction(MockGCFRequestContext, MockResponseInstance);

      const { statusCode, body: responseBody = '{}' } =
        MockResponseInstance.response || {};
      const { event, context, identity } = JSON.parse(responseBody) || {};

      expect(statusCode).to.be(200);

      expect(event).to.be.an(Object);
      expect(event.test).to.be('TEST_EVENT');

      expect(context).to.be.an(Object);
      expect(context.test).to.be('TEST_CONTEXT');

      expect(identity).to.be.an(Object);
      expect(identity.test).to.be('TEST_IDENTITY');
    },
  },
};
