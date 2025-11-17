"use client";

import { useState, useEffect } from "react";
import Header from "@/components/layout/Header";
import BottomNavigation from "@/components/layout/BottomNavigation";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { Settings, Shield, Bell, Check, LogOut, User, Phone, MapPin, Calendar, FileText, Image as ImageIcon, Download, Eye, CreditCard, Copy, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/lib/hooks/useProfile";
import { getSignedUrl } from "@/lib/utils/storage";
import { toast } from "sonner";

function ProfilePageContent() {
  const { user, signOut } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const [documentUrls, setDocumentUrls] = useState({
    idDocument: null,
    idDocumentFront: null,
    idDocumentBack: null,
    proofOfAddress: null
  });
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [copiedField, setCopiedField] = useState(null);
  
  const copyToClipboard = async (text, fieldName) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      toast.success(`${fieldName} copied to clipboard`);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      toast.error("Failed to copy");
    }
  };

  const formatAccountNumber = (accountNumber) => {
    if (!accountNumber) return "Not assigned";
    // Format as XXXX-XXXX-XX
    return accountNumber.replace(/(\d{4})(\d{4})(\d{2})/, '$1-$2-$3');
  };

  const formatRoutingNumber = (routingNumber) => {
    if (!routingNumber) return "Not assigned";
    // Format as XXX-XXX-XXX
    return routingNumber.replace(/(\d{3})(\d{3})(\d{3})/, '$1-$2-$3');
  };
  
  // Fetch signed URLs for documents
  useEffect(() => {
    const fetchDocumentUrls = async () => {
      if (!profile) return;

      setLoadingDocuments(true);
      try {
        const urls = { 
          idDocument: null, 
          idDocumentFront: null,
          idDocumentBack: null,
          proofOfAddress: null 
        };

        // Priority 1: Use separate front/back URLs if they exist (for card-type documents)
        if (profile.id_document_front_url) {
          const frontResult = await getSignedUrl("user-documents", profile.id_document_front_url, 3600);
          if (frontResult.success) {
            urls.idDocumentFront = frontResult.url;
          } else {
            console.warn("Failed to get ID document front URL:", frontResult.error);
          }
        }

        if (profile.id_document_back_url) {
          const backResult = await getSignedUrl("user-documents", profile.id_document_back_url, 3600);
          if (backResult.success) {
            urls.idDocumentBack = backResult.url;
          } else {
            console.warn("Failed to get ID document back URL:", backResult.error);
          }
        }

        // Priority 2: If no separate front/back URLs, try id_document_url
        // Check if it's comma-separated (legacy format) or single path
        if (!urls.idDocumentFront && !urls.idDocumentBack && profile.id_document_url) {
          // Check if it contains a comma (comma-separated front,back paths)
          if (profile.id_document_url.includes(',')) {
            const paths = profile.id_document_url.split(',').map(p => p.trim());
            // Try to get signed URLs for both paths
            if (paths[0]) {
              const frontResult = await getSignedUrl("user-documents", paths[0], 3600);
              if (frontResult.success) {
                urls.idDocumentFront = frontResult.url;
              }
            }
            if (paths[1]) {
              const backResult = await getSignedUrl("user-documents", paths[1], 3600);
              if (backResult.success) {
                urls.idDocumentBack = backResult.url;
              }
            }
          } else {
            // Single path (passport or other single document)
            const idResult = await getSignedUrl("user-documents", profile.id_document_url, 3600);
            if (idResult.success) {
              urls.idDocument = idResult.url;
            } else {
              console.warn("Failed to get ID document URL:", idResult.error);
            }
          }
        }

        // Fetch proof of address URL
        if (profile.proof_of_address_url) {
          const addressResult = await getSignedUrl("user-documents", profile.proof_of_address_url, 3600);
          if (addressResult.success) {
            urls.proofOfAddress = addressResult.url;
          } else {
            console.warn("Failed to get proof of address URL:", addressResult.error);
          }
        }

        setDocumentUrls(urls);
      } catch (error) {
        console.error("Error fetching document URLs:", error);
      } finally {
        setLoadingDocuments(false);
      }
    };

    fetchDocumentUrls();
  }, [profile]);
  
  const getUserDisplayName = () => {
    if (profile?.full_name) {
      return profile.full_name;
    }
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name;
    }
    if (user?.email) {
      return user.email.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, l => l.toUpperCase());
    }
    return "User";
  };

  const getUserInitials = () => {
    const name = getUserDisplayName();
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Not provided";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="min-h-screen bg-white pb-20">
      <Header title="Profile" rightIcon="edit" />
      
      <div className="px-4 py-6">
        {/* User Profile Section */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-24 h-24 rounded-full bg-blue-600 mb-4 flex items-center justify-center text-white text-2xl font-bold">
            {getUserInitials()}
          </div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl font-semibold text-gray-900">{getUserDisplayName()}</h2>
            <Check className="w-5 h-5 text-yellow-500 fill-yellow-500" />
          </div>
          <p className="text-sm text-gray-600">{user?.email}</p>
        </div>

        {/* KYC Information Section */}
        {profileLoading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
            <p className="mt-2 text-gray-600">Loading profile data...</p>
          </div>
        ) : (
          <>
            <Card className="mb-6 border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-600" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div className="flex items-start gap-3">
                    <User className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 mb-1">Full Name</p>
                      <p className="text-sm font-medium text-gray-900">
                        {profile?.full_name || user?.user_metadata?.full_name || "Not provided"}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 mb-1">Phone Number</p>
                      <p className="text-sm font-medium text-gray-900">
                        {profile?.phone || user?.user_metadata?.phone || "Not provided"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 mb-1">Date of Birth</p>
                      <p className="text-sm font-medium text-gray-900">
                        {formatDate(profile?.date_of_birth || user?.user_metadata?.date_of_birth)}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="mb-6 border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-blue-600" />
                  Address Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Street Address</p>
                    <p className="text-sm font-medium text-gray-900">
                      {profile?.address || user?.user_metadata?.address || "Not provided"}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">City</p>
                      <p className="text-sm font-medium text-gray-900">
                        {profile?.city || user?.user_metadata?.city || "Not provided"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">State</p>
                      <p className="text-sm font-medium text-gray-900">
                        {profile?.state || user?.user_metadata?.state || "Not provided"}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">ZIP Code</p>
                      <p className="text-sm font-medium text-gray-900">
                        {profile?.zip_code || user?.user_metadata?.zip_code || "Not provided"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Country</p>
                      <p className="text-sm font-medium text-gray-900">
                        {profile?.country || user?.user_metadata?.country || "Not provided"}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Banking Credentials Section */}
            <Card className="mb-6 border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-blue-600" />
                  Banking Credentials
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-xs text-blue-800 mb-3">
                    <strong>Share these credentials</strong> to receive money transfers from other people
                  </p>
                </div>
                
                <div className="space-y-4">
                  {/* Account Number */}
                  <div className="border-2 border-gray-200 rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 mb-1">Account Number</p>
                        <p className="text-lg font-mono font-semibold text-gray-900">
                          {formatAccountNumber(profile?.account_number || user?.user_metadata?.account_number)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Account Type: {(profile?.account_type || user?.user_metadata?.account_type || 'checking').charAt(0).toUpperCase() + (profile?.account_type || user?.user_metadata?.account_type || 'checking').slice(1)}
                        </p>
                      </div>
                      <button
                        onClick={() => copyToClipboard(profile?.account_number || user?.user_metadata?.account_number || '', 'Account Number')}
                        className="ml-4 p-2 rounded-lg hover:bg-blue-100 transition-colors"
                        title="Copy account number"
                      >
                        {copiedField === 'Account Number' ? (
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                        ) : (
                          <Copy className="w-5 h-5 text-blue-600" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Routing Number */}
                  <div className="border-2 border-gray-200 rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 mb-1">Routing Number</p>
                        <p className="text-lg font-mono font-semibold text-gray-900">
                          {formatRoutingNumber(profile?.routing_number || user?.user_metadata?.routing_number)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">Used for wire transfers and ACH</p>
                      </div>
                      <button
                        onClick={() => copyToClipboard(profile?.routing_number || user?.user_metadata?.routing_number || '', 'Routing Number')}
                        className="ml-4 p-2 rounded-lg hover:bg-blue-100 transition-colors"
                        title="Copy routing number"
                      >
                        {copiedField === 'Routing Number' ? (
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                        ) : (
                          <Copy className="w-5 h-5 text-blue-600" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <p className="text-xs text-yellow-800">
                    <strong>Security Note:</strong> Keep your banking credentials private. Only share them with trusted parties for receiving payments.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Uploaded Documents Section */}
            <Card className="mb-6 border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  Uploaded Documents
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {loadingDocuments ? (
                  <div className="text-center py-4">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent"></div>
                    <p className="mt-2 text-xs text-gray-500">Loading documents...</p>
                  </div>
                ) : (
                  <>
                    {/* ID Document */}
                    <div>
                      <p className="text-xs text-gray-500 mb-2">
                        Government Issued ID
                        {profile?.document_type && (
                          <span className="ml-2 text-gray-400">
                            ({profile.document_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())})
                          </span>
                        )}
                      </p>
                      
                      {/* Card-type documents (front and back) */}
                      {(documentUrls.idDocumentFront || documentUrls.idDocumentBack) ? (
                        <div className="space-y-3">
                          {/* Front Side */}
                          {documentUrls.idDocumentFront && (
                            <div className="border-2 border-gray-200 rounded-lg p-4 bg-gray-50">
                              <div className="flex items-center gap-3">
                                <div className="w-16 h-16 rounded-lg overflow-hidden border-2 border-blue-300 bg-white flex items-center justify-center">
                                  <img
                                    src={documentUrls.idDocumentFront}
                                    alt="ID Document Front"
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      e.target.style.display = 'none';
                                      e.target.nextSibling.style.display = 'flex';
                                    }}
                                  />
                                  <div className="hidden w-full h-full items-center justify-center">
                                    <FileText className="w-8 h-8 text-blue-500" />
                                  </div>
                                </div>
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-gray-900">Front Side</p>
                                  <p className="text-xs text-gray-500">Uploaded</p>
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => window.open(documentUrls.idDocumentFront, '_blank')}
                                    className="h-8"
                                  >
                                    <Eye className="w-4 h-4 mr-1" />
                                    View
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      const link = document.createElement('a');
                                      link.href = documentUrls.idDocumentFront;
                                      link.download = 'id-document-front';
                                      link.click();
                                    }}
                                    className="h-8"
                                  >
                                    <Download className="w-4 h-4 mr-1" />
                                    Download
                                  </Button>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {/* Back Side */}
                          {documentUrls.idDocumentBack && (
                            <div className="border-2 border-gray-200 rounded-lg p-4 bg-gray-50">
                              <div className="flex items-center gap-3">
                                <div className="w-16 h-16 rounded-lg overflow-hidden border-2 border-blue-300 bg-white flex items-center justify-center">
                                  <img
                                    src={documentUrls.idDocumentBack}
                                    alt="ID Document Back"
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      e.target.style.display = 'none';
                                      e.target.nextSibling.style.display = 'flex';
                                    }}
                                  />
                                  <div className="hidden w-full h-full items-center justify-center">
                                    <FileText className="w-8 h-8 text-blue-500" />
                                  </div>
                                </div>
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-gray-900">Back Side</p>
                                  <p className="text-xs text-gray-500">Uploaded</p>
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => window.open(documentUrls.idDocumentBack, '_blank')}
                                    className="h-8"
                                  >
                                    <Eye className="w-4 h-4 mr-1" />
                                    View
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      const link = document.createElement('a');
                                      link.href = documentUrls.idDocumentBack;
                                      link.download = 'id-document-back';
                                      link.click();
                                    }}
                                    className="h-8"
                                  >
                                    <Download className="w-4 h-4 mr-1" />
                                    Download
                                  </Button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : documentUrls.idDocument ? (
                        /* Single document (passport) */
                        <div className="border-2 border-gray-200 rounded-lg p-4 bg-gray-50">
                          <div className="flex items-center gap-3">
                            <div className="w-16 h-16 rounded-lg overflow-hidden border-2 border-blue-300 bg-white flex items-center justify-center">
                              <img
                                src={documentUrls.idDocument}
                                alt="ID Document"
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'flex';
                                }}
                              />
                              <div className="hidden w-full h-full items-center justify-center">
                                <FileText className="w-8 h-8 text-blue-500" />
                              </div>
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">ID Document</p>
                              <p className="text-xs text-gray-500">Uploaded</p>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => window.open(documentUrls.idDocument, '_blank')}
                                className="h-8"
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                View
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  const link = document.createElement('a');
                                  link.href = documentUrls.idDocument;
                                  link.download = 'id-document';
                                  link.click();
                                }}
                                className="h-8"
                              >
                                <Download className="w-4 h-4 mr-1" />
                                Download
                              </Button>
                            </div>
                          </div>
                        </div>
                      ) : (profile?.id_document_url || profile?.id_document_front_url || profile?.id_document_back_url) ? (
                        <p className="text-sm text-gray-500">Document uploaded but unavailable</p>
                      ) : (
                        <p className="text-sm text-gray-500">No ID document uploaded</p>
                      )}
                    </div>

                    {/* Proof of Address */}
                    <div>
                      <p className="text-xs text-gray-500 mb-2">Proof of Address</p>
                      {profile?.proof_of_address_url ? (
                        documentUrls.proofOfAddress ? (
                          <div className="border-2 border-gray-200 rounded-lg p-4 bg-gray-50">
                            <div className="flex items-center gap-3">
                              <div className="w-16 h-16 rounded-lg overflow-hidden border-2 border-blue-300 bg-white flex items-center justify-center">
                                <img
                                  src={documentUrls.proofOfAddress}
                                  alt="Proof of Address"
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.nextSibling.style.display = 'flex';
                                  }}
                                />
                                <div className="hidden w-full h-full items-center justify-center">
                                  <FileText className="w-8 h-8 text-blue-500" />
                                </div>
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900">Proof of Address</p>
                                <p className="text-xs text-gray-500">Uploaded</p>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => window.open(documentUrls.proofOfAddress, '_blank')}
                                  className="h-8"
                                >
                                  <Eye className="w-4 h-4 mr-1" />
                                  View
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    const link = document.createElement('a');
                                    link.href = documentUrls.proofOfAddress;
                                    link.download = 'proof-of-address';
                                    link.click();
                                  }}
                                  className="h-8"
                                >
                                  <Download className="w-4 h-4 mr-1" />
                                  Download
                                </Button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">Document uploaded but unavailable</p>
                        )
                      ) : (
                        <p className="text-sm text-gray-500">No proof of address uploaded</p>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {/* General Settings Section */}
        <div className="space-y-4">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
            GENERAL
          </h3>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-0">
              <Button
                variant="ghost"
                className="w-full justify-start h-auto p-4 hover:bg-gray-50"
              >
                <div className="flex items-center gap-4 w-full">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <Settings className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1 text-left">
                    <h4 className="font-medium text-gray-900">Profile Settings</h4>
                    <p className="text-sm text-gray-500">
                      Update and modify your profile
                    </p>
                  </div>
                </div>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-0">
              <Button
                variant="ghost"
                className="w-full justify-start h-auto p-4 hover:bg-gray-50"
              >
                <div className="flex items-center gap-4 w-full">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1 text-left">
                    <h4 className="font-medium text-gray-900">Privacy</h4>
                    <p className="text-sm text-gray-500">
                      Change your password
                    </p>
                  </div>
                </div>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-0">
              <Button
                variant="ghost"
                className="w-full justify-start h-auto p-4 hover:bg-gray-50"
              >
                <div className="flex items-center gap-4 w-full">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <Bell className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1 text-left">
                    <h4 className="font-medium text-gray-900">Notifications</h4>
                    <p className="text-sm text-gray-500">
                      Change your notification settings
                    </p>
                  </div>
                </div>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm mt-6">
            <CardContent className="p-0">
              <Button
                variant="ghost"
                onClick={signOut}
                className="w-full justify-start h-auto p-4 hover:bg-red-50 text-red-600"
              >
                <div className="flex items-center gap-4 w-full">
                  <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                    <LogOut className="w-5 h-5 text-red-600" />
                  </div>
                  <div className="flex-1 text-left">
                    <h4 className="font-medium">Sign Out</h4>
                    <p className="text-sm text-gray-500">
                      Sign out of your account
                    </p>
                  </div>
                </div>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
}

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfilePageContent />
    </ProtectedRoute>
  );
}

