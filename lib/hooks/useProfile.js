import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Hook to fetch and manage user profile data from the profiles table
 */
export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch profile from profiles table
        const { data, error: fetchError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (fetchError) {
          // If profile doesn't exist, try to create it from user_metadata
          if (fetchError.code === 'PGRST116') {
            console.log("Profile not found, creating from metadata...");
            
            // Try to create profile from user_metadata
            const profileData = {
              id: user.id,
              full_name: user.user_metadata?.full_name || null,
              phone: user.user_metadata?.phone || null,
              date_of_birth: user.user_metadata?.date_of_birth || null,
              address: user.user_metadata?.address || null,
              city: user.user_metadata?.city || null,
              state: user.user_metadata?.state || null,
              zip_code: user.user_metadata?.zip_code || null,
              country: user.user_metadata?.country || null,
              security_pin: user.user_metadata?.security_pin || null,
              id_document_url: user.user_metadata?.id_document_url || null,
              proof_of_address_url: user.user_metadata?.proof_of_address_url || null,
              account_number: user.user_metadata?.account_number || null,
              routing_number: user.user_metadata?.routing_number || null,
              account_type: user.user_metadata?.account_type || null,
              currency: user.user_metadata?.currency || 'USD',
              profile_image_url: user.user_metadata?.profile_image_url || null,
              document_type: user.user_metadata?.document_type || null,
              id_document_front_url: user.user_metadata?.id_document_front_url || null,
              id_document_back_url: user.user_metadata?.id_document_back_url || null,
            };

            const { data: newProfile, error: createError } = await supabase
              .from("profiles")
              .insert(profileData)
              .select()
              .single();

            if (createError) {
              // Extract error details safely
              const errorCode = createError.code || createError.statusCode;
              const errorMessage = createError.message || String(createError);
              const errorDetails = createError.details || null;
              const errorHint = createError.hint || null;
              
              // Handle RLS policy errors gracefully
              if (
                errorCode === '42501' ||
                errorCode === 'PGRST301' ||
                errorMessage?.includes('policy') ||
                errorMessage?.includes('permission') ||
                errorMessage?.includes('RLS')
              ) {
                console.warn("Profile creation blocked by RLS policy. Using metadata fallback:", {
                  code: errorCode,
                  message: errorMessage,
                  hint: errorHint
                });
              } else {
                // Log other errors with full details
                console.warn("Error creating profile:", {
                  code: errorCode,
                  message: errorMessage,
                  details: errorDetails,
                  hint: errorHint,
                  profileDataKeys: Object.keys(profileData)
                });
              }
              
              // Always fallback to user_metadata - this is expected behavior
              setProfile({
                ...profileData,
                from_metadata: true
              });
              // Don't set error state for RLS issues - it's expected
              if (!errorMessage?.includes('policy') && !errorMessage?.includes('permission')) {
                setError(errorMessage || "Profile will be created by database trigger");
              }
            } else {
              setProfile(newProfile);
            }
          } else {
            // Extract error details safely
            const errorCode = fetchError.code || fetchError.statusCode;
            const errorMessage = fetchError.message || String(fetchError);
            
            // Log error with structured details
            console.warn("Error fetching profile:", {
              code: errorCode,
              message: errorMessage,
              details: fetchError.details,
              hint: fetchError.hint
            });
            
            setError(errorMessage);
            // Fallback to user_metadata
            setProfile({
              id: user.id,
              full_name: user.user_metadata?.full_name || null,
              phone: user.user_metadata?.phone || null,
              date_of_birth: user.user_metadata?.date_of_birth || null,
              address: user.user_metadata?.address || null,
              city: user.user_metadata?.city || null,
              state: user.user_metadata?.state || null,
              zip_code: user.user_metadata?.zip_code || null,
              country: user.user_metadata?.country || null,
              security_pin: user.user_metadata?.security_pin || null,
              id_document_url: user.user_metadata?.id_document_url || null,
              proof_of_address_url: user.user_metadata?.proof_of_address_url || null,
              account_number: user.user_metadata?.account_number || null,
              routing_number: user.user_metadata?.routing_number || null,
              account_type: user.user_metadata?.account_type || null,
              currency: user.user_metadata?.currency || 'USD',
              profile_image_url: user.user_metadata?.profile_image_url || null,
              document_type: user.user_metadata?.document_type || null,
              id_document_front_url: user.user_metadata?.id_document_front_url || null,
              id_document_back_url: user.user_metadata?.id_document_back_url || null,
              from_metadata: true
            });
          }
        } else {
          setProfile(data);
        }
      } catch (err) {
        // Log unexpected errors with full details
        console.warn("Profile fetch exception:", {
          message: err?.message || String(err),
          name: err?.name,
          stack: err?.stack
        });
        setError(err?.message || "Failed to fetch profile");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const refetch = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (fetchError) {
        const errorCode = fetchError.code || fetchError.statusCode;
        const errorMessage = fetchError.message || String(fetchError);
        console.warn("Profile refetch error:", {
          code: errorCode,
          message: errorMessage,
          details: fetchError.details,
          hint: fetchError.hint
        });
        setError(errorMessage);
      } else {
        setProfile(data);
      }
    } catch (err) {
      console.warn("Profile refetch exception:", {
        message: err?.message || String(err),
        name: err?.name,
        stack: err?.stack
      });
      setError(err?.message || "Failed to refetch profile");
    } finally {
      setLoading(false);
    }
  };

  return { profile, loading, error, refetch };
}

