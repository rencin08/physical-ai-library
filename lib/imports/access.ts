import type {NextRequest} from 'next/server';
export function localHost(host:string|null){
 try{return ['localhost','127.0.0.1','[::1]'].includes(new URL(`http://${host}`).hostname);}catch{return false;}
}
export function localMutation(request:NextRequest){
 return localHost(request.headers.get('host'))&&request.headers.get('origin')===`${request.nextUrl.protocol}//${request.headers.get('host')}`&&request.headers.get('content-type')?.startsWith('application/json');
}
