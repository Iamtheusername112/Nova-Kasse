"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  X,
  Calendar,
  Clock,
  DollarSign,
  User,
  Mail,
  Phone,
  CreditCard,
  FileText,
  Tag,
  MessageSquare,
  CheckCircle2,
  XCircle,
  Clock as ClockIcon,
  AlertCircle,
  ArrowUpRight,
  ArrowDownLeft,
  Receipt,
  Building2,
  Car,
  UtensilsCrossed,
  Gamepad2,
  Music,
  Film,
  Plane,
  Heart,
  Gift,
  Wifi,
  Zap,
  Fuel,
  Store,
  Banknote,
  PiggyBank,
  TrendingDown,
  Activity,
  BarChart3,
  PieChart,
  CircleDollarSign,
  ArrowRightCircle,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils/currency";

// Get transaction icon based on type and category
function getTransactionIcon(type, category) {
  const iconMap = {
    // Income/Deposit icons
    income: CircleDollarSign,
    deposit: CircleDollarSign,
    // Expense/Payment icons
    expense: TrendingDown,
    payment: CreditCard,
    // Transfer icons
    transfer: ArrowRightCircle,
    withdrawal: ArrowUpRight,
    request: ArrowDownLeft,
    // Category-specific icons
    food: UtensilsCrossed,
    transportation: Car,
    entertainment: Film,
    shopping: Store,
    utilities: Zap,
    healthcare: Heart,
    education: Building2,
    travel: Plane,
    gift: Gift,
    subscription: Music,
    gaming: Gamepad2,
    fuel: Fuel,
    internet: Wifi,
    phone: Phone,
    other: Receipt,
  };

  return iconMap[category?.toLowerCase()] || iconMap[type] || Receipt;
}

// Format date and time nicely
function formatDateTime(timestamp) {
  if (!timestamp) return "N/A";
  
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  // Format date
  const dateStr = date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Format time
  const timeStr = date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  // Relative time
  let relativeTime = "";
  if (diffMins < 1) {
    relativeTime = "Just now";
  } else if (diffMins < 60) {
    relativeTime = `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
  } else if (diffHours < 24) {
    relativeTime = `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  } else if (diffDays === 1) {
    relativeTime = "Yesterday";
  } else if (diffDays < 7) {
    relativeTime = `${diffDays} days ago`;
  } else {
    relativeTime = date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  }

  return {
    date: dateStr,
    time: timeStr,
    relative: relativeTime,
    full: `${dateStr} at ${timeStr}`,
  };
}

// Get status badge info
function getStatusInfo(status) {
  switch (status) {
    case "completed":
      return {
        label: "Completed",
        icon: CheckCircle2,
        className: "bg-green-100 text-green-700 border-green-300",
        iconClassName: "text-green-600",
      };
    case "pending":
      return {
        label: "Pending",
        icon: ClockIcon,
        className: "bg-yellow-100 text-yellow-700 border-yellow-300",
        iconClassName: "text-yellow-600",
      };
    case "failed":
      return {
        label: "Failed",
        icon: XCircle,
        className: "bg-red-100 text-red-700 border-red-300",
        iconClassName: "text-red-600",
      };
    case "cancelled":
      return {
        label: "Cancelled",
        icon: XCircle,
        className: "bg-gray-100 text-gray-700 border-gray-300",
        iconClassName: "text-gray-600",
      };
    default:
      return {
        label: status || "Unknown",
        icon: AlertCircle,
        className: "bg-gray-100 text-gray-700 border-gray-300",
        iconClassName: "text-gray-600",
      };
  }
}

// Get transaction type label
function getTransactionTypeLabel(type) {
  const labels = {
    transfer: "Transfer",
    deposit: "Deposit",
    withdrawal: "Withdrawal",
    payment: "Payment",
    income: "Income",
    expense: "Expense",
    request: "Money Request",
  };
  return labels[type] || type;
}

