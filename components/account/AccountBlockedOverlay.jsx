"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Ban, MessageSquare, Send, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase/client";

export default function AccountBlockedOverlay({ userId }) {
  const [showTicketForm, setShowTicketForm] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [authenticatedUserId, setAuthenticatedUserId] = useState(null);

  // Get the authenticated user's ID from the session
  useEffect(() => {
    const getAuthenticatedUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        setAuthenticatedUserId(session.user.id);
      }
    };
    getAuthenticatedUser();
  }, []);

  const handleSubmitTicket = async (e) => {
    e.preventDefault();
    
    if (!subject.trim() || !message.trim()) {
      toast.error("Please fill in both subject and message");
      return;
    }

    // Use authenticated user ID from session (this matches auth.uid())
    const currentUserId = authenticatedUserId || userId;
    
    if (!currentUserId) {
      toast.error("User ID is missing. Please refresh the page and try again.");
      console.error("User ID is missing. authenticatedUserId:", authenticatedUserId, "userId prop:", userId);
      return;
    }

    setSubmitting(true);
    try {
      // Verify we have a valid session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error("Session error:", sessionError);
        throw new Error(`Session error: ${sessionError.message}`);
      }
      
      if (!session) {
        console.error("No session found");
        throw new Error("You must be logged in to submit a ticket. Please refresh the page and try again.");
      }

      if (!session.user || !session.user.id) {
        console.error("Session user missing:", { session });
        throw new Error("Invalid session. Please refresh the page and try again.");
      }

      // Verify access token exists (needed for RLS)
      if (!session.access_token) {
        console.error("No access token in session:", { session });
        throw new Error("Session token missing. Please refresh the page and try again.");
      }

      // Ensure the user_id matches the authenticated user
      const ticketData = {
        user_id: session.user.id, // Use the authenticated user's ID from session
        subject: subject.trim(),
        message: message.trim(),
        status: "open",
      };

      console.log("Submitting ticket with data:", {
        user_id: ticketData.user_id,
        session_user_id: session.user.id,
        has_access_token: !!session.access_token,
        token_preview: session.access_token ? `${session.access_token.substring(0, 20)}...` : 'MISSING',
        auth_uid_match: "Should match auth.uid() in RLS policy"
      });

      const { data, error } = await supabase
        .from("tickets")
        .insert(ticketData)
        .select()
        .single();

      if (error) {
        // Extract all possible error properties
        const errorMessage = error.message || '';
        const errorCode = error.code || '';
        const errorDetails = error.details || '';
        const errorHint = error.hint || '';
        
        // Try to get error as string
        let errorString = '';
        try {
          errorString = JSON.stringify(error, null, 2);
        } catch (e) {
          errorString = String(error);
        }
        
        // Log detailed error information
        const errorInfo = {
          message: errorMessage,
          code: errorCode,
          details: errorDetails,
          hint: errorHint,
          status: error.status,
          statusText: error.statusText,
          user_id_used: ticketData.user_id,
          session_user_id: session.user.id,
          error_string: errorString,
          error_type: typeof error,
          error_keys: Object.keys(error || {}),
          error_prototype: Object.getPrototypeOf(error)?.constructor?.name
        };
        
        console.error("=== TICKET SUBMISSION ERROR ===");
        console.error("Error Info:", errorInfo);
        console.error("Raw Error Object:", error);
        console.error("Error toString:", error.toString());
        console.error("Error message:", error.message);
        console.error("Error code:", error.code);
        console.error("Error details:", error.details);
        console.error("Error hint:", error.hint);
        console.error("================================");
        
        // Provide user-friendly error messages based on error code
        if (errorCode === 'PGRST116' || errorMessage?.includes('relation') || errorMessage?.includes('does not exist')) {
          toast.error("Tickets system is not set up yet. Please contact support directly.");
        } else if (errorCode === '42501' || errorMessage?.includes('permission denied') || errorMessage?.includes('policy') || errorMessage?.includes('new row violates row-level security') || errorMessage?.includes('table users')) {
          // More detailed error for permission issues
          console.error("RLS Policy Error - Possible causes:");
          console.error("1. Admin policies querying auth.users (run fix-tickets-admin-policies.sql)");
          console.error("2. RLS policy blocking the insert");
          console.error("3. user_id doesn't match auth.uid()");
          console.error("4. Policy might not exist or be misconfigured");
          console.error("User ID being used:", ticketData.user_id);
          console.error("Session user ID:", session.user.id);
          
          const userMessage = errorHint || errorMessage || errorDetails || 'Permission denied. Please ensure you are logged in and try again.';
          toast.error(`Permission denied: ${userMessage}`);
        } else {
          const displayMessage = errorMessage || errorHint || errorDetails || 'Unknown error occurred';
          toast.error(`Failed to send message: ${displayMessage}`);
        }
        return;
      }

      toast.success("Your message has been sent. We'll review it and get back to you soon.");
      setSubject("");
      setMessage("");
      setShowTicketForm(false);
    } catch (error) {
      // Catch any unexpected errors
      console.error("Unexpected error submitting ticket:", {
        message: error?.message,
        stack: error?.stack,
        error: error
      });
      toast.error(`Failed to send message: ${error?.message || 'Please try again'}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white shadow-2xl">
        <CardHeader className="border-b bg-red-50">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
              <Ban className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <CardTitle className="text-xl text-red-900">Account Blocked</CardTitle>
              <p className="text-sm text-red-700 mt-1">Your account access has been restricted</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {!showTicketForm ? (
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800">
                  Your account has been temporarily blocked by our security team. 
                  This may be due to security concerns or policy violations.
                </p>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  If you believe this is an error or would like to appeal this decision, 
                  please contact our support team.
                </p>
              </div>

              <Button
                onClick={() => setShowTicketForm(true)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Contact Support
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmitTicket} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Subject <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g., Account Block Appeal"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Please explain your situation and why you believe your account should be unblocked..."
                  rows={5}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  required
                />
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowTicketForm(false);
                    setSubject("");
                    setMessage("");
                  }}
                  className="flex-1"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {submitting ? "Sending..." : "Send Message"}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

