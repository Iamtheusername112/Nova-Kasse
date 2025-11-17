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
            };

            const { data: newProfile, error: createError } = await supabase
              .from("profiles")
              .insert(profileData)
              .select()
              .single();

            if (createError) {
              console.error("Error creating profile:", createError);
              setError(createError.message);
              // Fallback to user_metadata
              setProfile({
                ...profileData,
                from_metadata: true
              });
            } else {
              setProfile(newProfile);
            }
          } else {
            console.error("Error fetching profile:", fetchError);
            setError(fetchError.message);
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
              from_metadata: true
            });
          }
        } else {
          setProfile(data);
        }
      } catch (err) {
        console.error("Profile fetch exception:", err);
        setError(err.message);
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
        setError(fetchError.message);
      } else {
        setProfile(data);
      }
    } catch (err) {
      console.error("Profile refetch exception:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { profile, loading, error, refetch };
}

