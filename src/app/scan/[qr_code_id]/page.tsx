import { redirect } from 'next/navigation'

// L'ancien flow (client scanne le QR du commerçant) est remplacé.
// Le commerçant scanne désormais le QR personnel du client depuis son dashboard.
export default function OldScanPage() {
  redirect('/register')
}
