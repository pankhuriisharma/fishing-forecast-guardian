
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

    // Use the top entry from high_risk_areas (first one in the array)
    const topRisk =
      data?.high_risk_areas && Array.isArray(data.high_risk_areas) && data.high_risk_areas.length > 0
        ? data.high_risk_areas[0]
        : null;

    if (!topRisk) {
      return new Response(JSON.stringify({ message: "No high risk areas found. No email sent." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Compose the email with the top entry details
    const htmlMessage = `
      <h2>🚨 Real-Time Illegal Fishing Alert</h2>
      <p>Here is the latest high-risk area detected right now:</p>
      <table border="1" style="border-collapse:collapse;">
        <thead>
          <tr>
            <th>Flag State</th>
            <th>Coordinates</th>
            <th>Risk Level</th>
            <th>Fishing Hours</th>
            <th>Vessel Count</th>
            <th>Last Updated</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding:6px 12px;">${topRisk.flag_state}</td>
            <td style="padding:6px 12px;">${topRisk.latitude.toFixed(2)}, ${topRisk.longitude.toFixed(2)}</td>
            <td style="padding:6px 12px;"><b>${topRisk.risk_level}</b></td>
            <td style="padding:6px 12px;">${topRisk.fishing_hours.toFixed(1)}h</td>
            <td style="padding:6px 12px;">${topRisk.vessel_count}</td>
            <td style="padding:6px 12px;">${new Date(topRisk.last_updated).toLocaleString()}</td>
          </tr>
        </tbody>
      </table>
      <p style="margin-top:1em;">Stay vigilant! For more details, view in the app.</p>
    `;

    // Send the email using Resend
    const emailResp = await resend.emails.send({
      from: "Illegal Fishing Alerts <onboarding@resend.dev>",
      to: [to_email],
      subject: "🚨 Real-Time High-Risk Illegal Fishing Area",
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

    return new Response(JSON.stringify({ message: `Alert sent to ${to_email} with latest fishing data`, email: emailResp }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

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
