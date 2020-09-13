import { getRequestResponse } from './Common';
import { ObjectOf } from '../../types/base';
import { HandlerResponse, OriginProcessor } from './Utils';
import { SubMapDeclaration } from '@incarnate/core';

export interface IAWSCloudFunctionEvent {
  httpMethod?: string;
  headers?: ObjectOf<string>;
  multiValueHeaders?: ObjectOf<string[]>;
  path?: string;
  body?: string;
}
export type IAWSCloudFunctionHandler = (
  event: IAWSCloudFunctionEvent
) => Promise<HandlerResponse>;

/**
 * Create an Incarnate managed Lambda handler.
 * @param {Object} config
 * @param {Object} config.incarnateConfig The incarnate configuration object.
 * @param {Array.<string>} config.allowedPaths A SECURITY measure to prevent access of values and methods outside of services.
 * @param {string|string[]|RegExp|RegExp[]|AllowedOriginProcessor|AllowedOriginProcessor[]} config.allowedOrigin The allowed CORS origin returned to `OPTIONS` requests.
 * @param {number} config.dependencyResolutionTimeoutMS The maximum number of milliseconds allotted for resolving service dependencies. Default: 300000 (5 minutes)
 *
 * @returns {Function} The Lambda handler.
 * */
export default ({
  incarnateConfig = {},
  allowedPaths = [],
  allowedOrigin = '',
  dependencyResolutionTimeoutMS = 300000,
}: {
  incarnateConfig?: SubMapDeclaration;
  allowedPaths?: string[];
  allowedOrigin?: OriginProcessor;
  dependencyResolutionTimeoutMS?: number;
} = {}): IAWSCloudFunctionHandler => {
  return async (event: IAWSCloudFunctionEvent = {}) => {
    const {
      httpMethod = 'POST',
      headers = {},
      multiValueHeaders = {},
      path = '',
      body: bodyString = '[]',
    } = event;

    return await getRequestResponse({
      incarnateConfig,
      allowedPaths,
      allowedOrigin,
      dependencyResolutionTimeoutMS,
      event,
      httpMethod,
      headers,
      multiValueHeaders,
      path,
      bodyString,
    });
  };
};
