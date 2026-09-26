import {parseArxivSearch} from '../arxiv-search.ts';
import {parseArxivId,baseArxivId} from './arxiv.ts';
export async function fetchArxivPaper(input:string,fetcher:typeof fetch=fetch){
 const id=parseArxivId(input);
 const response=await fetcher(`https://export.arxiv.org/api/query?${new URLSearchParams({id_list:id})}`,{headers:{'User-Agent':'PhysicalAILibrary/0.1 (personal paper import)'},cache:'no-store',signal:AbortSignal.timeout(20000)});
 if(!response.ok)throw new Error('arXiv could not be reached. Your library is unchanged; please try again.');
 const result=parseArxivSearch(await response.text(),0).papers.find(p=>baseArxivId(p.id)===baseArxivId(id));
 if(result&&(!result.title||!Number.isFinite(Date.parse(result.published))))throw new Error('arXiv returned incomplete metadata. Please try again later.');
 if(!result)throw new Error('No paper was found for that arXiv ID.');
 return result;
}
