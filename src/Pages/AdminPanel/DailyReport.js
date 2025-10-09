import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useLocation } from "react-router-dom";
import dayjs from "dayjs";
import AdminSidebar from "../../Component/AdminSidebar";
import { toast } from "react-hot-toast";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const DailyReport = () => {
  const { userId } = useParams();
  const { search } = useLocation();

  // Extract query parameters
  const queryParams = new URLSearchParams(search);
  const initialMonth = queryParams.get("month") || dayjs().format("YYYY-MM");
  const initialStartDate = queryParams.get("startDate") || "";
  const initialEndDate = queryParams.get("endDate") || "";

  // UI Input States
  const [selectedMonth, setSelectedMonth] = useState(initialMonth);
  const [startDate, setStartDate] = useState(initialStartDate);
  const [endDate, setEndDate] = useState(initialEndDate);

  // Filtered Values (used when button is clicked)
  const [filterMonth, setFilterMonth] = useState(initialMonth);
  const [filterStartDate, setFilterStartDate] = useState(initialStartDate);
  const [filterEndDate, setFilterEndDate] = useState(initialEndDate);

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userLoading, setUserLoading] = useState(false);
  const [editingReport, setEditingReport] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [user, setUser] = useState(null);
  const [viewedUser, setViewedUser] = useState(null);
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);

  useEffect(() => {
    // Fetch current user details to check role
    const fetchUserDetails = async () => {
      try {
        const storedUser = JSON.parse(localStorage.getItem("pos-user"));
        if (storedUser) {
          setUser(storedUser);
        }
      } catch (error) {
        console.error("Error fetching user details:", error);
        toast.error("Failed to load user details");
      }
    };

    const fetchViewedUser = async () => {
      try {
        setUserLoading(true);
        const response = await axios.get(
          `http://175.29.181.245:5000/getUser/${userId}`
        );
        setViewedUser(response.data);
      } catch (error) {
        console.error("Error fetching viewed user details:", error);
        toast.error("Failed to load viewed user details");
      } finally {
        setUserLoading(false);
      }
    };

    fetchUserDetails();
    fetchViewedUser();
  }, [userId]);

  useEffect(() => {
    fetchDailyReports();
  }, [userId, filterMonth, filterStartDate, filterEndDate]);

  const fetchDailyReports = async () => {
    try {
      setLoading(true);
      let params = {};

      if (filterStartDate && filterEndDate) {
        params.startDate = filterStartDate;
        params.endDate = filterEndDate;
      } else {
        params.month = filterMonth;
      }

      const response = await axios.get(
        `http://175.29.181.245:5000/sales-reports/${userId}`,
        { params }
      );
      setReports(
        Array.isArray(response.data) ? response.data : [response.data]
      );
    } catch (error) {
      console.error("Error fetching daily reports:", error);
      toast.error("Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  const handleEditReport = (report) => {
    const productsWithOriginalValues = report.products.map((product) => ({
      ...product,
      originalQuantity: product.quantity,
      originalDP: product.quantity ? product.dp / product.quantity : 0,
      originalTP: product.quantity ? product.tp / product.quantity : 0,
      originalMRP: product.quantity ? product.mrp / product.quantity : 0,
    }));

    setEditingReport({
      ...report,
      products: productsWithOriginalValues,
    });
    setIsEditing(true);
  };

  const handleUpdateReport = async (e) => {
    e.preventDefault();
    if (!editingReport) return;

    try {
      const updatedReport = {
        ...editingReport,
        updatedAt: new Date().toISOString(),
      };

      await axios.put(
        `http://175.29.181.245:5000/update-sales-report/${editingReport._id}`,
        updatedReport
      );

      toast.success("Report and stock updated successfully");
      fetchDailyReports();
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating report:", error);
      toast.error(error.response?.data?.message || "Failed to update report");
    }
  };

  const handleDeleteReport = async (reportId) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this report? This will restore the stock quantities."
      )
    )
      return;

    try {
      const outlet = viewedUser?.outlet;
      if (!outlet) {
        throw new Error("Outlet information not available");
      }

      const reportResponse = await axios.get(
        `http://175.29.181.245:5000/sales-reports/report/${reportId}`
      );
      const report = reportResponse.data;

      if (!Array.isArray(report.products)) {
        throw new Error(
          "Invalid report: products array missing or not iterable"
        );
      }

      await axios.delete(
        `http://175.29.181.245:5000/delete-sales-report/${reportId}`
      );

      toast.success(
        "Report deleted and stock quantities restored successfully"
      );
      fetchDailyReports();
    } catch (error) {
      console.error("Error deleting report:", error);
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to delete report"
      );
    }
  };

  const handleProductChange = (index, field, value) => {
    const updatedProducts = [...editingReport.products];
    const product = { ...updatedProducts[index] };

    if (field === "quantity") {
      const newQuantity = parseInt(value) || 0;
      const currentUnitDP = product.quantity
        ? product.dp / product.quantity
        : 0;
      const currentUnitTP = product.quantity
        ? product.tp / product.quantity
        : 0;
      const currentUnitMRP = product.quantity
        ? product.mrp / product.quantity
        : 0;
      product.quantity = newQuantity;
      product.dp = newQuantity * currentUnitDP;
      product.tp = newQuantity * currentUnitTP;
      product.mrp = newQuantity * currentUnitMRP;
    } else {
      const newValue = parseFloat(value) || 0;
      product[field] = newValue * product.quantity;
    }

    updatedProducts[index] = product;

    const total_tp = updatedProducts.reduce(
      (sum, product) => sum + (product.tp || 0),
      0
    );
    const total_dp = updatedProducts.reduce(
      (sum, product) => sum + (product.dp || 0),
      0
    );
    const total_mrp = updatedProducts.reduce(
      (sum, product) => sum + (product.mrp || 0),
      0
    );

    setEditingReport((prev) => ({
      ...prev,
      products: updatedProducts,
      total_tp,
      total_dp,
      total_mrp,
      updatedAt: new Date().toISOString(),
    }));
  };

  const handleFieldChange = (field, value) => {
    setEditingReport((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Calculate totals
  const totalMRP = reports.reduce(
    (sum, report) => sum + (report.total_mrp || 0),
    0
  );
  const totalTP = reports.reduce(
    (sum, report) => sum + (report.total_tp || 0),
    0
  );
  const totalProductsSold = reports.reduce(
    (sum, report) =>
      sum +
      report.products.reduce(
        (prodSum, product) => prodSum + (product.quantity || 0),
        0
      ),
    0
  );

  // Export to Excel
  const exportToExcel = () => {
    if (!reports.length) {
      toast.error("No data available to export");
      return;
    }

    try {
      const wb = XLSX.utils.book_new();
      const headers = ["Date", "Products Sold", "Route", "Memo", "Total TP"];
      const period =
        startDate && endDate
          ? `${dayjs(startDate).format("DD MMMM YYYY")} to ${dayjs(
              endDate
            ).format("DD MMMM YYYY")}`
          : `Month: ${dayjs(filterMonth).format("MMMM YYYY")}`;
      const data = [
        ["Daily Sales Report"],
        [period],
        [`User: ${viewedUser?.name || "Unknown"}`],
        [""],
        headers,
        ...reports.map((report) => [
          dayjs(report.sale_date).format("YYYY-MM-DD"),
          report.products
            .map((p) => `• ${p.product_name} x ${p.quantity}`)
            .join("\n"),
          report.route || "N/A",
          report.memo || "N/A",
          `৳${report.total_tp.toFixed(2)}`,
        ]),
        ["", "", "", "", "Summary"],
        ["Total", totalProductsSold, "", "", `৳${totalTP.toFixed(2)}`],
      ];

      const ws = XLSX.utils.aoa_to_sheet(data);

      ws["!cols"] = [
        { wch: 15 }, // Date
        { wch: 60 }, // Products Sold (increased for bulleted list)
        { wch: 25 }, // Route
        { wch: 35 }, // Memo
        { wch: 15 }, // Total TP
      ];

      const borderStyle = {
        top: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
        left: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } },
      };

      const styles = {
        title: {
          font: { bold: true, sz: 16, color: { rgb: "FFFFFF" } },
          fill: { fgColor: { rgb: "1E3A8A" } }, // Darker blue for header
          alignment: { horizontal: "center", vertical: "center" },
          border: borderStyle,
        },
        info: {
          font: { bold: true, sz: 12, color: { rgb: "1F2937" } },
          border: borderStyle,
        },
        header: {
          font: { bold: true, sz: 11, color: { rgb: "FFFFFF" } },
          fill: { fgColor: { rgb: "1E3A8A" } },
          alignment: { horizontal: "center", vertical: "center" },
          border: borderStyle,
        },
        dataEven: {
          font: { sz: 10 },
          alignment: {
            horizontal: "center",
            vertical: "center",
            wrapText: true,
          },
          border: borderStyle,
        },
        dataOdd: {
          font: { sz: 10 },
          fill: { fgColor: { rgb: "F3F4F6" } }, // Light gray for alternate rows
          alignment: {
            horizontal: "center",
            vertical: "center",
            wrapText: true,
          },
          border: borderStyle,
        },
        total: {
          font: { bold: true, sz: 11 },
          fill: { fgColor: { rgb: "FEF3C7" } }, // Soft yellow for totals
          alignment: { horizontal: "center", vertical: "center" },
          border: borderStyle,
        },
      };

      for (let i = 0; i < data.length; i++) {
        for (let j = 0; j < data[i].length; j++) {
          const cellAddress = XLSX.utils.encode_cell({ r: i, c: j });
          if (!ws[cellAddress]) continue;

          if (i === 0) {
            ws[cellAddress].s = styles.title;
          } else if (i === 1 || i === 2) {
            ws[cellAddress].s = styles.info;
          } else if (i === 4) {
            ws[cellAddress].s = styles.header;
          } else if (i >= 5 && i < data.length - 2) {
            ws[cellAddress].s = i % 2 === 0 ? styles.dataOdd : styles.dataEven;
          } else if (i >= data.length - 2) {
            ws[cellAddress].s = styles.total;
          } else {
            ws[cellAddress].s = { border: borderStyle };
          }
        }
      }

      ws["!merges"] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: headers.length - 1 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: headers.length - 1 } },
        { s: { r: 2, c: 0 }, e: { r: 2, c: headers.length - 1 } },
        {
          s: { r: data.length - 2, c: 0 },
          e: { r: data.length - 2, c: headers.length - 1 },
        },
        { s: { r: data.length - 1, c: 0 }, e: { r: data.length - 1, c: 0 } },
      ];

      XLSX.utils.book_append_sheet(wb, ws, "Daily Sales Report");
      const fileName = `Daily_Sales_Report_${
        filterMonth || filterStartDate
      }_${dayjs().format("YYYYMMDD_HHmmss")}.xlsx`;
      XLSX.writeFile(wb, fileName);
      toast.success("Report exported to Excel successfully");
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      toast.error("Failed to export report to Excel");
    }
  };

  // Export to PDF
  const exportToPDF = () => {
    if (!reports.length) {
      toast.error("No data available to export");
      return;
    }

    try {
      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 64, 175); // Blue-800 for consistency
      doc.text("Daily Sales Report", doc.internal.pageSize.getWidth() / 2, 15, {
        align: "center",
      });

      doc.setFontSize(12);
      doc.setTextColor(31, 41, 55); // Gray-800
      doc.setFont("helvetica", "normal");
      const period =
        startDate && endDate
          ? `${dayjs(startDate).format("DD MMMM YYYY")} to ${dayjs(
              endDate
            ).format("DD MMMM YYYY")}`
          : `Month: ${dayjs(filterMonth).format("MMMM YYYY")}`;
      doc.text(period, 14, 25);
      doc.text(`User: ${viewedUser?.name || "Unknown"}`, 14, 35);

      autoTable(doc, {
        startY: 45,
        margin: { left: 14, right: 14 },
        head: [["Date", "Products Sold", "Route", "Memo", "Total TP"]],
        body: reports.map((report) => [
          dayjs(report.sale_date).format("YYYY-MM-DD"),
          report.products
            .map((p) => `• ${p.product_name} x ${p.quantity}`)
            .join("\n"),
          report.route || "N/A",
          report.memo || "N/A",
          `${report.total_tp.toFixed(2)}`,
        ]),
        headStyles: {
          fillColor: [30, 64, 175], // Blue-800
          textColor: [255, 255, 255],
          fontStyle: "bold",
          fontSize: 11,
          halign: "center",
          valign: "middle",
          cellPadding: 3,
        },
        styles: {
          fontSize: 10,
          halign: "center",
          valign: "middle",
          cellPadding: 3,
          lineWidth: 0.1,
          lineColor: [55, 65, 81], // Gray-700
        },
        alternateRowStyles: {
          fillColor: [243, 244, 246], // Gray-100
        },
        columnStyles: {
          0: { cellWidth: 25, halign: "center" }, // Date
          1: { cellWidth: 70, halign: "left" }, // Products Sold (left-aligned for list)
          2: { cellWidth: 25, halign: "center" }, // Route
          3: { cellWidth: 20, halign: "center" }, // Memo
          4: { cellWidth: 40, halign: "center" }, // Total TP
        },
        didParseCell: (data) => {
          if (data.section === "body" && data.column.index === 1) {
            data.cell.styles.halign = "left"; // Ensure products column is left-aligned
          }
        },
      });

      const finalY = doc.lastAutoTable.finalY + 10;
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(31, 41, 55); // Gray-800
      doc.text(`Total Products Sold: ${totalProductsSold}`, 14, finalY);
      doc.text(`Total TP: ${totalTP.toFixed(2)}`, 14, finalY + 10);

      const fileName = `Daily_Sales_Report_${
        filterMonth || filterStartDate
      }_${dayjs().format("YYYYMMDD_HHmmss")}.pdf`;
      doc.save(fileName);
      toast.success("Report exported to PDF successfully");
    } catch (error) {
      console.error("Error exporting to PDF:", error);
      toast.error("Failed to export report to PDF");
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <AdminSidebar />
      <div className="flex-1 p-6 bg-gray-100">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-gray-800 mb-6">
            Daily Sales Report
          </h2>

          {/* Filters */}
          <div className="mb-6 flex gap-4 items-end flex-wrap">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Month
              </label>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => {
                  setSelectedMonth(e.target.value);
                  setStartDate("");
                  setEndDate("");
                }}
                className="border rounded p-2 focus:ring-indigo-500 focus:border-indigo-500"
                disabled={startDate && endDate}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setSelectedMonth("");
                }}
                className="border rounded p-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setSelectedMonth("");
                }}
                className="border rounded p-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <button
              className="bg-blue-900 text-white px-4 py-2 rounded hover:bg-indigo-700"
              onClick={() => {
                setFilterMonth(selectedMonth);
                setFilterStartDate(startDate);
                setFilterEndDate(endDate);
              }}
              disabled={loading}
            >
              {loading ? "Loading..." : "Filter Reports"}
            </button>
            <button
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
              onClick={() => {
                setStartDate("");
                setEndDate("");
                setSelectedMonth(dayjs().format("YYYY-MM"));
                setFilterMonth(dayjs().format("YYYY-MM"));
                setFilterStartDate("");
                setFilterEndDate("");
              }}
            >
              Reset Dates
            </button>
            <div className="relative">
              <button
                onClick={() => setExportDropdownOpen(!exportDropdownOpen)}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center"
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
                  <div className="py-1" role="menu" aria-orientation="vertical">
                    <button
                      onClick={() => {
                        exportToExcel();
                        setExportDropdownOpen(false);
                      }}
                      disabled={!reports.length}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      role="menuitem"
                    >
                      Export to Excel
                    </button>
                    <button
                      onClick={() => {
                        exportToPDF();
                        setExportDropdownOpen(false);
                      }}
                      disabled={!reports.length}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      role="menuitem"
                    >
                      Export to PDF
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Report Summary */}
          <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              Report Summary
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex gap-2">
                <span className="text-gray-600">Total Products Sold:</span>
                <span className="font-semibold text-gray-800">
                  {totalProductsSold}
                </span>
              </div>
              <div className="flex gap-2">
                <span className="text-gray-600">Total MRP:</span>
                <span className="font-semibold text-gray-800">
                  ৳{totalMRP.toFixed(2)}
                </span>
              </div>
              <div className="flex gap-2">
                <span className="text-gray-600">Total TP:</span>
                <span className="font-semibold text-gray-800">
                  ৳{totalTP.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Daily Report Table */}
          {loading || userLoading ? (
            <div className="flex justify-center items-center my-10">
              <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-indigo-600"></div>
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center text-gray-600">
              No sales found for the selected period.
            </div>
          ) : (
            <div className="bg-white shadow-lg rounded-lg p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                Daily Sales
              </h3>
              <table className="min-w-full table-auto border-collapse">
                <thead className="bg-blue-900 text-white">
                  <tr>
                    <th className="p-4 text-left font-medium">Date</th>
                    <th className="p-4 text-left font-medium">Products Sold</th>
                    <th className="p-4 text-left font-medium">Route</th>
                    <th className="p-4 text-left font-medium">Memo</th>
                    <th className="p-4 text-left font-medium">Total TP</th>
                    {user?.role === "super admin" && (
                      <th className="p-4 text-left font-medium">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {reports.map((report, index) => (
                    <tr
                      key={report._id}
                      className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                    >
                      <td className="p-4 text-gray-800">
                        {dayjs(report.sale_date).format("YYYY-MM-DD")}
                      </td>
                      <td className="p-4 text-gray-600">
                        {report.products.map((product, productIndex) => (
                          <div key={productIndex}>
                            {product.product_name} (Qty: {product.quantity})
                          </div>
                        ))}
                      </td>
                      <td className="p-4 text-gray-800">
                        {report.route || "N/A"}
                      </td>
                      <td className="p-4 text-gray-800">
                        {report.memo || "N/A"}
                      </td>
                      <td className="p-4 text-gray-800">
                        ৳{report.total_tp.toFixed(2)}
                      </td>
                      {user?.role === "super admin" && (
                        <td className="p-4 text-gray-800">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEditReport(report)}
                              className="text-blue-600 hover:text-blue-900"
                              disabled={userLoading}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteReport(report._id)}
                              className="text-red-600 hover:text-red-900"
                              disabled={userLoading}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Edit Modal */}
          {isEditing && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex justify-between items-center border-b pb-4">
                    <h3 className="text-lg font-semibold text-gray-800">
                      Edit Sales Report
                    </h3>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      ✕
                    </button>
                  </div>

                  <form
                    onSubmit={handleUpdateReport}
                    className="mt-4 space-y-4"
                  >
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Date & Time
                      </label>
                      <div className="text-sm text-gray-600 bg-gray-100 p-2 rounded">
                        {dayjs(editingReport.sale_date).format(
                          "DD MMM YYYY, h:mm A"
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Products
                      </label>
                      <div className="space-y-3">
                        {editingReport.products.map((product, index) => (
                          <div key={index} className="border rounded-lg p-3">
                            <div className="font-medium mb-2">
                              {product.product_name}
                            </div>

                            <div className="grid grid-cols-4 gap-3">
                              <div>
                                <label className="block text-xs text-gray-500 mb-1">
                                  Quantity
                                </label>
                                <input
                                  type="number"
                                  value={product.quantity}
                                  onChange={(e) =>
                                    handleProductChange(
                                      index,
                                      "quantity",
                                      e.target.value
                                    )
                                  }
                                  className="w-full p-2 border rounded focus:ring-indigo-500 focus:border-indigo-500"
                                  min="0"
                                />
                              </div>

                              <div>
                                <label className="block text-xs text-gray-500 mb-1">
                                  Unit DP
                                </label>
                                <input
                                  type="number"
                                  value={
                                    product.quantity
                                      ? (product.dp / product.quantity).toFixed(
                                          2
                                        )
                                      : 0
                                  }
                                  onChange={(e) =>
                                    handleProductChange(
                                      index,
                                      "dp",
                                      e.target.value
                                    )
                                  }
                                  className="w-full p-2 border rounded focus:ring-indigo-500 focus:border-indigo-500"
                                  step="0.01"
                                />
                              </div>

                              <div>
                                <label className="block text-xs text-gray-500 mb-1">
                                  Unit TP
                                </label>
                                <input
                                  type="number"
                                  value={
                                    product.quantity
                                      ? (product.tp / product.quantity).toFixed(
                                          2
                                        )
                                      : 0
                                  }
                                  onChange={(e) =>
                                    handleProductChange(
                                      index,
                                      "tp",
                                      e.target.value
                                    )
                                  }
                                  className="w-full p-2 border rounded focus:ring-indigo-500 focus:border-indigo-500"
                                  step="0.01"
                                />
                              </div>

                              <div>
                                <label className="block text-xs text-gray-500 mb-1">
                                  Unit MRP
                                </label>
                                <input
                                  type="number"
                                  value={
                                    product.quantity
                                      ? (
                                          product.mrp / product.quantity
                                        ).toFixed(2)
                                      : 0
                                  }
                                  onChange={(e) =>
                                    handleProductChange(
                                      index,
                                      "mrp",
                                      e.target.value
                                    )
                                  }
                                  className="w-full p-2 border rounded focus:ring-indigo-500 focus:border-indigo-500"
                                  step="0.01"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-3 gap-2 mt-2 text-xs">
                              <div className="bg-gray-100 p-1 rounded text-center">
                                <div>DP: {product.dp.toFixed(2)}</div>
                              </div>
                              <div className="bg-gray-100 p-1 rounded text-center">
                                <div>TP: {product.tp.toFixed(2)}</div>
                              </div>
                              <div className="bg-gray-100 p-1 rounded text-center">
                                <div>MRP: {product.mrp.toFixed(2)}</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                      <div>
                        <div className="text-sm text-gray-500">Total TP</div>
                        <div className="text-xl font-bold">
                          {editingReport.total_tp.toFixed(2)}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Total DP</div>
                        <div className="text-xl font-bold">
                          {editingReport.total_dp.toFixed(2)}
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                      <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="px-4 py-2 border rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-blue-900 rounded-md text-sm font-medium text-white hover:bg-indigo-700"
                        disabled={userLoading}
                      >
                        Save Changes
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DailyReport;