export default function TransactionDetailsModal({ transaction, isOpen, onClose, userCurrency = "USD" }) {
  if (!isOpen || !transaction) return null;

  const Icon = getTransactionIcon(transaction.type, transaction.category);
  const isCredit = transaction.type === "income" || transaction.type === "deposit";
  const isDebit =
    transaction.type === "expense" ||
    transaction.type === "payment" ||
    transaction.type === "transfer" ||
    transaction.type === "withdrawal" ||
    transaction.type === "request";
  const amount = parseFloat(transaction.amount || 0);
  const dateTime = formatDateTime(transaction.created_at);
  const statusInfo = getStatusInfo(transaction.status);

  // Determine if this is incoming or outgoing
  const isIncoming = isCredit;
  const isOutgoing = isDebit;

  return (
    <div
      className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <Card
        className="w-full max-w-lg bg-white shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader className="border-b sticky top-0 bg-white z-10">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-3">
              <div
                className={`w-12 h-12 rounded-xl ${
                  isCredit ? "bg-green-600" : "bg-gray-600"
                } flex items-center justify-center shadow-md`}
              >
                <Icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {getTransactionTypeLabel(transaction.type)}
                </h2>
                <p className="text-sm text-gray-500">{transaction.category || "Transaction"}</p>
              </div>
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Amount */}
          <div className="text-center py-4 border-b">
            <p className="text-sm text-gray-500 mb-2">Transaction Amount</p>
            <p
              className={`text-3xl font-bold ${
                isCredit ? "text-green-600" : isDebit ? "text-red-600" : "text-gray-900"
              }`}
            >
              {isCredit ? "+" : isDebit ? "-" : ""}
              {formatCurrency(Math.abs(amount), userCurrency)}
            </p>
            <div className={`mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full border text-sm font-medium ${statusInfo.className}`}>
              <statusInfo.icon className={`w-4 h-4 ${statusInfo.iconClassName}`} />
              <span>{statusInfo.label}</span>
            </div>
          </div>

          {/* Date and Time */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-gray-500" />
              Date & Time
            </h3>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Date:</span>
                <span className="text-sm font-medium text-gray-900">{dateTime.date}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Time:</span>
                <span className="text-sm font-medium text-gray-900">{dateTime.time}</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t">
                <span className="text-sm text-gray-600">Relative:</span>
                <span className="text-sm font-medium text-gray-900">{dateTime.relative}</span>
              </div>
            </div>
          </div>

          {/* Recipient/Sender Information */}
          {(transaction.recipient_name ||
            transaction.recipient_phone ||
            transaction.recipient_email ||
            transaction.recipient_account) && (
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <User className="w-5 h-5 text-gray-500" />
                {isOutgoing ? "Recipient" : "Sender"} Information
              </h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                {transaction.recipient_name && (
                  <div className="flex items-center gap-3">
                    <User className="w-4 h-4 text-gray-400" />
                    <div className="flex-1">
                      <p className="text-xs text-gray-500">Name</p>
                      <p className="text-sm font-medium text-gray-900">
                        {transaction.recipient_name}
                      </p>
                    </div>
                  </div>
                )}
                {transaction.recipient_phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <div className="flex-1">
                      <p className="text-xs text-gray-500">Phone</p>
                      <p className="text-sm font-medium text-gray-900">
                        {transaction.recipient_phone}
                      </p>
                    </div>
                  </div>
                )}
                {transaction.recipient_email && (
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <div className="flex-1">
                      <p className="text-xs text-gray-500">Email</p>
                      <p className="text-sm font-medium text-gray-900 break-all">
                        {transaction.recipient_email}
                      </p>
                    </div>
                  </div>
                )}
                {transaction.recipient_account && (
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-4 h-4 text-gray-400" />
                    <div className="flex-1">
                      <p className="text-xs text-gray-500">Account Number</p>
                      <p className="text-sm font-medium text-gray-900">
                        {transaction.recipient_account}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Transaction Details */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-gray-500" />
              Transaction Details
            </h3>
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              {transaction.description && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Description</p>
                  <p className="text-sm font-medium text-gray-900">{transaction.description}</p>
                </div>
              )}
              {transaction.category && (
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-gray-400" />
                  <div className="flex-1">
                    <p className="text-xs text-gray-500">Category</p>
                    <p className="text-sm font-medium text-gray-900 capitalize">
                      {transaction.category.replace(/_/g, " ")}
                    </p>
                  </div>
                </div>
              )}
              {transaction.transfer_method && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Transfer Method</p>
                  <p className="text-sm font-medium text-gray-900 capitalize">
                    {transaction.transfer_method}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Note */}
          {transaction.note && (
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-gray-500" />
                Note
              </h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{transaction.note}</p>
              </div>
            </div>
          )}

          {/* Transaction ID */}
          <div className="pt-4 border-t">
            <p className="text-xs text-gray-400 text-center">
              Transaction ID: {transaction.id}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

