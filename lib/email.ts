// ─── Types ────────────────────────────────────────────────────────────────────

export interface BookingEmailData {
  bookingId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  pickupAddress: string;
  dropoffAddress: string;
  vehicleType: string;
  date: string;
  time: string;
  passengers: number;
  estimatedPrice: number;
  distanceMiles?: number;
  duration?: string;
  isWeekend: boolean;
}

// ─── Vehicle helpers ──────────────────────────────────────────────────────────

const VEHICLE_ICONS: Record<string, string> = {
  SEDAN: "🚗",
  SUV: "🚙",
  SPRINTER: "🚐",
  LIMO: "🚖",
};

const VEHICLE_LABELS: Record<string, string> = {
  SEDAN: "Sedan",
  SUV: "SUV",
  SPRINTER: "Sprinter Van",
  LIMO: "Limousine",
};

function formatDate(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(timeStr: string) {
  const [h, min] = timeStr.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${String(min).padStart(2, "0")} ${ampm}`;
}

// ─── HTML template ────────────────────────────────────────────────────────────

function buildEmailHtml(data: BookingEmailData): string {
  const dark   = "#111111";
  const card   = "#1a1a1a";
  const border = "#2a2a2a";
  const muted  = "#888888";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Booking Confirmation</title>
</head>
<body style="margin:0;padding:0;background:${dark};font-family:Arial,Helvetica,sans-serif;color:#f0f0f0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${dark};padding:32px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:#0a0a0a;border:1px solid #222;border-radius:16px 16px 0 0;padding:40px;text-align:center;">
              <div style="font-size:40px;margin-bottom:12px;">🚖</div>
              <p style="color:#555;font-size:10px;letter-spacing:4px;text-transform:uppercase;margin:0 0 8px;">Premier</p>
              <h1 style="color:#fff;font-size:26px;margin:0 0 6px;font-weight:800;">Booking Confirmed</h1>
              <p style="color:${muted};margin:0;font-size:14px;">
                Thank you, ${data.customerName}. Your ride is locked in.
              </p>
            </td>
          </tr>

          <!-- Price banner -->
          <tr>
            <td style="background:#fff;padding:24px;text-align:center;">
              <p style="margin:0;font-size:11px;color:#888;text-transform:uppercase;letter-spacing:3px;font-weight:600;">
                Total Charged
              </p>
              <p style="margin:6px 0 0;font-size:48px;font-weight:900;color:#000;">
                $${data.estimatedPrice.toFixed(2)}
              </p>
              ${data.isWeekend ? '<p style="margin:6px 0 0;font-size:12px;color:#666;">Includes 20% weekend surcharge</p>' : ""}
            </td>
          </tr>

          <!-- Trip details -->
          <tr>
            <td style="background:${card};border-left:1px solid ${border};border-right:1px solid ${border};padding:32px;">
              <h2 style="color:#fff;font-size:13px;margin:0 0 20px;text-transform:uppercase;letter-spacing:2px;">
                Trip Details
              </h2>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid ${border};color:${muted};font-size:12px;width:40%;">Vehicle</td>
                  <td style="padding:10px 0;border-bottom:1px solid ${border};color:#fff;font-size:13px;">
                    ${VEHICLE_ICONS[data.vehicleType] ?? ""} ${VEHICLE_LABELS[data.vehicleType] ?? data.vehicleType}
                  </td>
                </tr>
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid ${border};color:${muted};font-size:12px;">Date</td>
                  <td style="padding:10px 0;border-bottom:1px solid ${border};color:#fff;font-size:13px;">${formatDate(data.date)}</td>
                </tr>
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid ${border};color:${muted};font-size:12px;">Time</td>
                  <td style="padding:10px 0;border-bottom:1px solid ${border};color:#fff;font-size:13px;">${formatTime(data.time)}</td>
                </tr>
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid ${border};color:${muted};font-size:12px;">Passengers</td>
                  <td style="padding:10px 0;border-bottom:1px solid ${border};color:#fff;font-size:13px;">${data.passengers}</td>
                </tr>
                ${
                  data.distanceMiles
                    ? `<tr>
                  <td style="padding:10px 0;border-bottom:1px solid ${border};color:${muted};font-size:12px;">Distance</td>
                  <td style="padding:10px 0;border-bottom:1px solid ${border};color:#fff;font-size:13px;">${data.distanceMiles.toFixed(1)} mi${data.duration ? ` · ${data.duration}` : ""}</td>
                </tr>`
                    : ""
                }
              </table>

              <!-- Addresses -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;">
                <tr>
                  <td style="padding:14px;background:#0f0f0f;border-radius:10px;border-left:3px solid #fff;">
                    <p style="margin:0 0 4px;color:${muted};font-size:10px;text-transform:uppercase;letter-spacing:2px;">Pickup</p>
                    <p style="margin:0;color:#fff;font-size:14px;">${data.pickupAddress}</p>
                  </td>
                </tr>
                <tr><td style="height:8px;"></td></tr>
                <tr>
                  <td style="padding:14px;background:#0f0f0f;border-radius:10px;border-left:3px solid #444;">
                    <p style="margin:0 0 4px;color:${muted};font-size:10px;text-transform:uppercase;letter-spacing:2px;">Drop-off</p>
                    <p style="margin:0;color:#fff;font-size:14px;">${data.dropoffAddress}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Booking ref -->
          <tr>
            <td style="background:${card};border:1px solid ${border};border-radius:0 0 16px 16px;padding:24px 32px;text-align:center;">
              <p style="color:${muted};font-size:11px;margin:0 0 6px;text-transform:uppercase;letter-spacing:2px;">
                Booking Reference
              </p>
              <p style="color:#fff;font-family:monospace;font-size:13px;margin:0 0 16px;word-break:break-all;">
                ${data.bookingId}
              </p>
              <p style="color:${muted};font-size:12px;margin:0;">
                Questions? Reply to this email or call us anytime.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px;text-align:center;">
              <p style="color:#333;font-size:12px;margin:0;">
                Premier Limo Service · All rights reserved
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─── Send function ────────────────────────────────────────────────────────────

export async function sendBookingConfirmationEmail(data: BookingEmailData) {
  const resendKey = process.env.RESEND_API_KEY;
  const isDemoMode = !resendKey || resendKey === "re_your-resend-api-key" || resendKey === "";

  // Demo mode — log the email instead of sending it
  if (isDemoMode) {
    console.log(
      `[email] DEMO MODE — would send confirmation to ${data.customerEmail}`,
      `\n  Booking: ${data.bookingId}`,
      `\n  Vehicle: ${data.vehicleType}`,
      `\n  Date: ${data.date} at ${data.time}`,
      `\n  Price: $${data.estimatedPrice.toFixed(2)}`
    );
    return { id: "demo-email-" + Date.now() };
  }

  // Real mode — send via Resend
  const { Resend } = await import("resend");
  const resend = new Resend(resendKey);
  const fromAddress = process.env.RESEND_FROM_EMAIL ?? "bookings@yourdomain.com";

  const VEHICLE_LABEL: Record<string, string> = {
    SEDAN: "Sedan", SUV: "SUV", SPRINTER: "Sprinter Van", LIMO: "Limousine",
  };

  const result = await resend.emails.send({
    from: `Premier Limo Service <${fromAddress}>`,
    to: data.customerEmail,
    subject: `Booking Confirmed — ${VEHICLE_LABEL[data.vehicleType] ?? data.vehicleType} on ${data.date}`,
    html: buildEmailHtml(data),
  });

  return result;
}
