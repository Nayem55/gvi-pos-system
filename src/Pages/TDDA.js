import React, { useState, useEffect } from "react";
import dayjs from "dayjs";
import * as XLSX from "xlsx";
import { toast } from "react-hot-toast";
import axios from "axios";
import AdminSidebar from "../Component/AdminSidebar";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const TDDAdminPanel = () => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(dayjs().format("YYYY-MM"));
  const [reportData, setReportData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);

  // For edit modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // For delete modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState(null);

  // For submission count
  const [selectedDateForCount, setSelectedDateForCount] = useState(dayjs().format("YYYY-MM-DD"));
  const [submissionsCount, setSubmissionsCount] = useState(null);
  const [isCounting, setIsCounting] = useState(false);

  // Fetch all users with TDDA records
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get(
          "http://175.29.181.245:5000/tdda/users"
        );
        setUsers(response.data);
      } catch (error) {
        console.error("Error fetching users:", error);
        toast.error("Failed to load users");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Generate report
  const generateReport = async () => {
    if (!selectedUser) {
      toast.error("Please select a user");
      return;
    }

    try {
      setIsGenerating(true);
      const response = await axios.get(
        "http://175.29.181.245:5000/tdda/admin-report",
        {
          params: {
            userId: selectedUser,
            month: selectedMonth,
          },
        }
      );

      // Fix summary.totalExpense if malformed
      const fixedData = response.data;
      if (
        !fixedData.summary.totalExpense ||
        isNaN(parseFloat(fixedData.summary.totalExpense))
      ) {
        fixedData.summary.totalExpense = fixedData.dailyExpenses.reduce(
          (sum, day) => {
            const hqExHqTotal = Object.values(day.hqExHq || {})
              .map((amount) => parseFloat(amount) || 0)
              .reduce((s, a) => s + a, 0);
            const transportTotal = Object.values(day.transport || {})
              .map((amount) => parseFloat(amount) || 0)
              .reduce((s, a) => s + a, 0);
            const hotelBill = parseFloat(day.hotelBill) || 0;
            return sum + hqExHqTotal + transportTotal + hotelBill;
          },
          0
        );
      }

      setReportData(fixedData);
      toast.success("Report generated successfully");
    } catch (error) {
      console.error("Error generating report:", error);
      toast.error(error.response?.data?.error || "Failed to generate report");
    } finally {
      setIsGenerating(false);
    }
  };

  // Open edit modal
  const openEditModal = (record) => {
    setEditForm({
      id: record.id,
      date: record.date,
      from: record.from,
      to: record.to,
      hqExHq: { ...record.hqExHq },
      transport: { ...record.transport },
      hotelBill: record.hotelBill,
      totalExpense: record.totalExpense,
      // Include other fields if needed
      name: reportData.userInfo.name,
      designation: reportData.userInfo.designation,
      area: reportData.userInfo.area,
      userId: selectedUser,
    });
    setEditModalOpen(true);
  };

  // Handle edit form change
  const handleEditChange = (field, value, subfield = null, subsubfield = null) => {
    setEditForm((prev) => {
      if (subfield && subsubfield) {
        return {
          ...prev,
          [field]: {
            ...prev[field],
            [subfield]: value,
          },
        };
      } else if (subfield) {
        return {
          ...prev,
          [field]: {
            ...prev[field],
            [subfield]: value,
          },
        };
      } else {
        return { ...prev, [field]: value };
      }
    });
  };

  // Calculate total for edit form
  const calculateEditTotal = () => {
    const hqExHqTotal = Object.values(editForm.hqExHq)
      .reduce((sum, v) => sum + (parseFloat(v) || 0), 0);
    const transportTotal = Object.values(editForm.transport)
      .reduce((sum, v) => sum + (parseFloat(v) || 0), 0);
    const hotel = parseFloat(editForm.hotelBill) || 0;
    const total = hqExHqTotal + transportTotal + hotel;
    setEditForm((prev) => ({ ...prev, totalExpense: total.toFixed(2) }));
  };

  // Save edited record
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    calculateEditTotal();

    const updatedData = {
      date: editForm.date,
      month: dayjs(editForm.date).format("YYYY-MM"),
      dailyExpense: {
        from: editForm.from,
        to: editForm.to,
        hqExHq: {
          hq: parseFloat(editForm.hqExHq.hq) || 0,
          exHq: parseFloat(editForm.hqExHq.exHq) || 0,
        },
        transport: {
          bus: parseFloat(editForm.transport.bus) || 0,
          cng: parseFloat(editForm.transport.cng) || 0,
          train: parseFloat(editForm.transport.train) || 0,
          other: parseFloat(editForm.transport.other) || 0,
        },
        hotelBill: parseFloat(editForm.hotelBill) || 0,
        totalExpense: parseFloat(editForm.totalExpense) || 0,
      },
      name: editForm.name,
      designation: editForm.designation,
      area: editForm.area,
      userId: editForm.userId,
    };

    try {
      setIsSaving(true);
      await axios.put(`http://175.29.181.245:5000/tdda/${editForm.id}`, updatedData);
      toast.success("Record updated successfully");
      setEditModalOpen(false);
      generateReport(); // Refresh report
    } catch (error) {
      console.error("Error updating record:", error);
      toast.error(error.response?.data?.error || "Failed to update record");
    } finally {
      setIsSaving(false);
    }
  };

  // Confirm delete
  const handleDelete = async () => {
    try {
      await axios.delete(`http://175.29.181.245:5000/tdda/${recordToDelete}`);
      toast.success("Record deleted successfully");
      setDeleteModalOpen(false);
      generateReport(); // Refresh report
    } catch (error) {
      console.error("Error deleting record:", error);
      toast.error("Failed to delete record");
    }
  };

  // Get submission count
  const getSubmissionCount = async () => {
    try {
      setIsCounting(true);
      const response = await axios.get("http://175.29.181.245:5000/tdda/count-by-date", {
        params: { date: selectedDateForCount }
      });
      setSubmissionsCount(response.data.count);
      toast.success("Count fetched successfully");
    } catch (error) {
      console.error("Error fetching count:", error);
      toast.error("Failed to fetch submission count");
    } finally {
      setIsCounting(false);
    }
  };

  // Export to Excel (existing)
  const exportToExcel = () => {
    // ... (keep existing code)
  };

  // Export to PDF (existing)
  const exportToPDF = () => {
    // ... (keep existing code)
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Admin Sidebar */}
      <AdminSidebar />

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-4 md:p-8">
        <div className="max-w-6xl mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
          {/* Panel Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-6 py-4">
            <h1 className="text-2xl font-bold text-white">TD/DA Admin Panel</h1>
          </div>

          {/* Filters Section */}
          <div className="p-6 border-b border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select User
                </label>
                <select
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  disabled={isLoading}
                >
                  <option value="">Select a user</option>
                  {users?.map((user) => (
                    <option key={user._id} value={user._id}>
                      {user.name} ({user.designation || user.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Month
                </label>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex items-end">
                <button
                  onClick={generateReport}
                  disabled={isGenerating || !selectedUser}
                  className={`w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md shadow-sm flex items-center justify-center ${
                    isGenerating || !selectedUser
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  }`}
                >
                  {isGenerating ? (
                    <>
                      <svg
                        className="animate-spin h-4 w-4 text-white mr-2"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Generating...
                    </>
                  ) : (
                    "Generate Report"
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Submission Count Section */}
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">TD/DA Submission Count by Date</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Date
                </label>
                <input
                  type="date"
                  value={selectedDateForCount}
                  onChange={(e) => setSelectedDateForCount(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={getSubmissionCount}
                  disabled={isCounting}
                  className={`w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-md shadow-sm flex items-center justify-center ${
                    isCounting ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  {isCounting ? (
                    <>
                      <svg
                        className="animate-spin h-4 w-4 text-white mr-2"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Counting...
                    </>
                  ) : (
                    "Get Count"
                  )}
                </button>
              </div>
              {submissionsCount !== null && (
                <div className="bg-blue-50 p-3 rounded-md shadow-sm">
                  <p className="text-sm text-gray-600">Number of Users Submitted</p>
                  <p className="font-medium text-gray-900">{submissionsCount}</p>
                </div>
              )}
            </div>
          </div>

          {/* Report Summary */}
          {reportData && (
            <div className="p-6 border-b border-gray-200">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-4">
                <h2 className="text-lg font-semibold text-blue-800 mb-3">
                  Report Summary
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white p-3 rounded-md shadow-sm">
                    <p className="text-sm text-gray-600">Employee Name</p>
                    <p className="font-medium text-gray-900">
                      {reportData.userInfo.name}
                    </p>
                  </div>
                  <div className="bg-white p-3 rounded-md shadow-sm">
                    <p className="text-sm text-gray-600">Designation</p>
                    <p className="font-medium text-gray-900">
                      {reportData.userInfo.designation}
                    </p>
                  </div>
                  <div className="bg-white p-3 rounded-md shadow-sm">
                    <p className="text-sm text-gray-600">Month</p>
                    <p className="font-medium text-gray-900">
                      {dayjs(reportData.userInfo.month).format("MMMM YYYY")}
                    </p>
                  </div>
                  <div className="bg-white p-3 rounded-md shadow-sm">
                    <p className="text-sm text-gray-600">Total Working Days</p>
                    <p className="font-medium text-gray-900">
                      {reportData.summary.totalWorkingDays}
                    </p>
                  </div>
                  <div className="bg-white p-3 rounded-md shadow-sm">
                    <p className="text-sm text-gray-600">Total Expense</p>
                    <p className="font-medium text-gray-900">
                      {parseFloat(reportData.summary.totalExpense || 0).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end relative">
                <button
                  onClick={() => setExportDropdownOpen(!exportDropdownOpen)}
                  className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md shadow-sm flex items-center justify-center"
                >
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  Export
                  <svg
                    className="w-4 h-4 ml-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {exportDropdownOpen && (
                  <div className="absolute top-12 right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10">
                    <div
                      className="py-1"
                      role="menu"
                      aria-orientation="vertical"
                    >
                      <button
                        onClick={() => {
                          exportToExcel();
                          setExportDropdownOpen(false);
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        role="menuitem"
                      >
                        Export to Excel
                      </button>
                      <button
                        onClick={() => {
                          exportToPDF();
                          setExportDropdownOpen(false);
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        role="menuitem"
                      >
                        Export to PDF
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Daily Expenses Table */}
          {reportData && (
            <div className="p-6">
              <div className="overflow-x-auto shadow-md rounded-lg">
                <table className="w-full">
                  <thead>
                    <tr className="bg-blue-600 text-white">
                      <th className="p-3 text-left">Date</th>
                      <th className="p-3 text-left" colSpan="2">
                        Visited Place
                      </th>
                      <th className="p-3 text-left">HQ</th>
                      <th className="p-3 text-left">Ex. HQ</th>
                      <th className="p-3 text-left" colSpan="4">
                        Transport Bill
                      </th>
                      <th className="p-3 text-left">Hotel Bill</th>
                      <th className="p-3 text-left">Total</th>
                      <th className="p-3 text-left">Actions</th>
                    </tr>
                    <tr className="bg-blue-500 text-white">
                      <th></th>
                      <th className="p-2 text-left">From</th>
                      <th className="p-2 text-left">To</th>
                      <th></th>
                      <th></th>
                      <th className="p-2 text-left">Bus</th>
                      <th className="p-2 text-left">CNG</th>
                      <th className="p-2 text-left">Train</th>
                      <th className="p-2 text-left">Other</th>
                      <th></th>
                      <th></th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.dailyExpenses.map((day, index) => (
                      <tr
                        key={day.id}
                        className={`${
                          index % 2 === 0 ? "bg-white" : "bg-gray-50"
                        } hover:bg-gray-100`}
                      >
                        <td className="p-3 border-b border-gray-200">
                          {day.date}
                        </td>
                        <td className="p-3 border-b border-gray-200">
                          {day.from}
                        </td>
                        <td className="p-3 border-b border-gray-200">
                          {day.to}
                        </td>
                        <td className="p-3 border-b border-gray-200">
                          {day.hqExHq?.hq
                            ? parseFloat(day.hqExHq.hq).toFixed(2)
                            : "-"}
                        </td>
                        <td className="p-3 border-b border-gray-200">
                          {day.hqExHq?.exHq
                            ? parseFloat(day.hqExHq.exHq).toFixed(2)
                            : "-"}
                        </td>
                        <td className="p-3 border-b border-gray-200">
                          {day.transport?.bus
                            ? parseFloat(day.transport.bus).toFixed(2)
                            : "-"}
                        </td>
                        <td className="p-3 border-b border-gray-200">
                          {day.transport?.cng
                            ? parseFloat(day.transport.cng).toFixed(2)
                            : "-"}
                        </td>
                        <td className="p-3 border-b border-gray-200">
                          {day.transport?.train
                            ? parseFloat(day.transport.train).toFixed(2)
                            : "-"}
                        </td>
                        <td className="p-3 border-b border-gray-200">
                          {day.transport?.other
                            ? parseFloat(day.transport.other).toFixed(2)
                            : "-"}
                        </td>
                        <td className="p-3 border-b border-gray-200">
                          {day.hotelBill
                            ? parseFloat(day.hotelBill).toFixed(2)
                            : "-"}
                        </td>
                        <td className="p-3 border-b border-gray-200 font-semibold">
                          {day.totalExpense
                            ? parseFloat(day.totalExpense).toFixed(2)
                            : "-"}
                        </td>
                        <td className="p-3 border-b border-gray-200">
                          <button
                            onClick={() => openEditModal(day)}
                            className="text-blue-600 hover:text-blue-800 mr-2"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => {
                              setRecordToDelete(day.id);
                              setDeleteModalOpen(true);
                            }}
                            className="text-red-600 hover:text-red-800"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {editModalOpen && editForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Edit TD/DA Record</h2>
            <form onSubmit={handleEditSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date</label>
                  <input
                    type="date"
                    value={editForm.date}
                    onChange={(e) => handleEditChange("date", e.target.value)}
                    className="w-full p-2 border rounded-md"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">From</label>
                    <input
                      type="text"
                      value={editForm.from}
                      onChange={(e) => handleEditChange("from", e.target.value)}
                      className="w-full p-2 border rounded-md"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">To</label>
                    <input
                      type="text"
                      value={editForm.to}
                      onChange={(e) => handleEditChange("to", e.target.value)}
                      className="w-full p-2 border rounded-md"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">HQ</label>
                    <input
                      type="number"
                      value={editForm.hqExHq.hq}
                      onChange={(e) => handleEditChange("hqExHq", e.target.value, "hq")}
                      onBlur={calculateEditTotal}
                      className="w-full p-2 border rounded-md"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Ex-HQ</label>
                    <input
                      type="number"
                      value={editForm.hqExHq.exHq}
                      onChange={(e) => handleEditChange("hqExHq", e.target.value, "exHq")}
                      onBlur={calculateEditTotal}
                      className="w-full p-2 border rounded-md"
                      min="0"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Bus</label>
                    <input
                      type="number"
                      value={editForm.transport.bus}
                      onChange={(e) => handleEditChange("transport", e.target.value, "bus")}
                      onBlur={calculateEditTotal}
                      className="w-full p-2 border rounded-md"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">CNG</label>
                    <input
                      type="number"
                      value={editForm.transport.cng}
                      onChange={(e) => handleEditChange("transport", e.target.value, "cng")}
                      onBlur={calculateEditTotal}
                      className="w-full p-2 border rounded-md"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Train</label>
                    <input
                      type="number"
                      value={editForm.transport.train}
                      onChange={(e) => handleEditChange("transport", e.target.value, "train")}
                      onBlur={calculateEditTotal}
                      className="w-full p-2 border rounded-md"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Other</label>
                    <input
                      type="number"
                      value={editForm.transport.other}
                      onChange={(e) => handleEditChange("transport", e.target.value, "other")}
                      onBlur={calculateEditTotal}
                      className="w-full p-2 border rounded-md"
                      min="0"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Hotel Bill</label>
                  <input
                    type="number"
                    value={editForm.hotelBill}
                    onChange={(e) => handleEditChange("hotelBill", e.target.value)}
                    onBlur={calculateEditTotal}
                    className="w-full p-2 border rounded-md"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Total Expense</label>
                  <input
                    type="text"
                    value={editForm.totalExpense}
                    readOnly
                    className="w-full p-2 border rounded-md bg-gray-100"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50"
                >
                  {isSaving ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-sm w-full">
            <h2 className="text-xl font-bold mb-4">Confirm Deletion</h2>
            <p className="mb-6">Are you sure you want to delete this record? This action cannot be undone.</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDeleteModalOpen(false)}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TDDAdminPanel;