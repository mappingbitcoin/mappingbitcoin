export const buildResponse = (message: string, status: number) => new Response(message, {status, headers: {'Content-Type': 'application/json'}})
export const buildObjectResponse = (message: object, status: number) => new Response(JSON.stringify(message), {status, headers: {'Content-Type': 'application/json'}})
export const successObjectResponse = (message: object) => (buildObjectResponse(message, 200))
