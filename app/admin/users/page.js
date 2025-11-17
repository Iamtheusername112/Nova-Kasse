"use client";

import { useState, useEffect } from "react";
import AdminProtectedRoute from "@/components/auth/AdminProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Shield,
  CheckCircle2,
  XCircle,
  Ban,
  Unlock,
  Mail,
  Phone,
  Calendar,
  MapPin,
  CreditCard,
  FileText,
  ArrowLeft,
  MoreVertical,
  X,
  Copy,
  Download,
  ExternalLink,
  User
} from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useUsers } from "@/lib/hooks/useUsers";
import LoadingScreen from "@/components/ui/loading-screen";

function UsersManagementContent() {
  const router = useRouter();
  const { users, loading, error, refreshUsers } = useUsers();
  
  // Debug: Log users data
  useEffect(() => {
    console.log("Users data:", { 
      usersCount: users?.length, 
      loading, 
      error,
      users: users 
    });
  }, [users, loading, error]);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all"); // all, verified, unverified
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [documentUrls, setDocumentUrls] = useState({
    profileImage: null,
    idDocument: null,
    idDocumentFront: null,
    idDocumentBack: null,
    proofOfAddress: null
  });
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [copiedField, setCopiedField] = useState(null);
  const [editingBanking, setEditingBanking] = useState(false);
  const [bankingFormData, setBankingFormData] = useState({
    account_number: '',
    routing_number: '',
    account_type: 'checking',
    currency: 'USD'
  });
  const [savingBanking, setSavingBanking] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingBankingData, setPendingBankingData] = useState(null);
  const [blockingUser, setBlockingUser] = useState(false);

  // Filter users based on search and status
  const filteredUsers = (users || []).filter((user) => {
    // Skip users without IDs (shouldn't happen, but defensive check)
    if (!user || !user.id) {
      console.warn("User without ID found:", user);
      return false;
    }

    const matchesSearch =
      !searchQuery ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.phone?.includes(searchQuery) ||
      user.account_number?.includes(searchQuery);

    const matchesFilter =
      filterStatus === "all" ||
      (filterStatus === "verified" && user.email_confirmed && !user.is_blocked) ||
      (filterStatus === "unverified" && !user.email_confirmed && !user.is_blocked) ||
      (filterStatus === "blocked" && user.is_blocked);

    return matchesSearch && matchesFilter;
  });

  const handleViewUser = async (user) => {
    // Ensure user has an ID before proceeding
    if (!user || !user.id) {
      toast.error("Invalid user data. Please try again.");
      console.error("handleViewUser: user or user.id is missing", user);
      return;
    }
    
    console.log("Viewing user:", user.id, user.email);
    setSelectedUser(user);
    setShowUserDetails(true);
    setLoadingDocuments(true);
    
      // Fetch document URLs using admin API route
    try {
      const urls = {
        profileImage: null,
        idDocument: null,
        idDocumentFront: null,
        idDocumentBack: null,
        proofOfAddress: null
      };

      // Collect all document paths including profile image
      const pathsToFetch = [];
      
      // Profile image
      if (user.profile_image_url) {
        pathsToFetch.push({ path: user.profile_image_url, type: 'profileImage' });
      }
      
      if (user.id_document_front_url) {
        pathsToFetch.push({ path: user.id_document_front_url, type: 'idDocumentFront' });
      }
      
      if (user.id_document_back_url) {
        pathsToFetch.push({ path: user.id_document_back_url, type: 'idDocumentBack' });
      }

      // Legacy format support
      if (!user.id_document_front_url && !user.id_document_back_url && user.id_document_url) {
        if (user.id_document_url.includes(',')) {
          const paths = user.id_document_url.split(',').map(p => p.trim());
          if (paths[0]) pathsToFetch.push({ path: paths[0], type: 'idDocumentFront' });
          if (paths[1]) pathsToFetch.push({ path: paths[1], type: 'idDocumentBack' });
        } else {
          pathsToFetch.push({ path: user.id_document_url, type: 'idDocument' });
        }
      }

      if (user.proof_of_address_url) {
        pathsToFetch.push({ path: user.proof_of_address_url, type: 'proofOfAddress' });
      }

      // Fetch all signed URLs via admin API
      if (pathsToFetch.length > 0) {
        const response = await fetch('/api/admin/documents', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            paths: pathsToFetch.map(p => p.path).filter(Boolean)
          })
        });

        if (response.ok) {
          const { results } = await response.json();
          
          // Map results back to URL object
          results.forEach((result, index) => {
            if (result.success && pathsToFetch[index]) {
              const { type } = pathsToFetch[index];
              urls[type] = result.url;
            }
          });
        } else {
          console.error('Failed to fetch document URLs:', await response.text());
        }
      }

      setDocumentUrls(urls);
    } catch (error) {
      console.error("Error fetching document URLs:", error);
      toast.error("Failed to load documents. They may not exist or you may not have permission.");
    } finally {
      setLoadingDocuments(false);
    }
  };

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
    return accountNumber.replace(/(\d{4})(\d{4})(\d{2})/, '$1-$2-$3');
  };

  const formatRoutingNumber = (routingNumber) => {
    if (!routingNumber) return "Not assigned";
    return routingNumber.replace(/(\d{3})(\d{3})(\d{3})/, '$1-$2-$3');
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Not provided";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const getDocumentTypeLabel = (type) => {
    const types = {
      passport: "Passport",
      driver_license: "Driver's License",
      national_id: "National ID",
      state_id: "State ID",
      proof_of_address: "Proof of Address"
    };
    return types[type] || type || "Not specified";
  };

  const handleDeleteUser = async (userId, userName) => {
    // Use Sonner toast for confirmation instead of browser confirm
    const toastId = toast.warning(
      `Delete ${userName || "this user"}?`,
      {
        description: "This will permanently delete the user from the database. This action cannot be undone.",
        action: {
          label: "Delete",
          onClick: async () => {
            toast.dismiss(toastId);
            try {
              // Delete user completely using admin API
              const response = await fetch(`/api/admin/users/${userId}`, {
                method: 'DELETE',
              });

              const data = await response.json();

              if (!response.ok) {
                // Handle specific error cases
                if (response.status === 404) {
                  throw new Error(data.error || 'User not found. The user may have already been deleted.');
                }
                throw new Error(data.error || 'Failed to delete user');
              }

              toast.success("User deleted successfully from database");
              
              // Close user details modal if open
              if (showUserDetails && selectedUser?.id === userId) {
                setShowUserDetails(false);
                setSelectedUser(null);
              }
              
              refreshUsers();
            } catch (error) {
              console.error("Error deleting user:", error);
              toast.error("Failed to delete user: " + error.message);
            }
          },
        },
        cancel: {
          label: "Cancel",
          onClick: () => {
            toast.dismiss(toastId);
            toast.info("Deletion cancelled");
          },
        },
        duration: 10000, // 10 seconds to decide
      }
    );
  };

  const handleSaveBankingCredentials = async () => {
    // Capture selectedUser at the start to avoid closure issues
    const currentUser = selectedUser;
    
    // Validate that we have a selected user with an ID
    if (!currentUser) {
      toast.error("No user selected. Please close and reopen the user details.");
      console.error("handleSaveBankingCredentials: selectedUser is null");
      return;
    }

    if (!currentUser.id) {
      toast.error("User ID is missing. Please close and reopen the user details.");
      console.error("handleSaveBankingCredentials: selectedUser.id is undefined", currentUser);
      return;
    }

    const userId = String(currentUser.id).trim();
    
    // Additional validation - ensure userId is a valid string UUID
    if (!userId || userId === 'undefined' || userId === 'null' || userId === '') {
      toast.error("Invalid user ID. Please close and reopen the user details.");
      console.error("handleSaveBankingCredentials: Invalid userId", { userId, currentUser });
      return;
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      toast.error("Invalid user ID format. Please close and reopen the user details.");
      console.error("handleSaveBankingCredentials: Invalid UUID format", { userId, currentUser });
      return;
    }

    console.log("Saving banking credentials for user:", userId, "Type:", typeof userId, "Full user:", currentUser);

    // Validate inputs
    if (!bankingFormData.account_number || bankingFormData.account_number.length !== 10) {
      toast.error("Account number must be exactly 10 digits");
      return;
    }

    if (!bankingFormData.routing_number || bankingFormData.routing_number.length !== 9) {
      toast.error("Routing number must be exactly 9 digits");
      return;
    }

    // Check if this is a reassignment (changing existing credentials)
    const isReassignment = currentUser.account_number && 
      (currentUser.account_number !== bankingFormData.account_number || 
       currentUser.routing_number !== bankingFormData.routing_number);

    if (isReassignment) {
      // Store the data and show confirmation toast with action buttons
      setPendingBankingData({ userId, currentUser, bankingFormData });
      const toastId = toast.warning(
        `Reassigning banking credentials for ${currentUser.full_name || currentUser.email}`,
        {
          description: `Current: Account ${currentUser.account_number || 'N/A'}, Routing ${currentUser.routing_number || 'N/A'}. New: Account ${bankingFormData.account_number}, Routing ${bankingFormData.routing_number}`,
          action: {
            label: "Confirm",
            onClick: () => {
              toast.dismiss(toastId);
              setPendingBankingData(null);
              processBankingCredentialsUpdate(userId, currentUser, bankingFormData);
            },
          },
          cancel: {
            label: "Cancel",
            onClick: () => {
              toast.dismiss(toastId);
              setPendingBankingData(null);
              toast.info("Reassignment cancelled");
            },
          },
          duration: 10000, // 10 seconds to decide
        }
      );
      return;
    }

    // If not a reassignment, proceed directly
    processBankingCredentialsUpdate(userId, currentUser, bankingFormData);
  };

  const processBankingCredentialsUpdate = async (userId, currentUser, bankingFormData) => {
    setSavingBanking(true);

    try {
      const response = await fetch(`/api/admin/users/${userId}/banking`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          account_number: bankingFormData.account_number,
          routing_number: bankingFormData.routing_number,
          account_type: bankingFormData.account_type,
          currency: bankingFormData.currency,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update banking credentials');
      }

      toast.success("Banking credentials updated successfully");
      setEditingBanking(false);
      
      // Update selected user with new data (preserve ID)
      const updatedUser = {
        ...currentUser,
        id: userId, // Ensure ID is preserved
        account_number: bankingFormData.account_number,
        routing_number: bankingFormData.routing_number,
        account_type: bankingFormData.account_type,
        currency: bankingFormData.currency,
      };
      setSelectedUser(updatedUser);
      
      // Refresh user data (this might update the users list)
      refreshUsers();
    } catch (error) {
      console.error("Error updating banking credentials:", error);
      toast.error(error.message || "Failed to update banking credentials");
    } finally {
      setSavingBanking(false);
    }
  };

  const handleBlockUser = async (userId, userName, isCurrentlyBlocked) => {
    const action = isCurrentlyBlocked ? 'unblock' : 'block';
    const toastId = toast.warning(
      `${action === 'block' ? 'Block' : 'Unblock'} ${userName || "this user"}?`,
      {
        description: action === 'block' 
          ? "This user will be signed out and unable to access their account."
          : "This user will regain access to their account.",
        action: {
          label: action === 'block' ? "Block" : "Unblock",
          onClick: async () => {
            toast.dismiss(toastId);
            try {
              setBlockingUser(true);
              const response = await fetch(`/api/admin/users/${userId}/block`, {
                method: 'PATCH',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  is_blocked: !isCurrentlyBlocked
                }),
              });

              const data = await response.json();

              if (!response.ok) {
                throw new Error(data.error || `Failed to ${action} user`);
              }

              toast.success(`User ${action === 'block' ? 'blocked' : 'unblocked'} successfully`);
              
              // Close user details modal if open
              if (showUserDetails && selectedUser?.id === userId) {
                setSelectedUser({
                  ...selectedUser,
                  is_blocked: !isCurrentlyBlocked
                });
              }
              
              refreshUsers();
            } catch (error) {
              console.error(`Error ${action}ing user:`, error);
              toast.error(error.message || `Failed to ${action} user`);
            } finally {
              setBlockingUser(false);
            }
          },
        },
        cancel: {
          label: "Cancel",
          onClick: () => {
            toast.dismiss(toastId);
          },
        },
        duration: 10000,
      }
    );
  };

  const getStatusBadge = (user) => {
    // Show blocked status first
    if (user.is_blocked) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
          <Ban className="w-3 h-3" />
          Blocked
        </span>
      );
    }
    
    if (user.email_confirmed) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
          <CheckCircle2 className="w-3 h-3" />
          Verified
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
        <XCircle className="w-3 h-3" />
        Unverified
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => router.push("/admin/dashboard")}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-5 h-5" />
                Back
              </Button>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">User Management</h1>
                  <p className="text-xs text-gray-500">Manage all user accounts</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Users</p>
                    <p className="text-2xl font-bold text-gray-900">{users.length}</p>
                  </div>
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Verified</p>
                    <p className="text-2xl font-bold text-green-600">
                      {users.filter((u) => u.email_confirmed).length}
                    </p>
                  </div>
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Unverified</p>
                    <p className="text-2xl font-bold text-yellow-600">
                      {users.filter((u) => !u.email_confirmed).length}
                    </p>
                  </div>
                  <XCircle className="w-8 h-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Blocked</p>
                    <p className="text-2xl font-bold text-red-600">
                      {users.filter((u) => u.is_blocked).length}
                    </p>
                  </div>
                  <Ban className="w-8 h-8 text-red-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filter */}
          <Card className="mb-6 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name, email, phone, or account number..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="w-5 h-5 text-gray-400" />
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Users</option>
                    <option value="verified">Verified</option>
                    <option value="unverified">Unverified</option>
                    <option value="blocked">Blocked</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Users Table */}
          {loading ? (
            <LoadingScreen message="Loading Users..." subMessage="Fetching user data from database" />
          ) : error ? (
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardContent className="p-8">
                <div className="text-center text-red-600">
                  <p>Error loading users: {error}</p>
                  <Button onClick={refreshUsers} className="mt-4">
                    Retry
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : filteredUsers.length === 0 ? (
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardContent className="p-8">
                <div className="text-center text-gray-600">
                  <Users className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p>No users found</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Users ({filteredUsers.length})</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          User
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Contact
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Account
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Joined
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                                {user.full_name
                                  ? user.full_name
                                      .split(" ")
                                      .map((n) => n[0])
                                      .join("")
                                      .toUpperCase()
                                      .slice(0, 2)
                                  : user.email?.[0]?.toUpperCase() || "U"}
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {user.full_name || "No Name"}
                                </div>
                                <div className="text-sm text-gray-500">{user.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {user.phone || "N/A"}
                            </div>
                            <div className="text-sm text-gray-500">
                              {user.city && user.state ? `${user.city}, ${user.state}` : "N/A"}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {user.account_number ? `****${user.account_number.slice(-4)}` : "N/A"}
                            </div>
                            <div className="text-sm text-gray-500">
                              {user.account_type || "N/A"}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getStatusBadge(user)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(user.created_at)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewUser(user)}
                                className="flex items-center gap-1"
                              >
                                <Eye className="w-4 h-4" />
                                View
                              </Button>
                              {user.is_blocked ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleBlockUser(user.id, user.full_name || user.email, true)}
                                  disabled={blockingUser}
                                  className="flex items-center gap-1 text-green-600 hover:text-green-700"
                                >
                                  <Unlock className="w-4 h-4" />
                                  Unblock
                                </Button>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleBlockUser(user.id, user.full_name || user.email, false)}
                                  disabled={blockingUser}
                                  className="flex items-center gap-1 text-orange-600 hover:text-orange-700"
                                >
                                  <Ban className="w-4 h-4" />
                                  Block
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteUser(user.id, user.full_name || user.email)}
                                className="flex items-center gap-1 text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                                Delete
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* User Details Modal */}
      {showUserDetails && selectedUser && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setShowUserDetails(false)}>
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <CardHeader className="flex items-center justify-between border-b bg-gray-50">
              <div className="flex items-center gap-4">
                {/* Profile Image */}
                {selectedUser.profile_image_url ? (
                  <div className="relative">
                    <img
                      src={selectedUser.profile_image_url}
                      alt={selectedUser.full_name || "Profile"}
                      className="w-16 h-16 rounded-full object-cover border-4 border-white shadow-lg"
                    />
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-green-500 border-2 border-white"></div>
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                    {selectedUser.full_name
                      ? selectedUser.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
                      : selectedUser.email?.[0]?.toUpperCase() || "U"}
                  </div>
                )}
                <div>
                  <CardTitle className="text-xl">{selectedUser.full_name || "No Name"}</CardTitle>
                  <p className="text-sm text-gray-500">{selectedUser.email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {getStatusBadge(selectedUser)}
                    <span className="text-xs text-gray-400">
                      Joined {formatDate(selectedUser.created_at)}
                    </span>
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowUserDetails(false)}>
                <X className="w-5 h-5" />
              </Button>
            </CardHeader>
            <CardContent className="p-6 space-y-6">

              {/* Profile Image Section */}
              {documentUrls.profileImage && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <User className="w-5 h-5 text-blue-600" />
                    Profile Image
                  </h3>
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center gap-4">
                      <img
                        src={documentUrls.profileImage}
                        alt="Profile"
                        className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                      />
                      <div className="flex-1">
                        <p className="text-sm text-gray-600 mb-2">User's profile picture</p>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(documentUrls.profileImage, '_blank')}
                          >
                            <ExternalLink className="w-4 h-4 mr-1" />
                            View Full Size
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const link = document.createElement('a');
                              link.href = documentUrls.profileImage;
                              link.download = 'profile-image.jpg';
                              link.click();
                            }}
                          >
                            <Download className="w-4 h-4 mr-1" />
                            Download
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Personal Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-600" />
                  Personal Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500">Full Name</p>
                    <p className="text-sm font-medium">{selectedUser.full_name || "Not provided"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500">Email</p>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{selectedUser.email || "N/A"}</p>
                      <button
                        onClick={() => copyToClipboard(selectedUser.email, "Email")}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        {copiedField === "Email" ? (
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500">Phone Number</p>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{selectedUser.phone || "Not provided"}</p>
                      {selectedUser.phone && (
                        <button
                          onClick={() => copyToClipboard(selectedUser.phone, "Phone")}
                          className="p-1 hover:bg-gray-100 rounded"
                        >
                          {copiedField === "Phone" ? (
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                          ) : (
                            <Copy className="w-4 h-4 text-gray-400" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500">Date of Birth</p>
                    <p className="text-sm font-medium">{formatDate(selectedUser.date_of_birth)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500">Security PIN</p>
                    <p className="text-sm font-mono font-medium">
                      {selectedUser.security_pin ? "••••" : "Not set"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Address Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-blue-600" />
                  Address Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1 md:col-span-2">
                    <p className="text-xs text-gray-500">Full Address</p>
                    <p className="text-sm font-medium">
                      {selectedUser.address 
                        ? `${selectedUser.address}${selectedUser.city ? `, ${selectedUser.city}` : ''}${selectedUser.state ? `, ${selectedUser.state}` : ''} ${selectedUser.zip_code || ''} ${selectedUser.country || ''}`.trim()
                        : "Not provided"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500">Street Address</p>
                    <p className="text-sm font-medium">{selectedUser.address || "Not provided"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500">City</p>
                    <p className="text-sm font-medium">{selectedUser.city || "Not provided"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500">State/Province</p>
                    <p className="text-sm font-medium">{selectedUser.state || "Not provided"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500">Zip/Postal Code</p>
                    <p className="text-sm font-medium">{selectedUser.zip_code || "Not provided"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500">Country</p>
                    <p className="text-sm font-medium">{selectedUser.country || "Not provided"}</p>
                  </div>
                </div>
              </div>

              {/* Banking Credentials */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-blue-600" />
                    Banking Credentials
                  </h3>
                  {!editingBanking ? (
                    <div className="flex items-center gap-2">
                      {selectedUser?.account_number && (
                        <span className="text-xs text-gray-500">
                          Auto-assigned on account creation
                        </span>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (!selectedUser || !selectedUser.id) {
                            toast.error("User data is missing. Please close and reopen the user details.");
                            return;
                          }
                          setEditingBanking(true);
                          setBankingFormData({
                            account_number: selectedUser.account_number || '',
                            routing_number: selectedUser.routing_number || '',
                            account_type: selectedUser.account_type || 'checking',
                            currency: selectedUser.currency || 'USD'
                          });
                        }}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        {selectedUser?.account_number ? 'Change/Reassign' : 'Assign'}
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingBanking(false);
                          setBankingFormData({
                            account_number: '',
                            routing_number: '',
                            account_type: 'checking',
                            currency: 'USD'
                          });
                        }}
                        disabled={savingBanking}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => {
                          // Double-check selectedUser.id before calling save
                          if (!selectedUser || !selectedUser.id) {
                            toast.error("User data is missing. Please close and reopen the user details.");
                            setEditingBanking(false);
                            return;
                          }
                          handleSaveBankingCredentials();
                        }}
                        disabled={savingBanking || !selectedUser?.id}
                      >
                        {savingBanking ? (
                          <>
                            <div className="w-4 h-4 mr-1 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Saving...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4 mr-1" />
                            Save
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
                
                {editingBanking ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg bg-gray-50">
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-gray-700">
                        Account Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={bankingFormData.account_number}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                          setBankingFormData({ ...bankingFormData, account_number: value });
                        }}
                        placeholder="10 digits"
                        className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        maxLength={10}
                      />
                      <p className="text-xs text-gray-500">Must be exactly 10 digits</p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-gray-700">
                        Routing Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={bankingFormData.routing_number}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '').slice(0, 9);
                          setBankingFormData({ ...bankingFormData, routing_number: value });
                        }}
                        placeholder="9 digits"
                        className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        maxLength={9}
                      />
                      <p className="text-xs text-gray-500">Must be exactly 9 digits</p>
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-xs font-medium text-gray-700">
                        Account Type
                      </label>
                      <select
                        value={bankingFormData.account_type}
                        onChange={(e) => setBankingFormData({ ...bankingFormData, account_type: e.target.value })}
                        className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="checking">Checking</option>
                        <option value="savings">Savings</option>
                        <option value="business">Business</option>
                      </select>
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-xs font-medium text-gray-700">
                        Account Currency <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={bankingFormData.currency}
                        onChange={(e) => setBankingFormData({ ...bankingFormData, currency: e.target.value })}
                        className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="USD">USD - US Dollar ($)</option>
                        <option value="EUR">EUR - Euro (€)</option>
                        <option value="AUD">AUD - Australian Dollar (A$)</option>
                      </select>
                      <p className="text-xs text-gray-500">This will affect how balances and transactions are displayed</p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-xs text-gray-500">Account Number</p>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">
                          {selectedUser.account_number ? formatAccountNumber(selectedUser.account_number) : 'Not assigned'}
                        </p>
                        {selectedUser.account_number && (
                          <button
                            onClick={() => copyToClipboard(selectedUser.account_number, "Account Number")}
                            className="p-1 hover:bg-gray-100 rounded"
                          >
                            {copiedField === "Account Number" ? (
                              <CheckCircle2 className="w-4 h-4 text-green-600" />
                            ) : (
                              <Copy className="w-4 h-4 text-gray-400" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-gray-500">Routing Number</p>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">
                          {selectedUser.routing_number ? formatRoutingNumber(selectedUser.routing_number) : 'Not assigned'}
                        </p>
                        {selectedUser.routing_number && (
                          <button
                            onClick={() => copyToClipboard(selectedUser.routing_number, "Routing Number")}
                            className="p-1 hover:bg-gray-100 rounded"
                          >
                            {copiedField === "Routing Number" ? (
                              <CheckCircle2 className="w-4 h-4 text-green-600" />
                            ) : (
                              <Copy className="w-4 h-4 text-gray-400" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-gray-500">Account Type</p>
                      <p className="text-sm font-medium capitalize">{selectedUser.account_type || "Not assigned"}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-gray-500">Currency</p>
                      <p className="text-sm font-medium">
                        {selectedUser.currency ? `${selectedUser.currency} - ${selectedUser.currency === 'USD' ? 'US Dollar' : selectedUser.currency === 'EUR' ? 'Euro' : 'Australian Dollar'}` : 'USD - US Dollar'}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* KYC Documents */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  KYC Documents & Verification
                </h3>
                {loadingDocuments ? (
                  <div className="text-center py-4">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent"></div>
                    <p className="mt-2 text-sm text-gray-600">Loading documents...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Document Type & Status */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      {selectedUser.document_type && (
                        <div className="space-y-1">
                          <p className="text-xs text-gray-500">Document Type</p>
                          <p className="text-sm font-medium">{getDocumentTypeLabel(selectedUser.document_type)}</p>
                        </div>
                      )}
                      <div className="space-y-1">
                        <p className="text-xs text-gray-500">KYC Status</p>
                        <div className="flex items-center gap-2">
                          {selectedUser.id_document_front_url || selectedUser.id_document_back_url || selectedUser.id_document_url ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                              <CheckCircle2 className="w-3 h-3" />
                              Documents Uploaded
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                              <XCircle className="w-3 h-3" />
                              No Documents
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* ID Documents */}
                    {(documentUrls.idDocumentFront || documentUrls.idDocumentBack || documentUrls.idDocument) && (
                      <div className="space-y-3">
                        <p className="text-sm font-medium text-gray-700">Government Issued ID</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {documentUrls.idDocumentFront && (
                            <div className="border rounded-lg p-3">
                              <p className="text-xs text-gray-500 mb-2">Front Side</p>
                              <img
                                src={documentUrls.idDocumentFront}
                                alt="ID Front"
                                className="w-full h-32 object-cover rounded mb-2"
                              />
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => window.open(documentUrls.idDocumentFront, '_blank')}
                                  className="flex-1"
                                >
                                  <ExternalLink className="w-4 h-4 mr-1" />
                                  View
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    const link = document.createElement('a');
                                    link.href = documentUrls.idDocumentFront;
                                    link.download = 'id-front.jpg';
                                    link.click();
                                  }}
                                  className="flex-1"
                                >
                                  <Download className="w-4 h-4 mr-1" />
                                  Download
                                </Button>
                              </div>
                            </div>
                          )}
                          {documentUrls.idDocumentBack && (
                            <div className="border rounded-lg p-3">
                              <p className="text-xs text-gray-500 mb-2">Back Side</p>
                              <img
                                src={documentUrls.idDocumentBack}
                                alt="ID Back"
                                className="w-full h-32 object-cover rounded mb-2"
                              />
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => window.open(documentUrls.idDocumentBack, '_blank')}
                                  className="flex-1"
                                >
                                  <ExternalLink className="w-4 h-4 mr-1" />
                                  View
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    const link = document.createElement('a');
                                    link.href = documentUrls.idDocumentBack;
                                    link.download = 'id-back.jpg';
                                    link.click();
                                  }}
                                  className="flex-1"
                                >
                                  <Download className="w-4 h-4 mr-1" />
                                  Download
                                </Button>
                              </div>
                            </div>
                          )}
                          {documentUrls.idDocument && !documentUrls.idDocumentFront && !documentUrls.idDocumentBack && (
                            <div className="border rounded-lg p-3">
                              <p className="text-xs text-gray-500 mb-2">ID Document</p>
                              <img
                                src={documentUrls.idDocument}
                                alt="ID Document"
                                className="w-full h-32 object-cover rounded mb-2"
                              />
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => window.open(documentUrls.idDocument, '_blank')}
                                  className="flex-1"
                                >
                                  <ExternalLink className="w-4 h-4 mr-1" />
                                  View
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    const link = document.createElement('a');
                                    link.href = documentUrls.idDocument;
                                    link.download = 'id-document.jpg';
                                    link.click();
                                  }}
                                  className="flex-1"
                                >
                                  <Download className="w-4 h-4 mr-1" />
                                  Download
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Proof of Address */}
                    {documentUrls.proofOfAddress && (
                      <div className="space-y-3">
                        <p className="text-sm font-medium text-gray-700">Proof of Address</p>
                        <div className="border rounded-lg p-3">
                          <img
                            src={documentUrls.proofOfAddress}
                            alt="Proof of Address"
                            className="w-full h-32 object-cover rounded mb-2"
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(documentUrls.proofOfAddress, '_blank')}
                              className="flex-1"
                            >
                              <ExternalLink className="w-4 h-4 mr-1" />
                              View
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                const link = document.createElement('a');
                                link.href = documentUrls.proofOfAddress;
                                link.download = 'proof-of-address.jpg';
                                link.click();
                              }}
                              className="flex-1"
                            >
                              <Download className="w-4 h-4 mr-1" />
                              Download
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}

                    {!documentUrls.idDocumentFront && !documentUrls.idDocumentBack && !documentUrls.idDocument && !documentUrls.proofOfAddress && (
                      <p className="text-sm text-gray-500">No documents uploaded</p>
                    )}
                  </div>
                )}
              </div>

              {/* Account Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500">User ID</p>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-mono text-gray-700">{selectedUser.id}</p>
                      <button
                        onClick={() => copyToClipboard(selectedUser.id, "User ID")}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        {copiedField === "User ID" ? (
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500">Last Sign In</p>
                    <p className="text-sm font-medium">{formatDate(selectedUser.last_sign_in) || "Never"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500">Role</p>
                    <p className="text-sm font-medium capitalize">{selectedUser.role || "user"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500">Account Created</p>
                    <p className="text-sm font-medium">{formatDate(selectedUser.created_at)}</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t">
                {selectedUser.is_blocked ? (
                  <Button
                    onClick={() => {
                      setShowUserDetails(false);
                      handleBlockUser(selectedUser.id, selectedUser.full_name || selectedUser.email, true);
                    }}
                    disabled={blockingUser}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Unlock className="w-4 h-4 mr-2" />
                    Unblock User
                  </Button>
                ) : (
                  <Button
                    onClick={() => {
                      setShowUserDetails(false);
                      handleBlockUser(selectedUser.id, selectedUser.full_name || selectedUser.email, false);
                    }}
                    disabled={blockingUser}
                    className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
                  >
                    <Ban className="w-4 h-4 mr-2" />
                    Block User
                  </Button>
                )}
                <Button
                  variant="destructive"
                  onClick={() => {
                    setShowUserDetails(false);
                    handleDeleteUser(selectedUser.id, selectedUser.full_name || selectedUser.email);
                  }}
                  className="flex-1"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete User
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default function UsersManagementPage() {
  return (
    <AdminProtectedRoute>
      <UsersManagementContent />
    </AdminProtectedRoute>
  );
}

