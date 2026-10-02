// The certificate as a picture: francolink.net/certificates/<n>/image
//
//   ?format=certificate  2000×1414  the certificate itself (the default)
//   ?format=wide         1200×630   link previews (the page's og:image)
//   ?format=square       1080×1080  an Instagram or Facebook post
//   ?format=story        1080×1920  Stories, WhatsApp Status
//   &download=1      save it rather than show it
//
// The design lives in lib/certificates/image.tsx. Open to any origin (CORS) so
// the app's web build can fetch it and hand the file to the share sheet.

import { type CertificateFormat, SIZES, certificateImage } from "@/lib/certificates/image";
import { verifyCertificate } from "@/lib/certificates/verify";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ number: string }> }
) {
  const { number } = await params;
  const search = new URL(request.url).searchParams;
  const asked = search.get("format") ?? "";
  const format: CertificateFormat = asked in SIZES ? (asked as CertificateFormat) : "certificate";

  const c = await verifyCertificate(decodeURIComponent(number));
  if (!c) return new Response("Not found", { status: 404 });

  const image = await certificateImage(c, format);
  const headers = new Headers(image.headers);
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Cache-Control", "public, max-age=3600, s-maxage=86400");
  if (search.get("download") === "1") {
    headers.set("Content-Disposition", `attachment; filename="francolink-${c.certificate_number}-${format}.png"`);
  }
  return new Response(image.body, { status: image.status, headers });
}
