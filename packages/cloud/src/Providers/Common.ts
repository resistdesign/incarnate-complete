import {
  getCleanHttpMethod,
  getCleanPathParts,
  getCORSHeaders,
  getMethodNameIsPrivate,
  getResponse,
  HandlerResponse,
  OriginProcessor,
} from './Utils';
import { DEP_NAMES, METHODS, PATH_DELIMITER } from './Constants';
import Incarnate, { SubMapDeclaration } from '@incarnate/core';
import { parse as ParseCookies } from 'cookie';
import ServiceResponse, { IServiceResponse } from '../Utils/ServiceResponse';
import toCamelCase from 'lodash.camelcase';
import { ObjectOf } from '../../types/base';

/**
 * The generic request handler.
 * @param {Object} config The configuration object.
 * @param {Object} config.incarnateConfig The incarnate configuration object.
 * @param {Array.<string>} config.allowedPaths A SECURITY measure to prevent access of values and methods outside of services.
 * @param {string|string[]|RegExp|RegExp[]|AllowedOriginProcessor|AllowedOriginProcessor[]} config.allowedOrigin The allowed CORS origin returned to `OPTIONS` requests.
 * @param {number} config.dependencyResolutionTimeoutMS The maximum number of milliseconds allotted for resolving service dependencies. Default: 300000 (5 minutes)
 * @param {Object} config.event The raw invocation event object.
 * @param {string} config.httpMethod The HTTP method for the request. Default: POST
 * @param {Object} config.headers The HTTP headers object.
 * @param {Object} [config.multiValueHeaders] An optional map of HTTP headers with multiple values stored as Array values for each header name key.
 * @param {string} config.path The HTTP request path.
 * @param {string} config.bodyString The raw HTTP body as a string that will be parsed as JSON and expected to be an Array of arguments to the destination function.
 *
 * @returns {HandlerResponse} The handler response object.
 * */
