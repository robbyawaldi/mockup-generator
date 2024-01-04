import { delay, http, HttpResponse } from 'msw'

const httpGet = {}
const httpPost = {
  'api/summary/overview': await import('./jsons/post/summary/overview.json'),
  'api/users/*': await import('./jsons/post/users/*detail.json'),
  'api/users': await import('./jsons/post/users/index.json'),
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
            await delay(1000)
            return HttpResponse.json(h.http[route as keyof typeof h.http])
          })
        }),
      ),
    ]
  : []
