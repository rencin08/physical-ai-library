import {NextRequest,NextResponse} from 'next/server';
import {localHost} from '@/lib/imports/access';
export async function GET(request:NextRequest){
 return NextResponse.json({app:'physical-ai-library',local:localHost(request.headers.get('host'))},{headers:{'Cache-Control':'no-store'}});
}
