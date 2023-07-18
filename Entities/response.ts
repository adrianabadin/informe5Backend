/* eslint-disable n/handle-callback-err */
export interface IResponseObject {
  error?: any
  ok: boolean
  data: any
}

export class ResponseObject implements IResponseObject {
  constructor (
    public error: any,
    public ok: boolean,
    public data: any) {}
}
export interface GenericResponseObject<T> {
  error: any
  ok: boolean
  data: T
}
