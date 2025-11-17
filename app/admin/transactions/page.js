"use client";

import { useState, useEffect } from "react";
import AdminProtectedRoute from "@/components/auth/AdminProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Search,
  User,
  Plus,
  Minus,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  MessageSquare,
  CheckCircle2,
  XCircle
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useUsers } from "@/lib/hooks/useUsers";
import LoadingScreen from "@/components/ui/loading-screen";

function TransactionsManagementContent() {
  const router = useRouter();
  const { users, loading: usersLoading } = useUsers();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [showCreditDebitModal, setShowCreditDebitModal] = useState(false);
  const [transactionType, setTransactionType] = useState("credit"); // credit or debit
  const [transactionData, setTransactionData] = useState({
    amount: "",
    description: "",
    note: "",
    category: "admin_adjustment",
    transactionDate: "",
    transactionTime: ""
  });
  const [processing, setProcessing] = useState(false);

  // Filter users for search
  const filteredUsers = (users || []).filter((user) => {
    if (!user || !user.id) return false;
    const query = searchQuery.toLowerCase();
    return (
      !searchQuery ||
      user.email?.toLowerCase().includes(query) ||
      user.full_name?.toLowerCase().includes(query) ||
      user.account_number?.includes(query) ||
      user.phone?.includes(query)
    );
  });

  const handleOpenCreditDebit = (user, type) => {
    setSelectedUser(user);
    setTransactionType(type);
    
    // Set default date/time to current date/time
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const timeStr = now.toTimeString().split(' ')[0].slice(0, 5); // HH:MM
    
    setTransactionData({
      amount: "",
      description: type === "credit" ? "Account Credit" : "Account Debit",
      note: "",
      category: "admin_adjustment",
      transactionDate: dateStr,
      transactionTime: timeStr
    });
    setShowCreditDebitModal(true);
  };

  const handleCloseModal = () => {
    setShowCreditDebitModal(false);
    setSelectedUser(null);
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0].slice(0, 5);
    setTransactionData({
      amount: "",
      description: "",
      note: "",
      category: "admin_adjustment",
      transactionDate: dateStr,
      transactionTime: timeStr
    });
  };

  const validateForm = () => {
    const amount = parseFloat(transactionData.amount);
    
    if (!transactionData.amount || isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount greater than 0");
      return false;
    }

    if (!transactionData.description || transactionData.description.trim() === "") {
      toast.error("Please enter a description");
      return false;
    }

    if (!transactionData.transactionDate) {
      toast.error("Please select a transaction date");
      return false;
    }

    if (!transactionData.transactionTime) {
      toast.error("Please select a transaction time");
      return false;
    }

    // Validate date is not in the future (optional - you can remove this if you want to allow future dates)
    const selectedDateTime = new Date(`${transactionData.transactionDate}T${transactionData.transactionTime}`);
    const now = new Date();
    if (selectedDateTime > now) {
      toast.error("Transaction date/time cannot be in the future");
      return false;
    }

    return true;
  };

  const handleSubmitTransaction = async () => {
    if (!validateForm()) return;

    if (!selectedUser || !selectedUser.id) {
      toast.error("No user selected");
      return;
    }

    // Validate user ID
    const userId = String(selectedUser.id).trim();
    if (!userId || userId === 'undefined' || userId === 'null') {
      toast.error("Invalid user ID. Please select a user again.");
      console.error("Invalid user ID:", selectedUser);
      return;
    }

    setProcessing(true);

    try {
      const amount = parseFloat(transactionData.amount);
      
      console.log("Submitting transaction:", {
        user_id: userId,
        user: selectedUser,
        type: transactionType === "credit" ? "deposit" : "withdrawal",
        amount,
      });

      // Combine date and time into ISO timestamp
      const transactionTimestamp = new Date(`${transactionData.transactionDate}T${transactionData.transactionTime}`).toISOString();

      const response = await fetch("/api/admin/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: userId,
          type: transactionType === "credit" ? "deposit" : "withdrawal",
          amount: amount, // Send positive amount, API will handle sign based on type
          description: transactionData.description,
          note: transactionData.note || null,
          category: transactionData.category,
          status: "completed",
          created_at: transactionTimestamp, // Custom timestamp
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to process transaction");
      }

      toast.success(
        `${transactionType === "credit" ? "Credited" : "Debited"} $${amount.toFixed(2)} ${transactionType === "credit" ? "to" : "from"} ${selectedUser.full_name || selectedUser.email}'s account`
      );

      handleCloseModal();
    } catch (error) {
      console.error("Transaction error:", error);
      toast.error(error.message || "Failed to process transaction");
    } finally {
      setProcessing(false);
    }
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
                <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">Transaction Management</h1>
                  <p className="text-xs text-gray-500">Credit and debit user accounts</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          {/* Search Users */}
          <Card className="mb-6 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="w-5 h-5" />
                Search User
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, email, phone, or account number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Users List */}
              {searchQuery && (
                <div className="mt-4 max-h-96 overflow-y-auto">
                  {usersLoading ? (
                    <div className="text-center py-4">
                      <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent"></div>
                      <p className="mt-2 text-sm text-gray-600">Loading users...</p>
                    </div>
                  ) : filteredUsers.length === 0 ? (
                    <div className="text-center py-4 text-gray-500">
                      <User className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                      <p>No users found</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredUsers.map((user) => (
                        <div
                          key={user.id}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                          onClick={() => {
                            setSelectedUser(user);
                            setSearchQuery("");
                          }}
                        >
                          <div className="flex items-center gap-3">
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
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {user.full_name || "No Name"}
                              </p>
                              <p className="text-xs text-gray-500">{user.email}</p>
                              {user.account_number && (
                                <p className="text-xs text-gray-400">
                                  Account: ****{user.account_number.slice(-4)}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-green-600 border-green-600 hover:bg-green-50"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenCreditDebit(user, "credit");
                              }}
                            >
                              <Plus className="w-4 h-4 mr-1" />
                              Credit
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 border-red-600 hover:bg-red-50"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenCreditDebit(user, "debit");
                              }}
                            >
                              <Minus className="w-4 h-4 mr-1" />
                              Debit
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Selected User Info */}
          {selectedUser && !showCreditDebitModal && (
            <Card className="mb-6 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Selected User</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xl">
                      {selectedUser.full_name
                        ? selectedUser.full_name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()
                            .slice(0, 2)
                        : selectedUser.email?.[0]?.toUpperCase() || "U"}
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-gray-900">
                        {selectedUser.full_name || "No Name"}
                      </p>
                      <p className="text-sm text-gray-500">{selectedUser.email}</p>
                      {selectedUser.account_number && (
                        <p className="text-xs text-gray-400 mt-1">
                          Account: {selectedUser.account_number}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="lg"
                      className="bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => handleOpenCreditDebit(selectedUser, "credit")}
                    >
                      <Plus className="w-5 h-5 mr-2" />
                      Credit Account
                    </Button>
                    <Button
                      size="lg"
                      variant="destructive"
                      onClick={() => handleOpenCreditDebit(selectedUser, "debit")}
                    >
                      <Minus className="w-5 h-5 mr-2" />
                      Debit Account
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Credit/Debit Modal */}
      {showCreditDebitModal && selectedUser && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={handleCloseModal}>
          <Card className="w-full max-w-md bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  {transactionType === "credit" ? (
                    <>
                      <TrendingUp className="w-5 h-5 text-green-600" />
                      Credit Account
                    </>
                  ) : (
                    <>
                      <TrendingDown className="w-5 h-5 text-red-600" />
                      Debit Account
                    </>
                  )}
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={handleCloseModal}>
                  <XCircle className="w-5 h-5" />
                </Button>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                {selectedUser.full_name || selectedUser.email}
              </p>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Amount <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={transactionData.amount}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === "" || (!isNaN(value) && parseFloat(value) >= 0)) {
                        setTransactionData({ ...transactionData, amount: value });
                      }
                    }}
                    placeholder="0.00"
                    className="w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Description <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={transactionData.description}
                  onChange={(e) =>
                    setTransactionData({ ...transactionData, description: e.target.value })
                  }
                  placeholder="e.g., Account Credit, Refund, etc."
                  className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Category</label>
                <select
                  value={transactionData.category}
                  onChange={(e) =>
                    setTransactionData({ ...transactionData, category: e.target.value })
                  }
                  className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="admin_adjustment">Admin Adjustment</option>
                  <option value="refund">Refund</option>
                  <option value="correction">Correction</option>
                  <option value="bonus">Bonus</option>
                  <option value="fee">Fee</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Note (Optional)</label>
                <textarea
                  value={transactionData.note}
                  onChange={(e) =>
                    setTransactionData({ ...transactionData, note: e.target.value })
                  }
                  placeholder="Additional notes about this transaction..."
                  rows={3}
                  className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              {/* Date and Time Selection */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Transaction Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={transactionData.transactionDate}
                    onChange={(e) =>
                      setTransactionData({ ...transactionData, transactionDate: e.target.value })
                    }
                    max={new Date().toISOString().split('T')[0]} // Prevent future dates
                    className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Transaction Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={transactionData.transactionTime}
                    onChange={(e) =>
                      setTransactionData({ ...transactionData, transactionTime: e.target.value })
                    }
                    className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleCloseModal}
                  disabled={processing}
                >
                  Cancel
                </Button>
                <Button
                  className={`flex-1 ${
                    transactionType === "credit"
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-red-600 hover:bg-red-700"
                  } text-white`}
                  onClick={handleSubmitTransaction}
                  disabled={processing}
                >
                  {processing ? (
                    <>
                      <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      {transactionType === "credit" ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Credit Account
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4 mr-2" />
                          Debit Account
                        </>
                      )}
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default function TransactionsManagementPage() {
  return (
    <AdminProtectedRoute>
      <TransactionsManagementContent />
    </AdminProtectedRoute>
  );
}

