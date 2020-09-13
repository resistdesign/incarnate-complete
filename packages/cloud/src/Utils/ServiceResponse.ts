import { ObjectOf } from '../../types/base';

export interface IServiceResponse {
  statusCode: number;
  data?: any;
  headers?: ObjectOf<string>;
  other?: ObjectOf<any>;
}

export default class ServiceResponse implements IServiceResponse {
  constructor(
    public statusCode = 400,
    public data: any,
    public headers: ObjectOf<string> = {},
    public other: ObjectOf<any> = {}
  ) {}

  toJSON = () => this.data;
}
