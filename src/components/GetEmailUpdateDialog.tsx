
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface GetEmailUpdateDialogProps {
  open: boolean;
  onClose: () => void;
}

const GetEmailUpdateDialog: React.FC<GetEmailUpdateDialogProps> = ({ open, onClose }) => {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      toast.error("Please enter a valid email address.");
      return;
    }
    setSending(true);

    try {
      const supabaseUrl = "https://igxauoyjttwtyujsoxjt.supabase.co";
      const endpoint = `${supabaseUrl}/functions/v1/send-illegal-fishing-alerts`;
      const resp = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to_email: email })
      });
      const data = await resp.json();

      // Log all details for debug
      console.log("Email alert response:", { resp, data });

      if (resp.ok && data.message) {
        toast.success("Email notification sent!", { description: data.message });
        onClose();
      } else {
        // Show error AND details if present
        const details = data.details ? (
          typeof data.details === "string"
            ? data.details
            : typeof data.details === "object"
              ? JSON.stringify(data.details)
              : ""
        ) : "";
        toast.error(data.error || "Failed to send email alert", {
          description: (details && details !== data.error) ? details : (data.error || resp.statusText || "Unknown error.")
        });
      }
    } catch (err: any) {
      toast.error("Error sending email", { description: err.message || String(err) });
    }
    setSending(false);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Get Email Update</DialogTitle>
          <DialogDescription>
            Enter your email to receive the latest high-risk illegal fishing alert.
          </DialogDescription>
        </DialogHeader>
        <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
          <Input
            type="email"
            required
            autoFocus
            placeholder="your@email.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            disabled={sending}
          />
          <Button type="submit" className="w-full" disabled={sending}>
            {sending ? "Sending..." : "Send Alert"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default GetEmailUpdateDialog;

