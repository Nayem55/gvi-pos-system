import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import dayjs from "dayjs";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf/dist/jspdf.umd.min.js";
import "jspdf-autotable";
import autoTable from "jspdf-autotable";
import AdminSidebar from "../Component/AdminSidebar";
import { toast } from "react-hot-toast";

const StockTransactionsReport = () => {
  const user = JSON.parse(localStorage.getItem("pos-user"));
  const [selectedOutlet, setSelectedOutlet] = useState(user.outlet || "");
  const [outletSearch, setOutletSearch] = useState(user.outlet || "");
  const [showOutletDropdown, setShowOutletDropdown] = useState(false);
  const [outlets, setOutlets] = useState([]);
  const outletDropdownRef = useRef(null);
  const [exportDropdown, setExportDropdown] = useState(false);
  const [selectedType, setSelectedType] = useState("primary");
  const [dateRange, setDateRange] = useState({
    start: dayjs().startOf("month").format("YYYY-MM-DD"),
    end: dayjs().endOf("month").format("YYYY-MM-DD"),
  });
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [error, setError] = useState(null);
  const [editingTxn, setEditingTxn] = useState(null);
  const [editForm, setEditForm] = useState({
    quantity: "",
    type: "",
    dp: "",
    tp: "",
  });

  useEffect(() => {
    fetchOutlets();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        outletDropdownRef.current &&
        !outletDropdownRef.current.contains(event.target)
      ) {
        setShowOutletDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchOutlets = async () => {
    try {
      const response = await axios.get("http://175.29.181.245:5000/get-outlets");
      setOutlets(response.data);
    } catch (error) {
      console.error("Error fetching outlets:", error);
    }
  };

  const fetchReportData = async () => {
    if (!selectedOutlet) return;
    setLoading(true);
    setError(null);

    try {
      const params = {
        outlet: selectedOutlet,
        startDate: dayjs(dateRange.start).format("YYYY-MM-DD HH:mm:ss"),
        endDate: dayjs(dateRange.end).format("YYYY-MM-DD HH:mm:ss"),
      };
      if (selectedType) params.type = selectedType;

      const response = await axios.get(
        "http://175.29.181.245:5000/detailed-stock-transactions",
        { params }
      );

      if (response.data?.success) {
        setReportData(response.data.data);
      } else {
        throw new Error(response.data?.message || "Invalid response format");
      }
    } catch (error) {
      console.error("Fetch error:", error);
      let errorMessage = "Failed to load report data";
      if (error.response) {
        errorMessage =
          error.response.data?.message ||
          `Server error: ${error.response.status}`;
      }
      setError(errorMessage);
      setReportData(null);
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = () => {
    if (!reportData) return;

    const excelData = [
      [`Outlet: ${selectedOutlet}`],
      [
        `Period: ${dayjs(dateRange.start).format("DD-MM-YY")} to ${dayjs(
          dateRange.end
        ).format("DD-MM-YY")}`,
      ],
      [],
      ["Date", "Product", "Barcode", "Type", "Quantity", "Unit DP", "Unit TP", "Total DP", "Total TP", "Created By"],
    ];

    reportData.forEach((txn) => {
      const dp = isNaN(txn.dp) || txn.dp == null ? 0 : Number(txn.dp);
      const tp = isNaN(txn.tp) || txn.tp == null ? 0 : Number(txn.tp);
      excelData.push([
        dayjs(txn.date).format("DD-MM-YY"),
        txn.productName,
        txn.barcode,
        txn.type,
        txn.quantity,
        dp.toFixed(2),
        tp.toFixed(2),
        (txn.quantity * dp).toFixed(2),
        (txn.quantity * tp).toFixed(2),
        txn.user,
      ]);
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(excelData);
    XLSX.utils.book_append_sheet(wb, ws, "Stock Transactions");
    XLSX.writeFile(
      wb,
      `Stock_Transactions_${selectedOutlet}_${dateRange.start}.xlsx`
    );
  };

  const exportToPDF = () => {
    if (!reportData) return;

    const doc = new jsPDF({ orientation: "landscape" });
    const headers = [["Date", "Product", "Barcode", "Type", "Quantity", "Unit DP", "Unit TP", "Total DP", "Total TP", "Created By"]];

    const data = reportData.map((txn) => {
      const dp = isNaN(txn.dp) || txn.dp == null ? 0 : Number(txn.dp);
      const tp = isNaN(txn.tp) || txn.tp == null ? 0 : Number(txn.tp);
      return [
        dayjs(txn.date).format("DD-MM-YY"),
        txn.productName,
        txn.barcode,
        txn.type,
        txn.quantity,
        dp.toFixed(2),
        tp.toFixed(2),
        (txn.quantity * dp).toFixed(2),
        (txn.quantity * tp).toFixed(2),
        txn.user,
      ];
    });

    autoTable(doc, {
      head: headers,
      body: data,
      startY: 20,
      styles: { fontSize: 8 },
    });

    doc.save(`Stock_Transactions_${selectedOutlet || "all"}_${dayjs().format("YYYYMMDD")}.pdf`);
  };

  const handleEdit = (txn) => {
    setEditForm({
      quantity: txn.quantity,
      type: txn.type,
      dp: txn.dp,
      tp: txn.tp,
    });
    setEditingTxn(txn);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveEdit = async () => {
    try {
      await axios.put(
        `http://175.29.181.245:5000/stock-transaction/${editingTxn._id}`,
        editForm
      );
      toast.success("Transaction updated successfully!");
      setEditingTxn(null);
      fetchReportData();
    } catch (error) {
      toast.error("Failed to update transaction");
      console.error("Error:", error);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this transaction?")) {
      return;
    }
    try {
      await axios.delete(`http://175.29.181.245:5000/stock-transaction/${id}`);
      toast.success("Transaction deleted successfully!");
      fetchReportData();
    } catch (error) {
      toast.error("Failed to delete transaction");
      console.error("Error:", error);
    }
  };

  const movement = reportData ? reportData.reduce(
    (acc, txn) => {
      const dp = isNaN(txn.dp) || txn.dp == null ? 0 : Number(txn.dp);
      const valueDP = txn.quantity * dp;
      switch (txn.type) {
        case "opening":
          acc.openingQty += txn.quantity;
          acc.openingValue += valueDP;
          break;
        case "primary":
          acc.primaryQty += txn.quantity;
          acc.primaryValue += valueDP;
          break;
        case "secondary":
          acc.secondaryQty += txn.quantity;
          acc.secondaryValue += valueDP;
          break;
        case "market return":
          acc.marketReturnQty += txn.quantity;
          acc.marketReturnValue += valueDP;
          break;
        case "office return":
          acc.officeReturnQty += txn.quantity;
          acc.officeReturnValue += valueDP;
          break;
        default:
          break;
      }
      return acc;
    },
    {
      openingQty: 0,
      openingValue: 0,
      primaryQty: 0,
      primaryValue: 0,
      secondaryQty: 0,
      secondaryValue: 0,
      marketReturnQty: 0,
      marketReturnValue: 0,
      officeReturnQty: 0,
      officeReturnValue: 0,
    }
  ) : null;

  const filteredOutlets = outlets.filter((outlet) =>
    outlet?.toLowerCase().includes(outletSearch?.toLowerCase())
  );

  const handleOutletSelect = (outlet) => {
    setSelectedOutlet(outlet);
    setOutletSearch(outlet);
    setShowOutletDropdown(false);
  };

  return (
    <div className="flex">
      {!user?.outlet && <AdminSidebar />}

      <div className="mx-auto px-6 py-8 w-full md:w-[80%]">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-gray-800">
            Stock Transactions Breakdown
          </h2>
          <div className="relative">
            <button
              onClick={() => setExportDropdown(!exportDropdown)}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded flex items-center"
              disabled={!reportData}
            >
              Export
              <svg
                className="w-4 h-4 ml-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {exportDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10">
                <div className="py-1">
                  <button
                    onClick={() => {
                      exportToExcel();
                      setExportDropdown(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Export to Excel
                  </button>
                  <button
                    onClick={() => {
                      exportToPDF();
                      setExportDropdown(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Export to PDF
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          {!user?.outlet && (
            <div className="relative w-full max-w-xs" ref={outletDropdownRef}>
              <input
                type="text"
                value={outletSearch}
                onChange={(e) => {
                  setOutletSearch(e.target.value);
                  setShowOutletDropdown(true);
                }}
                onFocus={() => setShowOutletDropdown(true)}
                placeholder="Search Outlet..."
                className="w-full px-4 py-2 border rounded-md shadow-sm"
                aria-label="Search Outlet"
              />
              {showOutletDropdown && filteredOutlets.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {filteredOutlets.map((outlet, index) => (
                    <div
                      key={index}
                      onClick={() => handleOutletSelect(outlet)}
                      className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                      role="option"
                      aria-selected={selectedOutlet === outlet}
                    >
                      {outlet}
                    </div>
                  ))}
                </div>
              )}
              {showOutletDropdown && outletSearch && filteredOutlets.length === 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg px-4 py-2 text-sm text-gray-500">
                  No outlets found
                </div>
              )}
            </div>
          )}
          <div className="flex flex-col md:flex-row gap-2">
            <div className="flex items-center gap-2">
              <label className="text-sm">Type:</label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-4 py-2 border rounded-md shadow-sm"
              >
                <option value="">All Types</option>
                <option value="opening">Opening</option>
                <option value="primary">Primary</option>
                <option value="secondary">Secondary</option>
                <option value="market return">Market Return</option>
                <option value="office return">Office Return</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm">From:</label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) =>
                  setDateRange({ ...dateRange, start: e.target.value })
                }
                className="border rounded px-4 py-2"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm">To:</label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) =>
                  setDateRange({ ...dateRange, end: e.target.value })
                }
                className="border rounded px-4 py-2"
              />
            </div>
            <button
              onClick={fetchReportData}
              className="bg-blue-900 hover:bg-blue-700 text-white px-4 py-2 rounded"
              disabled={!selectedOutlet}
            >
              Apply Filter
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 border-l-4 border-red-500">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {!loading && movement && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-white border-l-4 border-purple-600 p-4 rounded shadow">
              <p className="text-sm text-gray-600">Opening (DP)</p>
              <p className="text-2xl font-semibold text-purple-700">
                {movement.openingValue.toFixed(2)}
              </p>
            </div>
            <div className="bg-white border-l-4 border-blue-600 p-4 rounded shadow">
              <p className="text-sm text-gray-600">Primary (DP)</p>
              <p className="text-2xl font-semibold text-blue-700">
                {movement.primaryValue.toFixed(2)}
              </p>
            </div>
            <div className="bg-white border-l-4 border-orange-600 p-4 rounded shadow">
              <p className="text-sm text-gray-600">Secondary (DP)</p>
              <p className="text-2xl font-semibold text-orange-700">
                {movement.secondaryValue.toFixed(2)}
              </p>
            </div>
            <div className="bg-white border-l-4 border-green-600 p-4 rounded shadow">
              <p className="text-sm text-gray-600">Market Return (DP)</p>
              <p className="text-2xl font-semibold text-green-700">
                {movement.marketReturnValue.toFixed(2)}
              </p>
            </div>
            <div className="bg-white border-l-4 border-yellow-600 p-4 rounded shadow">
              <p className="text-sm text-gray-600">Office Return (DP)</p>
              <p className="text-2xl font-semibold text-yellow-700">
                {movement.officeReturnValue.toFixed(2)}
              </p>
            </div>
          </div>
        )}

        {loading && (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        )}

        {!loading && reportData && (
          <div className="bg-white p-4 rounded shadow-md mb-6">
            <h3 className="text-lg font-bold mb-4">Transaction Details</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full border">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border p-2">Date</th>
                    <th className="border p-2">Product</th>
                    <th className="border p-2">Barcode</th>
                    <th className="border p-2">Type</th>
                    <th className="border p-2">Quantity</th>
                    <th className="border p-2">Unit DP</th>
                    <th className="border p-2">Unit TP</th>
                    <th className="border p-2">Total DP</th>
                    <th className="border p-2">Total TP</th>
                    <th className="border p-2">Created By</th>
                    <th className="border p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.map((txn, index) => {
                    const dp = isNaN(txn.dp) || txn.dp == null ? 0 : Number(txn.dp);
                    const tp = isNaN(txn.tp) || txn.tp == null ? 0 : Number(txn.tp);
                    return (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="border p-2">
                          {dayjs(txn.date).format("DD-MM-YY")}
                        </td>
                        <td className="border p-2">{txn.productName}</td>
                        <td className="border p-2">{txn.barcode}</td>
                        <td className="border p-2 capitalize">
                          {txn.type.split(" ").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ")}
                        </td>
                        <td className="border p-2">{txn.quantity}</td>
                        <td className="border p-2">{dp.toFixed(2)}</td>
                        <td className="border p-2">{tp.toFixed(2)}</td>
                        <td className="border p-2">{(txn.quantity * dp).toFixed(2)}</td>
                        <td className="border p-2">{(txn.quantity * tp).toFixed(2)}</td>
                        <td className="border p-2">{txn.user}</td>
                        <td className="border p-2">
                          {user.role === "super admin" && txn.type !== "secondary" && (
                            <>
                              <button
                                onClick={() => handleEdit(txn)}
                                className="bg-blue-600 text-white px-2 py-1 rounded mr-2"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(txn._id)}
                                className="bg-red-600 text-white px-2 py-1 rounded"
                              >
                                Delete
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!loading && !reportData && selectedOutlet && (
          <div className="text-center py-8 text-gray-500">
            No data available for selected period
          </div>
        )}

        {editingTxn && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
              <h3 className="text-lg font-bold mb-4">Edit Stock Transaction</h3>
              <form>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Quantity</label>
                  <input
                    type="number"
                    name="quantity"
                    value={editForm.quantity}
                    onChange={handleEditChange}
                    className="w-full p-2 border border-gray-300 rounded"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">DP</label>
                  <input
                    type="number"
                    name="dp"
                    step="0.01"
                    value={editForm.dp}
                    onChange={handleEditChange}
                    className="w-full p-2 border border-gray-300 rounded"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">TP</label>
                  <input
                    type="number"
                    name="tp"
                    step="0.01"
                    value={editForm.tp}
                    onChange={handleEditChange}
                    className="w-full p-2 border border-gray-300 rounded"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Type</label>
                  <select
                    name="type"
                    value={editForm.type}
                    onChange={handleEditChange}
                    className="w-full p-2 border border-gray-300 rounded"
                  >
                    <option value="opening">Opening</option>
                    <option value="primary">Primary</option>
                    <option value="secondary">Secondary</option>
                    <option value="market return">Market Return</option>
                    <option value="office return">Office Return</option>
                  </select>
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingTxn(null)}
                    className="bg-gray-600 text-white px-4 py-2 rounded"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveEdit}
                    className="bg-green-600 text-white px-4 py-2 rounded"
                  >
                    Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StockTransactionsReport;