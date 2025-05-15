import { BodyTypes, Methods, Route, RouteResponse, RouteType } from '../models/route.model'
import { generateUUID } from '../utils/utils'

export const RouteDefault: Route = {
  get uuid() {
    return generateUUID()
  },
  name: '',
  type: RouteType.HTTP,
  documentation: '',
  method: Methods.get,
  endpoint: '',
  responses: [],
  responseMode: null,
  streamingMode: null,
  streamingInterval: 0,
  tags: [],
}

export const RouteResponseDefault: RouteResponse = {
  get uuid() {
    return generateUUID()
  },
  body: '{}',
  latency: 0,
  statusCode: 200,
  label: '',
  headers: [],
  bodyType: BodyTypes.INLINE,
  filePath: '',
  databucketID: '',
  sendFileAsBody: false,
  rules: [],
  rulesOperator: 'OR',
  disableTemplating: false,
  fallbackTo404: false,
  default: false,
  crudKey: 'id',
  callbacks: [],
}
