// Replaces ALERT_EMAIL with a value accepted from the request payload.
// Accepts POST requests with: { to_email: string }
// Only sends an email if a valid email is provided.

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const FETCH_FUNCTION_URL = `${Deno.env.get("SUPABASE_URL")}/functions/v1/fetch-fishing-data`;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function getRiskColor(riskLevel: string) {
  switch (riskLevel) {
    case "Critical":
      return "red";
    case "High":
      return "orange";
    case "Medium":
      return "goldenrod";
    default:
      return "green";
  }
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  let to_email: string | undefined;

  // Accept POST with JSON body { to_email }
  if (req.method === "POST") {
    try {
      const json = await req.json();
      if (typeof json.to_email === "string" && json.to_email.includes("@")) {
        to_email = json.to_email.trim();
      }
    } catch (_err) {
      // Ignore parsing error, will handle below
    }
  }

  if (!to_email) {
    return new Response(JSON.stringify({ error: "Missing or invalid email address." }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    // Fetch illegal fishing data from the edge function
    const response = await fetch(FETCH_FUNCTION_URL, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch fishing data.");
    }

    const { data } = await response.json();

    if (!data?.high_risk_areas || !Array.isArray(data.high_risk_areas) || data.high_risk_areas.length === 0) {
      // No high risk areas found, do not send email
      console.log("No high risk areas to alert.");
      return new Response(JSON.stringify({ message: "No high risk areas. No alert sent." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Compose a summary of findings
    const regionListHTML = data.high_risk_areas.map((region: any) => `
      <tr>
        <td style="padding:6px 12px;">${region.flag_state}</td>
        <td style="padding:6px 12px;">${region.latitude.toFixed(2)}, ${region.longitude.toFixed(2)}</td>
        <td style="padding:6px 12px;"><b>${region.risk_level}</b></td>
        <td style="padding:6px 12px;">${region.fishing_hours.toFixed(1)}h</td>
        <td style="padding:6px 12px;">${region.vessel_count}</td>
        <td style="padding:6px 12px;">${new Date(region.last_updated).toLocaleString()}</td>
      </tr>
    `).join("");

    const htmlMessage = `
      <h2>🚨 Illegal Fishing Alert: High-Risk Areas Detected</h2>
      <p>Detected <b>${data.high_risk_areas.length}</b> high-risk region(s) for illegal fishing activity:</p>
      <table border="1" style="border-collapse:collapse;">
        <thead>
          <tr style="background:#f8d7da;">
            <th>Flag State</th>
            <th>Coordinates</th>
            <th>Risk Level</th>
            <th>Fishing Hours</th>
            <th>Vessel Count</th>
            <th>Last Updated</th>
          </tr>
        </thead>
        <tbody>
          ${regionListHTML}
        </tbody>
      </table>
      <p style="margin-top:1em;">This is an automated alert sent on request. (No scheduled alerts.)</p>
    `;

    // Send the email using Resend
    const emailResp = await resend.emails.send({
      from: "Illegal Fishing Alerts <onboarding@resend.dev>",
      to: [to_email],
      subject: "🚨 High-Risk Illegal Fishing Areas Detected",
      html: htmlMessage,
    });

    console.log("Alert email sent:", emailResp);

    return new Response(JSON.stringify({ message: "Alert sent.", email: emailResp }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    // Improved error reporting for frontend user and backend log clarity
    const errorMessage =
      error?.message ||
      (typeof error === "string" ? error : "An unknown error occurred in the edge function.");
    console.error("Error in send-illegal-fishing-alerts (frontend user will see this):", errorMessage);
    return new Response(
      JSON.stringify({
        error: errorMessage || "Unhandled edge function error (no message present)",
        details: error,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);
