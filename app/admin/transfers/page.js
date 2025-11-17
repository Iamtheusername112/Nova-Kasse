"use client";

import { useState, useEffect } from "react";
import AdminProtectedRoute from "@/components/auth/AdminProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft,
  Send,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Filter,
  User,
  DollarSign,
  Calendar,
  Mail,
  Phone,
  CreditCard,
  Eye,
  AlertCircle
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { formatCurrency as formatCurrencyUtil } from "@/lib/utils/currency";

function TransfersManagementContent() {
  const router = useRouter();
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("pending"); // pending, completed, failed, cancelled, all
  const [selectedTransfer, setSelectedTransfer] = useState(null);
  const [showTransferDetails, setShowTransferDetails] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchTransfers();
  }, []); // Fetch on mount

  // Refetch when filter changes
  useEffect(() => {
    if (!loading) {
      fetchTransfers();
    }
  }, [filterStatus]);

  const fetchTransfers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/transfers');
      if (!response.ok) {
        throw new Error('Failed to fetch transfers');
      }
      const data = await response.json();
      setTransfers(data.transfers || []);
    } catch (error) {
      console.error('Error fetching transfers:', error);
      toast.error('Failed to load transfers');
    } finally {
      setLoading(false);
    }
  };

  const filteredTransfers = (transfers || []).filter((transfer) => {
    const matchesSearch =
      !searchQuery ||
      transfer.recipient_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transfer.recipient_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transfer.recipient_phone?.includes(searchQuery) ||
      transfer.recipient_account?.includes(searchQuery) ||
      transfer.user_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transfer.user_name?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter =
      filterStatus === "all" ||
      transfer.status === filterStatus;

    return matchesSearch && matchesFilter;
  });

  const handleApproveTransfer = async (transferId) => {
    try {
      setProcessing(true);
      const response = await fetch(`/api/admin/transfers/${transferId}/approve`, {
        method: 'PATCH',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to approve transfer');
      }

      toast.success('Transfer approved successfully');
      setShowTransferDetails(false);
      fetchTransfers();
    } catch (error) {
      console.error('Error approving transfer:', error);
      toast.error(error.message || 'Failed to approve transfer');
    } finally {
      setProcessing(false);
    }
  };

  const handleBlockTransfer = async (transferId) => {
    const toastId = toast.warning(
      `Block this transfer?`,
      {
        description: "This action cannot be undone. The transfer will be marked as failed.",
        action: {
          label: "Block",
          onClick: async () => {
            toast.dismiss(toastId);
            try {
              setProcessing(true);
              const response = await fetch(`/api/admin/transfers/${transferId}/block`, {
                method: 'PATCH',
              });

              const data = await response.json();

              if (!response.ok) {
                throw new Error(data.error || 'Failed to block transfer');
              }

              toast.success('Transfer blocked successfully');
              setShowTransferDetails(false);
              fetchTransfers();
            } catch (error) {
              console.error('Error blocking transfer:', error);
              toast.error(error.message || 'Failed to block transfer');
            } finally {
              setProcessing(false);
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

  const getStatusBadge = (status) => {
    const badges = {
      pending: (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
          <Clock className="w-3 h-3" />
          Pending
        </span>
      ),
      completed: (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
          <CheckCircle2 className="w-3 h-3" />
          Approved
        </span>
      ),
      failed: (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
          <XCircle className="w-3 h-3" />
          Blocked
        </span>
      ),
      cancelled: (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
          <XCircle className="w-3 h-3" />
          Cancelled
        </span>
      ),
    };
    return badges[status] || badges.pending;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  const handleViewTransfer = (transfer) => {
    setSelectedTransfer(transfer);
    setShowTransferDetails(true);
  };

  // Get user currency for display
  const getUserCurrency = (transfer) => {
    return transfer.user_currency || 'USD';
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
                  <Send className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">Transfer Management</h1>
                  <p className="text-xs text-gray-500">Approve or block user transfers</p>
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
                    <p className="text-sm text-gray-600">Pending</p>
                    <p className="text-2xl font-bold text-yellow-600">
                      {transfers.filter((t) => t.status === 'pending').length}
                    </p>
                  </div>
                  <Clock className="w-8 h-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Approved</p>
                    <p className="text-2xl font-bold text-green-600">
                      {transfers.filter((t) => t.status === 'completed').length}
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
                    <p className="text-sm text-gray-600">Blocked</p>
                    <p className="text-2xl font-bold text-red-600">
                      {transfers.filter((t) => t.status === 'failed').length}
                    </p>
                  </div>
                  <XCircle className="w-8 h-8 text-red-600" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total</p>
                    <p className="text-2xl font-bold text-gray-900">{transfers.length}</p>
                  </div>
                  <Send className="w-8 h-8 text-blue-600" />
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
                    placeholder="Search by recipient, user, email, phone, or account..."
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
                    <option value="pending">Pending</option>
                    <option value="completed">Approved</option>
                    <option value="failed">Blocked</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="all">All</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Transfers List */}
          {loading ? (
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardContent className="p-8">
                <div className="text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
                  <p className="mt-4 text-gray-600">Loading transfers...</p>
                </div>
              </CardContent>
            </Card>
          ) : filteredTransfers.length === 0 ? (
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardContent className="p-8 text-center">
                <Send className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-900 font-semibold mb-1">No transfers found</p>
                <p className="text-sm text-gray-500">
                  {filterStatus === "all" 
                    ? "No transfers have been made yet"
                    : `No ${filterStatus} transfers found`}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredTransfers.map((transfer) => {
                const userCurrency = getUserCurrency(transfer);
                return (
                  <Card key={transfer.id} className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                              {transfer.recipient_name?.charAt(0) || '?'}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className="font-semibold text-gray-900">{transfer.recipient_name || 'Unknown'}</p>
                                {getStatusBadge(transfer.status)}
                              </div>
                              <p className="text-sm text-gray-500">
                                From: {transfer.user_name || transfer.user_email || 'Unknown User'}
                              </p>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 text-sm">
                            <div className="min-w-0">
                              <p className="text-xs text-gray-500">Amount</p>
                              <p className="font-semibold text-gray-900 truncate break-words">
                                {formatCurrencyUtil(Math.abs(transfer.amount), userCurrency)}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Method</p>
                              <p className="font-medium text-gray-700 capitalize">
                                {transfer.transfer_method || 'N/A'}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Date</p>
                              <p className="font-medium text-gray-700">
                                {formatDate(transfer.created_at)}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Recipient</p>
                              <p className="font-medium text-gray-700 text-xs">
                                {transfer.recipient_email || transfer.recipient_phone || transfer.recipient_account || 'N/A'}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 ml-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewTransfer(transfer)}
                            className="flex items-center gap-1"
                          >
                            <Eye className="w-4 h-4" />
                            View
                          </Button>
                          {transfer.status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleApproveTransfer(transfer.id)}
                                disabled={processing}
                                className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-1"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleBlockTransfer(transfer.id)}
                                disabled={processing}
                                className="flex items-center gap-1"
                              >
                                <XCircle className="w-4 h-4" />
                                Block
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Transfer Details Modal */}
      {showTransferDetails && selectedTransfer && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setShowTransferDetails(false)}>
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Send className="w-5 h-5 text-blue-600" />
                  Transfer Details
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowTransferDetails(false)}
                >
                  ×
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* Status */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <div className="mt-1">{getStatusBadge(selectedTransfer.status)}</div>
                </div>
                <div className="text-right min-w-0 max-w-[60%]">
                  <p className="text-sm text-gray-500">Amount</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1 break-words">
                    {formatCurrencyUtil(Math.abs(selectedTransfer.amount), getUserCurrency(selectedTransfer))}
                  </p>
                </div>
              </div>

              {/* User Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-600" />
                  From User
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500">Name</p>
                    <p className="text-sm font-medium">{selectedTransfer.user_name || 'N/A'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="text-sm font-medium">{selectedTransfer.user_email || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Recipient Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-600" />
                  Recipient
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500">Name</p>
                    <p className="text-sm font-medium">{selectedTransfer.recipient_name || 'N/A'}</p>
                  </div>
                  {selectedTransfer.recipient_email && (
                    <div className="space-y-1">
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        Email
                      </p>
                      <p className="text-sm font-medium">{selectedTransfer.recipient_email}</p>
                    </div>
                  )}
                  {selectedTransfer.recipient_phone && (
                    <div className="space-y-1">
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        Phone
                      </p>
                      <p className="text-sm font-medium">{selectedTransfer.recipient_phone}</p>
                    </div>
                  )}
                  {selectedTransfer.recipient_account && (
                    <div className="space-y-1">
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <CreditCard className="w-3 h-3" />
                        Account Number
                      </p>
                      <p className="text-sm font-medium">{selectedTransfer.recipient_account}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Transfer Details */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-blue-600" />
                  Transfer Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500">Transfer Method</p>
                    <p className="text-sm font-medium capitalize">{selectedTransfer.transfer_method || 'N/A'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Created At
                    </p>
                    <p className="text-sm font-medium">{formatDate(selectedTransfer.created_at)}</p>
                  </div>
                  {selectedTransfer.description && (
                    <div className="space-y-1 md:col-span-2">
                      <p className="text-xs text-gray-500">Description</p>
                      <p className="text-sm font-medium">{selectedTransfer.description}</p>
                    </div>
                  )}
                  {selectedTransfer.note && (
                    <div className="space-y-1 md:col-span-2">
                      <p className="text-xs text-gray-500">Note</p>
                      <p className="text-sm font-medium">{selectedTransfer.note}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              {selectedTransfer.status === 'pending' && (
                <div className="flex gap-3 pt-4 border-t">
                  <Button
                    onClick={() => handleApproveTransfer(selectedTransfer.id)}
                    disabled={processing}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Approve Transfer
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleBlockTransfer(selectedTransfer.id)}
                    disabled={processing}
                    className="flex-1"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Block Transfer
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default function TransfersManagementPage() {
  return (
    <AdminProtectedRoute>
      <TransfersManagementContent />
    </AdminProtectedRoute>
  );
}

