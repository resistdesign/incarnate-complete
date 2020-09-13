import { PATH_DELIMITER } from './Constants';
import ServiceResponse, { IServiceResponse } from '../Utils/ServiceResponse';
import { ObjectOf } from '../../types/base';

export interface HandlerResponse {
  statusCode?: string | number;
  headers?: ObjectOf<string>;
  body?: string;
}
export type AllowedOriginProcessor = (incomingOrigin: string) => boolean;
export type OriginProcessor =
  | string
  | string[]
  | RegExp
  | RegExp[]
  | AllowedOriginProcessor
  | AllowedOriginProcessor[];

const CLEAN_CONTENT_TYPE_HEADER_NAME = 'content-type';
const JSON_CONTENT_TYPE = 'application/json';

// SECURITY: Don't call private methods on services.
export const getMethodNameIsPrivate = (methodName = '') =>
  methodName.charAt(0) === '_';

export const getCleanPathParts = (path = '') =>
  path.split(PATH_DELIMITER).filter(p => !!p);

export const getResponse = (
  statusCode = 200,
  value?: any,
  headers = {}
): HandlerResponse => {
  const baseHeaders =
    typeof value === 'undefined'
      ? { ...headers }
      : { 'Content-Type': 'application/json', ...headers };
  const {
    headers: valueHeaders = {},
    other: valueOtherProperties = {},
  }: IServiceResponse =
    value instanceof ServiceResponse ? value : { statusCode: 400 };
  const mergedHeaders: ObjectOf<string> = {
    ...baseHeaders,
    ...valueHeaders,
  };
  const contentType = Object.keys(mergedHeaders).reduce(
    (acc: string | undefined, k: string) => {
      if (typeof acc !== 'undefined') {
        return acc;
      } else {
        const cleanKey = `${k}`.toLowerCase();

        if (cleanKey === CLEAN_CONTENT_TYPE_HEADER_NAME) {
          return mergedHeaders[k];
        } else {
          return undefined;
        }
      }
    },
    undefined
  );
  const contentIsJSON: boolean =
    typeof contentType === 'string' &&
    contentType.indexOf(JSON_CONTENT_TYPE) !== -1;

  return {
    statusCode,
    headers: mergedHeaders,
    body:
      typeof value === 'undefined'
        ? ''
        : contentIsJSON
        ? // Content is JSON.
          JSON.stringify(value, null, '  ')
        : // Content is NOT JSON.
          value,
    ...valueOtherProperties,
  };
};

export const getCORSHeaders = (
  clientOrigin: OriginProcessor = '',
  currentOrigin = ''
) => {
  const originProcessors =
    clientOrigin instanceof Array ? clientOrigin : [clientOrigin];
  const validOrigin: string = originProcessors.reduce(
    (acc: string, o: OriginProcessor) => {
      if (!!acc) {
        return acc;
      } else if (o instanceof RegExp) {
        return !!currentOrigin.match(o) ? currentOrigin : '';
      } else if (o instanceof Function) {
        return !!o(currentOrigin) ? currentOrigin : '';
      } else {
        return o === currentOrigin ? o : '';
      }
    },
    ''
  );

  return {
    'Access-Control-Allow-Origin': validOrigin,
    'Access-Control-Allow-Headers':
      'Origin, X-Requested-With, Content-Type, Accept, Authorization',
    'Access-Control-Allow-Methods':
      'OPTIONS, HEAD, GET, POST, PUT, PATCH, DELETE',
    'Access-Control-Allow-Credentials': 'true',
  };
};

export const getCleanHttpMethod = (method = 'POST') =>
  `${method}`.toUpperCase();
