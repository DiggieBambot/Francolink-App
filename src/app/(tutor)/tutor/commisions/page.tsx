// The earnings page used to live at this misspelled path. Old links and
// bookmarks still land somewhere.
import { redirect } from "next/navigation";

export default function OldCommissionsPath() {
  redirect("/tutor/commissions");
}
