
// Accepts POST requests with: { to_email: string }
// Sends all visible "High-Risk Fishing Areas" in the email.
//
// Uses Resend for transactional emails.

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const FETCH_FUNCTION_URL = `${Deno.env.get("SUPABASE_URL")}/functions/v1/fetch-fishing-data`;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  let to_email: string | undefined;
  if (req.method === "POST") {
    try {
      const json = await req.json();
      if (typeof json.to_email === "string" && json.to_email.includes("@")) {
        to_email = json.to_email.trim();
      }
    } catch (_err) {}
  }

  if (!to_email) {
    return new Response(JSON.stringify({ error: "Missing or invalid email address." }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!RESEND_API_KEY) {
    return new Response(JSON.stringify({ error: "Resend API key is not set." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    // Fetch latest data from fetch-fishing-data edge function
    const response = await fetch(FETCH_FUNCTION_URL, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorJSON = null;
      try { errorJSON = JSON.parse(errorText); } catch {}
      return new Response(
        JSON.stringify({
          error: `Failed to fetch real-time fishing data: ${response.status}`,
          details: errorJSON || errorText
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const responseData = await response.json();
    const data = responseData.data || responseData;

    // Get ALL high-risk areas for the email
    const allRisks =
      data?.high_risk_areas && Array.isArray(data.high_risk_areas) && data.high_risk_areas.length > 0
        ? data.high_risk_areas
        : null;

    if (!allRisks) {
      return new Response(JSON.stringify({ message: "No high risk areas found. No email sent." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build an HTML table with all rows
    let riskRowsHtml = allRisks.map((row: any, idx: number) => {
      let badgeColor =
        row.risk_level?.toLowerCase() === "critical"  ? "background:#dc2626;color:white;" : // Red
        row.risk_level?.toLowerCase() === "high"      ? "background:#f59e42;color:white;" : // Orange
        row.risk_level?.toLowerCase() === "medium"    ? "background:#eab308;color:white;" : // Yellow
        "background:#22c55e;color:white;";
      return `<tr>
        <td style="padding:6px 8px;font-family:monospace;font-size:13px;">#${row.id || idx + 1}</td>
        <td style="padding:6px 8px;">${(row.latitude ?? 0).toFixed(3)}, ${(row.longitude ?? 0).toFixed(3)}</td>
        <td style="padding:6px 8px;"><span style="border-radius:4px;padding:2px 6px;border:1px solid #999;background:#f4f4f4;">${row.flag_state}</span></td>
        <td style="padding:6px 8px;">${row.fishing_hours?.toFixed ? row.fishing_hours.toFixed(1) : row.fishing_hours}h</td>
        <td style="padding:6px 8px;">${row.vessel_count}</td>
        <td style="padding:6px 8px;">
          <span style="border-radius:6px;padding:2px 12px;font-weight:bold;${badgeColor}">${row.risk_level}</span>
        </td>
        <td style="padding:6px 8px;">${row.last_updated ? new Date(row.last_updated).toLocaleString() : ""}</td>
      </tr>`;
    }).join("\n");

    const htmlMessage = `
      <h2 style="margin-bottom:8px;">🚨 Real-Time Illegal Fishing Alert</h2>
      <p>Here are <b>all the current high-risk areas</b> detected right now:</p>
      <table border="1" style="border-collapse:collapse;margin-top:12px;">
        <thead>
          <tr>
            <th>#</th>
            <th>Coordinates</th>
            <th>Flag</th>
            <th>Fishing Hours</th>
            <th>Vessel Count</th>
            <th>Risk Level</th>
            <th>Last Updated</th>
          </tr>
        </thead>
        <tbody>
          ${riskRowsHtml}
        </tbody>
      </table>
      <p style="margin-top:1.5em;font-size:13px;color:#666;">Stay vigilant! For more details, view data directly in the FishGuard app.</p>
    `;

    // Send the email using Resend
    const resend = new Resend(RESEND_API_KEY);

    const emailResp = await resend.emails.send({
      from: "Illegal Fishing Alerts <onboarding@resend.dev>",
      to: [to_email],
      subject: "🚨 Real-Time High-Risk Illegal Fishing Areas",
      html: htmlMessage,
    });

    if (emailResp?.error) {
      return new Response(
        JSON.stringify({
          error: "Email sending failed.",
          details: emailResp.error
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({ message: `Alert sent to ${to_email} with latest fishing risk data`, email: emailResp }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    const errorMessage =
      error?.message ||
      (typeof error === "string" ? error : "An unknown error occurred in the edge function.");
    return new Response(
      JSON.stringify({
        error: errorMessage || "Unhandled edge function error (no message present)",
        details: error?.stack || error
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);

