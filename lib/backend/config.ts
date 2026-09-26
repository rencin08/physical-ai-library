import { libraryConfig } from "../library-config";

export const physicalAiQuery = libraryConfig.arxivQuery;
export const relevanceTerms = libraryConfig.relevanceTerms;

export function backendConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}
