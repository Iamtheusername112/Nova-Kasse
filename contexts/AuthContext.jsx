"use client";

import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";
import {
  storeSessionTimestamp,
  getSessionTimestamp,
  isSessionExpired,
  clearSessionStorage,
  clearCookies,
} from "@/lib/utils/session";
import { uploadFile } from "@/lib/utils/upload";

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const userRef = useRef(user);
  const signOutRef = useRef(null);

  // Sign out function - memoized to prevent infinite loops
  const signOut = useCallback(async (options = {}) => {
    try {
      setLoading(true);
      
      // Sign out from all devices if requested
      if (options.signOutFromAllDevices) {
        // Get all user sessions and revoke them
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (currentUser) {
          // Note: Supabase doesn't have a direct "sign out all devices" API
          // This would require backend implementation
          // For now, we'll just sign out the current session
          console.log("Signing out from all devices...");
        }
      }

      // Sign out from current session
      const { error } = await supabase.auth.signOut();

      if (error) throw error;

      // Clear all local storage and cookies
      clearSessionStorage();
      clearCookies();

      // Reset state
      setUser(null);
      setSession(null);

      toast.success("Signed out successfully");
      
      // Redirect to login page
      router.push("/login");
      
      // Force a hard reload to clear any cached data
      if (typeof window !== 'undefined') {
        window.location.href = "/login";
      }

      return { success: true };
    } catch (error) {
      console.error("Sign out error:", error);
      toast.error(error.message || "Failed to sign out");
      
      // Even if there's an error, try to clear local state
      clearSessionStorage();
      clearCookies();
      setUser(null);
      setSession(null);
      
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, [router]);

  // Keep refs updated
  useEffect(() => {
    userRef.current = user;
    signOutRef.current = signOut;
  }, [user, signOut]);

  // Check session validity - simplified to avoid calling signOut during initialization
  const checkSessionValidity = useCallback(async (skipExpirationCheck = false) => {
    try {
      const { data: { session: currentSession }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error("Session check error:", error);
        return false;
      }

      if (!currentSession) {
        return false;
      }

      // Skip expiration check during initialization (right after login)
      if (!skipExpirationCheck) {
        // Check if session is expired based on our custom timestamp
        const sessionTimestamp = getSessionTimestamp();
        if (sessionTimestamp && isSessionExpired(sessionTimestamp)) {
          // Session expired, but don't sign out here to avoid loops
          // Let the interval handle it
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error("Session validation error:", error);
      return false;
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    let refreshInterval = null;

    // Check active sessions and sets the user
    const initializeAuth = async () => {
      try {
        // Skip expiration check during initialization to avoid issues right after login
        const isValid = await checkSessionValidity(true);
        
        if (!mounted) return;

        if (isValid) {
          const { data: { session: currentSession } } = await supabase.auth.getSession();
          if (mounted) {
            setSession(currentSession);
            setUser(currentSession?.user ?? null);
            storeSessionTimestamp();
          }
        } else {
          if (mounted) {
            setUser(null);
            setSession(null);
          }
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        if (mounted) {
          setUser(null);
          setSession(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen for changes on auth state
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      if (!mounted) return;

      console.log("Auth state changed:", event);
      
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        storeSessionTimestamp();
        setLoading(false);
      } else if (event === "SIGNED_OUT") {
        setUser(null);
        setSession(null);
        clearSessionStorage();
        setLoading(false);
      } else if (event === "USER_UPDATED") {
        setUser(currentSession?.user ?? null);
        setLoading(false);
      } else {
        setLoading(false);
      }
    });

    // Set up session refresh interval (check every 5 minutes)
    // Only start interval after initial load
    setTimeout(() => {
      if (mounted) {
        refreshInterval = setInterval(async () => {
          if (!mounted) return;
          
          // Use ref to get current user value
          const currentUser = userRef.current;
          if (currentUser && signOutRef.current) {
            const isValid = await checkSessionValidity(false);
            if (!isValid && currentUser) {
              // Session expired, sign out
              console.log("Session expired, signing out...");
              await signOutRef.current();
            }
          }
        }, 5 * 60 * 1000); // 5 minutes
      }
    }, 1000); // Wait 1 second before starting interval

    return () => {
      mounted = false;
      subscription.unsubscribe();
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, []); // Empty dependency array - only run on mount

  const signUp = async (email, password, userData = {}) => {
    try {
      // Prepare metadata object with all user data
      // Ensure all values are properly formatted and saved
      const cleanValue = (val) => {
        if (val === undefined || val === null) return "";
        const str = String(val).trim();
        return str === "" ? "" : str;
      };

      // Build metadata object - include ALL fields even if empty
      // Supabase will store all fields in user_metadata
      const userMetadata = {
        full_name: cleanValue(userData.fullName),
        phone: cleanValue(userData.phone),
        date_of_birth: cleanValue(userData.dateOfBirth),
        address: cleanValue(userData.address),
        city: cleanValue(userData.city),
        state: cleanValue(userData.state),
        zip_code: cleanValue(userData.zipCode),
        country: cleanValue(userData.country) || "United States",
        security_pin: cleanValue(userData.securityPin),
        document_type: cleanValue(userData.documentType),
        id_document_url: "", // Will be set after upload
        id_document_front_url: "", // Will be set after upload (for card types)
        id_document_back_url: "", // Will be set after upload (for card types)
        proof_of_address_url: "", // Will be set after upload
      };

      // Build final metadata - ensure ALL fields are included
      // Supabase user_metadata can store strings, but we'll use null for empty values
      // The key is to ensure all fields are present in the object
      const finalMetadata = {
        full_name: userMetadata.full_name || null,
        phone: userMetadata.phone || null,
        date_of_birth: userMetadata.date_of_birth || null,
        address: userMetadata.address || null,
        city: userMetadata.city || null,
        state: userMetadata.state || null,
        zip_code: userMetadata.zip_code || null,
        country: userMetadata.country || "United States",
        security_pin: userMetadata.security_pin || null,
        document_type: userMetadata.document_type || null,
        id_document_url: userMetadata.id_document_url || null,
        id_document_front_url: userMetadata.id_document_front_url || null,
        id_document_back_url: userMetadata.id_document_back_url || null,
        proof_of_address_url: userMetadata.proof_of_address_url || null,
      };

      // Log what we're sending
      console.log("=== AUTH CONTEXT SIGNUP ===");
      console.log("Email:", email);
      console.log("Original userData received:", userData);
      console.log("Processed userMetadata:", userMetadata);
      console.log("Final metadata to send:", finalMetadata);
      console.log("Metadata keys:", Object.keys(finalMetadata));
      console.log("Metadata values:", Object.values(finalMetadata));
      console.log("All fields present:", {
        full_name: !!finalMetadata.full_name,
        phone: !!finalMetadata.phone,
        date_of_birth: !!finalMetadata.date_of_birth,
        address: !!finalMetadata.address,
        city: !!finalMetadata.city,
        state: !!finalMetadata.state,
        zip_code: !!finalMetadata.zip_code,
        country: !!finalMetadata.country,
        security_pin: !!finalMetadata.security_pin,
      });

      // Step 1: Create the auth user
      // Send all metadata - Supabase will store what it receives
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: undefined,
          data: finalMetadata, // Use finalMetadata instead of userMetadata
        },
      });

      if (authError) {
        console.error("Auth signup error:", authError);
        throw authError;
      }

      if (!authData.user) {
        console.error("No user returned from signup");
        return { success: false, error: "Failed to create account" };
      }

      // Log what was actually saved in metadata
      console.log("User created. Metadata saved:", authData.user.user_metadata);
      console.log("Raw metadata:", authData.user.raw_user_meta_data);

      // Step 2: Ensure we have a session for storage uploads
      // If signup didn't create a session (email confirmation required), we need to sign in
      let currentSession = authData.session;
      
      if (!currentSession && authData.user) {
        console.log("⚠ No session after signup - email confirmation may be required");
        console.log("Attempting to sign in immediately after signup...");
        
        // Try to sign in to get a session
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (signInError) {
          console.error("✗ Could not sign in after signup:", signInError);
          console.error("Error details:", {
            message: signInError.message,
            status: signInError.status,
          });
          
          // Check if it's an email confirmation error
          if (signInError.message?.includes('email') && signInError.message?.includes('confirm')) {
            console.warn("⚠ Email confirmation is required. Documents will need to be uploaded after email verification.");
            toast.warning("Please verify your email, then sign in to complete document upload.");
          } else {
            console.warn("⚠ Sign-in failed for unknown reason. Documents will be uploaded after first login.");
          }
          // Continue without session - documents will be uploaded after first login
        } else if (signInData.session) {
          currentSession = signInData.session;
          console.log("✓ Session established for document upload");
          // Update user state with the new session
          setSession(signInData.session);
          setUser(signInData.user);
        }
      } else if (currentSession) {
        console.log("✓ Session available immediately after signup");
      }

      // Step 3: Upload documents if provided and we have a session
      let idDocumentUrl = null;
      let idDocumentFrontUrl = null;
      let idDocumentBackUrl = null;
      let proofOfAddressUrl = null;
      const isCardType = ['driver_license', 'national_id', 'state_id'].includes(userData.documentType);

      console.log("=== DOCUMENT UPLOAD CHECK ===");
      console.log("Document type:", userData.documentType);
      console.log("Is card type:", isCardType);
      console.log("Has session:", !!currentSession);
      console.log("Files received:", {
        idDocument: !!userData.idDocument,
        idDocumentFront: !!userData.idDocumentFront,
        idDocumentBack: !!userData.idDocumentBack,
        proofOfAddress: !!userData.proofOfAddress,
      });
      console.log("File details:", {
        idDocument: userData.idDocument ? { name: userData.idDocument.name, size: userData.idDocument.size, type: userData.idDocument.type } : null,
        idDocumentFront: userData.idDocumentFront ? { name: userData.idDocumentFront.name, size: userData.idDocumentFront.size, type: userData.idDocumentFront.type } : null,
        idDocumentBack: userData.idDocumentBack ? { name: userData.idDocumentBack.name, size: userData.idDocumentBack.size, type: userData.idDocumentBack.type } : null,
        proofOfAddress: userData.proofOfAddress ? { name: userData.proofOfAddress.name, size: userData.proofOfAddress.size, type: userData.proofOfAddress.type } : null,
      });

      if ((userData.idDocument || userData.idDocumentFront || userData.idDocumentBack || userData.proofOfAddress) && currentSession) {
        try {
          const userId = authData.user.id;
          const timestamp = Date.now();

          console.log("=== STARTING DOCUMENT UPLOAD ===");
          console.log("Uploading documents with session:", {
            userId,
            hasSession: !!currentSession,
            authUid: currentSession?.user?.id,
            documentType: userData.documentType,
            isCardType
          });

          // Handle card-type documents (front and back)
          if (isCardType) {
            console.log("Processing card-type document upload...");
            
            // Upload front side
            if (userData.idDocumentFront) {
              console.log("Front file exists, preparing upload...");
              const frontFileName = `id-front-${timestamp}-${userData.idDocumentFront.name}`;
              const frontPath = `${userId}/${frontFileName}`;
              console.log("Uploading ID document front:", {
                fileName: userData.idDocumentFront.name,
                fileSize: userData.idDocumentFront.size,
                fileType: userData.idDocumentFront.type,
                path: frontPath
              });
              
              const frontUploadResult = await uploadFile(userData.idDocumentFront, "user-documents", frontPath);
              
              console.log("Front upload result:", frontUploadResult);
              
              if (frontUploadResult.success) {
                idDocumentFrontUrl = frontUploadResult.path;
                console.log("✓ ID document front uploaded successfully:", idDocumentFrontUrl);
              } else {
                console.error("✗ Failed to upload ID document front:", frontUploadResult.error);
                toast.error(`Failed to upload document front: ${frontUploadResult.error}`);
              }
            } else {
              console.warn("⚠ No front document file provided");
            }

            // Upload back side
            if (userData.idDocumentBack) {
              console.log("Back file exists, preparing upload...");
              const backFileName = `id-back-${timestamp}-${userData.idDocumentBack.name}`;
              const backPath = `${userId}/${backFileName}`;
              console.log("Uploading ID document back:", {
                fileName: userData.idDocumentBack.name,
                fileSize: userData.idDocumentBack.size,
                fileType: userData.idDocumentBack.type,
                path: backPath
              });
              
              const backUploadResult = await uploadFile(userData.idDocumentBack, "user-documents", backPath);
              
              console.log("Back upload result:", backUploadResult);
              
              if (backUploadResult.success) {
                idDocumentBackUrl = backUploadResult.path;
                console.log("✓ ID document back uploaded successfully:", idDocumentBackUrl);
              } else {
                console.error("✗ Failed to upload ID document back:", backUploadResult.error);
                toast.error(`Failed to upload document back: ${backUploadResult.error}`);
              }
            } else {
              console.warn("⚠ No back document file provided");
            }

            // For card types, combine front and back paths (comma-separated) or use front as primary
            if (idDocumentFrontUrl && idDocumentBackUrl) {
              idDocumentUrl = `${idDocumentFrontUrl},${idDocumentBackUrl}`;
              console.log("✓ Both sides uploaded, combined URL:", idDocumentUrl);
            } else if (idDocumentFrontUrl) {
              idDocumentUrl = idDocumentFrontUrl;
              console.log("⚠ Only front uploaded, using front URL:", idDocumentUrl);
            } else {
              console.error("✗ No documents uploaded successfully");
            }
          } else {
            // Handle single document uploads (passport, proof of address)
            // Upload ID document (passport)
            if (userData.idDocument) {
              const idFileName = `id-${timestamp}-${userData.idDocument.name}`;
              const idPath = `${userId}/${idFileName}`;
              console.log("Uploading ID document to path:", idPath);
              
              const idUploadResult = await uploadFile(userData.idDocument, "user-documents", idPath);
              
              if (idUploadResult.success) {
                idDocumentUrl = idUploadResult.path;
                console.log("✓ ID document uploaded:", idDocumentUrl);
              } else {
                console.warn("Failed to upload ID document:", idUploadResult.error);
                toast.error("Failed to upload ID document. Please try again.");
              }
            }

            // Upload proof of address
            if (userData.proofOfAddress) {
              const addressFileName = `address-${timestamp}-${userData.proofOfAddress.name}`;
              const addressPath = `${userId}/${addressFileName}`;
              console.log("Uploading proof of address to path:", addressPath);
              
              const addressUploadResult = await uploadFile(userData.proofOfAddress, "user-documents", addressPath);
              
              if (addressUploadResult.success) {
                proofOfAddressUrl = addressUploadResult.path;
                console.log("✓ Proof of address uploaded:", proofOfAddressUrl);
              } else {
                console.warn("Failed to upload proof of address:", addressUploadResult.error);
                toast.error("Failed to upload proof of address. Please try again.");
              }
            }
          }
          
          console.log("=== UPLOAD SUMMARY ===");
          console.log("Final URLs:", {
            idDocumentUrl,
            idDocumentFrontUrl,
            idDocumentBackUrl,
            proofOfAddressUrl
          });
        } catch (uploadError) {
          console.error("✗ Document upload exception:", uploadError);
          console.error("Error details:", {
            message: uploadError.message,
            stack: uploadError.stack,
            name: uploadError.name
          });
          toast.error(`Error uploading documents: ${uploadError.message || "Please contact support."}`);
        }
      } else {
        if (userData.idDocument || userData.idDocumentFront || userData.idDocumentBack || userData.proofOfAddress) {
          console.warn("⚠ Cannot upload documents - no active session");
          console.warn("Files provided but no session:", {
            hasFiles: true,
            hasSession: !!currentSession,
            sessionDetails: currentSession ? "Session exists" : "No session"
          });
          toast.warning("Documents will be uploaded after you sign in for the first time.");
        } else {
          console.log("No documents provided for upload");
        }
      }

      // Step 3: Wait for the database trigger to create the profile
      // The trigger should automatically create the profile from user_metadata
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Update metadata with document URLs if uploaded
      if (idDocumentUrl || idDocumentFrontUrl || idDocumentBackUrl || proofOfAddressUrl) {
        const updatedMetadata = {
          ...authData.user.user_metadata,
          ...finalMetadata, // Include all original KYC data
          id_document_url: idDocumentUrl || finalMetadata.id_document_url || null,
          id_document_front_url: idDocumentFrontUrl || finalMetadata.id_document_front_url || null,
          id_document_back_url: idDocumentBackUrl || finalMetadata.id_document_back_url || null,
          proof_of_address_url: proofOfAddressUrl || finalMetadata.proof_of_address_url || null,
        };
        
        console.log("Updating user metadata with document URLs:", {
          id_document_url: idDocumentUrl,
          id_document_front_url: idDocumentFrontUrl,
          id_document_back_url: idDocumentBackUrl,
          proof_of_address_url: proofOfAddressUrl,
          fullMetadata: updatedMetadata
        });
        
        const { error: updateError } = await supabase.auth.updateUser({
          data: updatedMetadata
        });
        if (updateError) {
          console.warn("Failed to update user metadata with document URLs:", updateError);
        } else {
          console.log("✓ User metadata updated with document URLs");
        }
      }

      // Step 4: Force profile creation/update with all KYC data
      // Use the session we established to insert/update profile directly
      // This ensures all data is saved even if trigger has issues
      if (currentSession) {
        try {
          // Wait a moment for trigger to run first
          await new Promise(resolve => setTimeout(resolve, 1500));

          // Prepare complete profile data with ALL KYC fields
          const profileData = {
            id: authData.user.id,
            full_name: userData.fullName || null,
            phone: userData.phone || null,
            date_of_birth: userData.dateOfBirth || null,
            address: userData.address || null,
            city: userData.city || null,
            state: userData.state || null,
            zip_code: userData.zipCode || null,
            country: userData.country || "United States",
            security_pin: userData.securityPin || null,
            document_type: userData.documentType || null,
            id_document_url: idDocumentUrl || null,
            id_document_front_url: idDocumentFrontUrl || null,
            id_document_back_url: idDocumentBackUrl || null,
            proof_of_address_url: proofOfAddressUrl || null,
          };

          console.log("=== FORCING PROFILE SAVE ===");
          console.log("Profile data to save:", profileData);
          console.log("Has session:", !!currentSession);
          console.log("User ID:", authData.user.id);

          // Try to upsert profile with authenticated session
          const { data: profileDataResult, error: profileError } = await supabase
            .from("profiles")
            .upsert(profileData, {
              onConflict: 'id',
            })
            .select();

          if (profileError) {
            const errorCode = profileError.code || profileError.statusCode || 'UNKNOWN';
            const errorMessage = profileError.message || JSON.stringify(profileError) || 'Unknown error';
            
            console.error("Profile save error:", {
              code: errorCode,
              message: errorMessage,
              details: profileError.details,
              hint: profileError.hint,
            });
            
            // If RLS is blocking, log it but continue
            if (errorCode === '42501' || 
                errorCode === 'PGRST301' ||
                errorMessage?.includes('policy') || 
                errorMessage?.includes('permission') ||
                errorMessage?.includes('RLS')) {
              console.warn("⚠ RLS blocking profile insert - trigger should handle it");
              console.warn("  → Check that profiles table policies allow INSERT");
              console.warn("  → Data is in user_metadata, trigger should copy it");
            } else {
              console.error("⚠ Profile save failed:", errorMessage);
            }
          } else {
            console.log("✓ Profile saved/updated successfully with all KYC data:", profileDataResult);
            
            // Verify all fields were saved
            const savedProfile = profileDataResult[0];
            console.log("✓ Saved profile fields:", {
              full_name: !!savedProfile.full_name,
              phone: !!savedProfile.phone,
              date_of_birth: !!savedProfile.date_of_birth,
              address: !!savedProfile.address,
              city: !!savedProfile.city,
              state: !!savedProfile.state,
              zip_code: !!savedProfile.zip_code,
              country: !!savedProfile.country,
              security_pin: !!savedProfile.security_pin,
              document_type: savedProfile.document_type,
              id_document_url: savedProfile.id_document_url,
              id_document_front_url: savedProfile.id_document_front_url,
              id_document_back_url: savedProfile.id_document_back_url,
              proof_of_address_url: savedProfile.proof_of_address_url,
            });
          }
        } catch (profileErr) {
          console.error("Profile operation exception:", {
            message: profileErr?.message || 'Unknown error',
            name: profileErr?.name,
            stack: profileErr?.stack,
          });
        }
      } else {
        console.warn("⚠ No session available - profile will be created by trigger");
        console.warn("  → All KYC data is in user_metadata");
        console.warn("  → Trigger should copy it to profiles table");
      }

      // Step 5: Verify data was saved by fetching it back
      const { data: { user: verifyUser }, error: verifyError } = await supabase.auth.getUser();
      if (!verifyError && verifyUser) {
        console.log("Verified user metadata:", verifyUser.user_metadata);
        console.log("Verified raw metadata:", verifyUser.raw_user_meta_data);
      }

      toast.success("Account created successfully! You can now sign in.");
      return { success: true, data: authData };
    } catch (error) {
      console.error("Signup error:", error);
      console.error("Error stack:", error.stack);
      toast.error(error.message || "Failed to create account");
      return { success: false, error: error.message };
    }
  };

  const signIn = async (email, password) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user && data.session) {
        setSession(data.session);
        setUser(data.user);
        storeSessionTimestamp();
        toast.success("Welcome back!");
        router.push("/");
        return { success: true, data };
      }

      return { success: false, error: "Failed to sign in" };
    } catch (error) {
      toast.error(error.message || "Failed to sign in");
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Get all active sessions (requires backend implementation)
  const getActiveSessions = async () => {
    try {
      // This would typically require a backend API endpoint
      // For now, return current session info
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      
      if (!currentSession) {
        return [];
      }

      return [{
        id: currentSession.access_token.substring(0, 20) + "...",
        device: typeof navigator !== 'undefined' ? navigator.userAgent : "Unknown",
        location: "Current device",
        lastActive: new Date(currentSession.expires_at * 1000).toISOString(),
        current: true,
      }];
    } catch (error) {
      console.error("Error getting active sessions:", error);
      return [];
    }
  };

  // Revoke a specific session (requires backend implementation)
  const revokeSession = async (sessionId) => {
    try {
      // This would require backend API implementation
      // For now, if it's the current session, sign out
      toast.info("Session revocation requires backend implementation");
      return { success: false, error: "Not implemented" };
    } catch (error) {
      console.error("Error revoking session:", error);
      return { success: false, error: error.message };
    }
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    getActiveSessions,
    revokeSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

