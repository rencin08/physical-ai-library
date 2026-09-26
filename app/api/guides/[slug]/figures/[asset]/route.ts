import {NextRequest,NextResponse} from 'next/server';
import {readFile} from 'node:fs/promises';
import {guideFolder} from '@/lib/imports/guide-jobs';
import {localHost} from '@/lib/imports/access';
export async function GET(request:NextRequest,{params}:{params:Promise<{slug:string;asset:string}>}){
 if(!localHost(request.headers.get('host')))return new NextResponse(null,{status:403});
 try{const {slug,asset}=await params;if(!/^figure-[\da-zA-Z]+\.png$/.test(asset))throw new Error('Invalid asset');const bytes=await readFile(`${guideFolder(slug)}/figures/${asset}`);return new NextResponse(bytes,{headers:{'Content-Type':'image/png','Cache-Control':'private, no-store'}});}catch{return new NextResponse(null,{status:404});}
}
