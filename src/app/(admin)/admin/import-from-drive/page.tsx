import { ImportFromDriveClient } from "./client";

export const metadata = {
  title: "Import from Google Drive | Admin",
};

export default function ImportFromDrivePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Import lessons from Google Drive</h1>
        <p className="text-sm text-slate-600">
          Paste a Drive folder URL. The folder and all docs inside must be set to{" "}
          <strong>&quot;Anyone with the link can view&quot;</strong>.
        </p>
      </div>
      <ImportFromDriveClient />
    </div>
  );
}
