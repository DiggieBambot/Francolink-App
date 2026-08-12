// The tutor directory now lives on the website, at francolink.net/tutors.
//
// This page used to list every tutor account with a hardcoded "5.0" rating and
// the same invented biography for all of them — claims about real, named people
// that nobody had verified. It also predates the platform-priced model, so it
// contradicted the live directory. Redirecting rather than deleting keeps any
// existing link or bookmark working.

import { redirect } from "next/navigation";
import { siteUrl } from "@/lib/site/hosts";

export default function TutorsRedirectPage() {
  redirect(siteUrl("/tutors"));
}