export const getRequestResponse = async ({
  incarnateConfig = {},
  allowedPaths,
  allowedOrigin = '',
  dependencyResolutionTimeoutMS = 300000,
  event = {},
  httpMethod = 'POST',
  headers = {},
  multiValueHeaders = {},
  path = '',
  bodyString = '[]',
}: {
  incarnateConfig?: SubMapDeclaration;
  allowedPaths?: string[];
  allowedOrigin?: OriginProcessor;
  dependencyResolutionTimeoutMS?: number;
  event?: ObjectOf<any>;
  httpMethod?: string;
  headers?: ObjectOf<string>;
  multiValueHeaders?: ObjectOf<string[]>;
  path?: string;
  bodyString?: string;
} = {}): Promise<HandlerResponse> => {
  const incomingHeaders = {
    ...headers,
    ...multiValueHeaders,
  };
  const incomingHeadersWithLowerCaseKeys = Object.keys(incomingHeaders).reduce(
    (acc, k) => ({
      ...acc,
      [k.toLowerCase()]: incomingHeaders[k],
    }),
    {}
  );
  const {
    // IMPORTANT: Use lowercase header key.
    origin: incomingOrigin = '',
  }: ObjectOf<string | string[]> = incomingHeadersWithLowerCaseKeys;
  const currentOrigin =
    incomingOrigin instanceof Array ? incomingOrigin[0] : incomingOrigin;
  const corsHeaders = getCORSHeaders(allowedOrigin, currentOrigin);
  const getResponseWithCORS = (
    statusCode = 200,
    value?: any,
    headers = {}
  ): HandlerResponse => {
    return getResponse(statusCode, value, {
      ...corsHeaders,
      ...headers,
    });
  };
  const cleanHttpMethod = getCleanHttpMethod(httpMethod);

  if (cleanHttpMethod === METHODS.OPTIONS) {
    return getResponseWithCORS(200);
  }

  // SECURITY: IMPORTANT: Only expose allowed paths. (`/package/service/method`)
  if (
    allowedPaths &&
    allowedPaths.length > 0 &&
    allowedPaths.indexOf(path) === -1
  ) {
    return getResponseWithCORS(404, { message: 'Not Found' });
  }

  const body = JSON.parse(bodyString);
  const { subMap = {} } = incarnateConfig;
  const cleanPathParts = getCleanPathParts(path);
  const cleanPath = cleanPathParts.join(PATH_DELIMITER);
  const inc = new Incarnate({
    ...incarnateConfig,
    pathDelimiter: PATH_DELIMITER,
    subMap: {
      [DEP_NAMES.INPUT]: {
        subMap: {
          [DEP_NAMES.HEADERS]: {
            factory: () => incomingHeadersWithLowerCaseKeys,
          },
          [DEP_NAMES.COOKIES]: {
            dependencies: {
              suppliedHeaders: DEP_NAMES.HEADERS,
            },
            factory: ({
              suppliedHeaders = {},
            }: { suppliedHeaders?: ObjectOf<string | string[]> } = {}) => {
              const { cookie: cookieValue = '' } = suppliedHeaders;
              const targetCookieString: string =
                cookieValue instanceof Array
                  ? cookieValue[0] || ''
                  : cookieValue;

              return ParseCookies(targetCookieString);
            },
          },
          [DEP_NAMES.PATH]: {
            factory: () => cleanPath,
          },
          [DEP_NAMES.EVENT]: {
            factory: () => event,
          },
          [DEP_NAMES.CONTEXT]: {
            dependencies: {
              event: DEP_NAMES.EVENT,
            },
            factory: ({ event: { requestContext = {} } = {} } = {}) =>
              requestContext,
          },
          [DEP_NAMES.IDENTITY]: {
            dependencies: {
              context: DEP_NAMES.CONTEXT,
            },
            factory: ({ context: { identity = {} } = {} } = {}) => identity,
          },
        },
      },
      [DEP_NAMES.PACKAGES]: {
        shared: {
          [DEP_NAMES.INPUT]: DEP_NAMES.INPUT,
        },
        subMap,
      },
    },
  });
  const [packageName, serviceName, methodName] = cleanPathParts.map(p =>
    typeof p === 'string' ? toCamelCase(p) : p
  );
  const methodNameIsPrivate = getMethodNameIsPrivate(methodName);
  const args = body instanceof Array ? body : [];

  if (!!packageName && !!serviceName && !!methodName && !methodNameIsPrivate) {
    const servicePath = [DEP_NAMES.PACKAGES, packageName, serviceName];

    let serviceInstance: ObjectOf<any> = {};

    try {
      serviceInstance = await inc.getResolvedPathAsync(
        servicePath,
        dependencyResolutionTimeoutMS
      );
    } catch (error) {
      const {
        message,
        data,
        error: directError,
        source: {
          error: { message: sourceMessage = undefined } = {},
          path = undefined,
          causePath = undefined,
        } = {},
      } = error || {};
      const responseData =
        error instanceof ServiceResponse
          ? error
          : directError instanceof ServiceResponse
          ? directError
          : {
              message,
              data,
              source: {
                message: sourceMessage,
                path,
                causePath,
              },
            };
      const { statusCode = 500 } = responseData as IServiceResponse;

      return getResponseWithCORS(statusCode, responseData);
    }

    const { [methodName]: serviceMethod } = serviceInstance;

    if (serviceMethod instanceof Function) {
      try {
        const returnValue = await serviceMethod(...args);
        const returnValueAsObject =
          returnValue instanceof Object ? returnValue : {};
        const { statusCode = 200 } = returnValueAsObject;

        return getResponseWithCORS(statusCode, returnValue);
      } catch (error) {
        const errorAsObject = error instanceof Object ? error : {};
        const { statusCode = 500 } = errorAsObject;

        return getResponseWithCORS(statusCode, error);
      }
    } else {
      return getResponseWithCORS(404, { message: 'Not Found' });
    }
  } else {
    return getResponseWithCORS(404, { message: 'Not Found' });
  }
};
