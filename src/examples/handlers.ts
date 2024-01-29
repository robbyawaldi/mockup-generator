
/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA MOCKUP-GENERATOR              ##
 * ##                                                           ##
 * ## AUTHOR: robbyawaldi                                       ##
 * ## SOURCE: https://github.com/robbyawaldi/mockup-generator   ##
 * ---------------------------------------------------------------
 */


import bookList from './jsons/get/book-list.json'
import summaryOverview from './jsons/post/summary/overview.json'
import usersDetail from './jsons/post/users/*detail.json'
import users from './jsons/post/users/index.json'

import { delay, http, HttpResponse } from 'msw'

const httpGet = { 'api/book-list': bookList }
const httpPost = {
  'api/summary/overview': summaryOverview,
  'api/users/*': usersDetail,
  'api/users': users,
}
const httpPut = {}
const httpPatch = {}
const httpDelete = {}
const https = [
  { method: 'get', http: httpGet },
  { method: 'post', http: httpPost },
  { method: 'put', http: httpPut },
  { method: 'patch', http: httpPatch },
  { method: 'delete', http: httpDelete },
]
export const handlers = import.meta.env.DEV
  ? [
      ...https.flatMap((h) =>
        Object.keys(h.http).map((route) => {
          return (http as any)[h.method](route, async () => {
            await delay(0)
            return HttpResponse.json(h.http[route as keyof typeof h.http])
          })
        }),
      ),
    ]
  : []
