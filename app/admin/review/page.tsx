import { backendConfigured } from "@/lib/backend/config";
import { createAdminClient } from "@/lib/backend/supabase";
import { ReviewQueue } from "@/components/ReviewQueue";

export const dynamic = "force-dynamic";

export default async function ReviewPage() {
  if (!backendConfigured()) return <div className="wrap inner-page min-page"><div className="page-intro"><div className="eyebrow">Editorial backend</div><h1>Connect the<br/><em>archive.</em></h1><p>The ingestion backend is installed but Supabase credentials have not been added yet.</p></div><div className="setup-card"><span>Setup required</span><h2>Connect a Supabase project</h2><ol><li>Copy <code>.env.example</code> to <code>.env.local</code>.</li><li>Add the project URL, anon key, service-role key, and a cron secret.</li><li>Run the SQL migration in <code>supabase/migrations</code>.</li><li>Restart the development server and trigger ingestion.</li></ol></div></div>;
  const supabase=createAdminClient(); const {data,error}=await supabase.from("papers").select("id,title,abstract,arxiv_id,arxiv_url,relevance_score,relevance_terms,published_at,authors_json,github_url,citation_count").eq("status","needs_review").order("relevance_score",{ascending:false}).limit(100);
  return <div className="wrap inner-page"><div className="page-intro"><div className="eyebrow">Editorial backend</div><h1>Review the<br/><em>incoming shelf.</em></h1><p>Approve, reject, and refine new research before it enters the public library.</p></div>{error?<p>{error.message}</p>:<ReviewQueue initialPapers={data??[]}/>}</div>;
}
