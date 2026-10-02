// One certificate's public face, by number: what the public page and the
// shareable images show. Backed by verify_certificate()
// (20261005_certificates.sql), which returns nothing for a number that
// doesn't exist -- and numbers carry 40 random bits, so nothing can be found
// by guessing.

import { cache } from "react";
import { createClient } from "@supabase/supabase-js";

export interface VerifiedCertificate {
  certificate_number: string;
  holder_name: string;
  language: string;
  level: string;
  course_title: string | null;
  score: number | null;
  total_xp: number | null;
  issued_at: string;
}

// cache(): the page and its metadata both ask, and should cost one query.
export const verifyCertificate = cache(
  async (number: string): Promise<VerifiedCertificate | null> => {
    if (!/^[A-Z0-9-]{6,40}$/.test(number)) return null;
    const db = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    );
    const { data } = await db.rpc("verify_certificate", { p_number: number });
    return (Array.isArray(data) ? data[0] : data) ?? null;
  }
);
