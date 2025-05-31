import React, { useState, useEffect } from "react";
import axios from "axios";
import dayjs from "dayjs";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf/dist/jspdf.umd.min.js";
import "jspdf-autotable";
import autoTable from "jspdf-autotable";
import AdminSidebar from "../Component/AdminSidebar";

const Accounts = () => {
  const user = JSON.parse(localStorage.getItem("pos-user"));
  const [selectedType, setSelectedType] = useState("outlet"); // outlet, ASM, RSM, or Zone
  const [selectedArea, setSelectedArea] = useState(user.outlet || "");
  const [areaOptions, setAreaOptions] = useState([]);
  const [exportDropdown, setExportDropdown] = useState(false);
  const [dateRange, setDateRange] = useState({
    start: dayjs().startOf("month").format("YYYY-MM-DD"),
    end: dayjs().endOf("month").format("YYYY-MM-DD"),
  });
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [error, setError] = useState(null);

  // Fetch area options based on selected type
  useEffect(() => {
    const fetchAreaOptions = async () => {
      try {
        const response = await axios.get(
          "https://gvi-pos-server.vercel.app/api/area-options",
          { params: { type: selectedType } }
        );
        if (response.data?.success) {
          setAreaOptions(response.data.data);
          if (response.data.data.length > 0 && !selectedArea) {
            setSelectedArea(response.data.data[0]);
          }
        }
      } catch (error) {
        console.error("Error fetching area options:", error);
      }
    };

    fetchAreaOptions();
  }, [selectedType]);

  useEffect(() => {
    if (
      (selectedArea || selectedType === "outlet") &&
      dateRange.start &&
      dateRange.end
    ) {
      fetchReportData();
    }
  }, [selectedArea, dateRange, selectedType]);

  const fetchReportData = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = {
        startDate: dayjs(dateRange.start).format("YYYY-MM-DD HH:mm:ss"),
        endDate: dayjs(dateRange.end).format("YYYY-MM-DD HH:mm:ss"),
      };

      let response;

      if (selectedType === "outlet") {
        params.outlet = selectedArea;
        response = await axios.get(
          "https://gvi-pos-server.vercel.app/api/financial-movement",
          { params }
        );
      } else {
        params.areaType = selectedType;
        params.areaValue = selectedArea;
        response = await axios.get(
          "https://gvi-pos-server.vercel.app/api/area-financial-movement",
          { params }
        );
      }

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
      [
        `${
          selectedType === "outlet" ? "Outlet" : selectedType
        }: ${selectedArea}`,
      ],
      [
        `Period: ${dayjs(dateRange.start).format("DD-MM-YY")} to ${dayjs(
          dateRange.end
        ).format("DD-MM-YY")}`,
      ],
      [],
      ["Opening Due", reportData.openingDue.toFixed(2)],
      ["Primary Added", reportData.primary.toFixed(2)],
      ["Payments", reportData.payment.toFixed(2)],
      ["Office Returns", reportData.officeReturn.toFixed(2)],
      ["Closing Due", reportData.closingDue.toFixed(2)],
      [],
      ["Transaction Details"],
      ["Date", "Type", "Amount", "Created By", "Remarks"],
    ];

    if (reportData.transactions) {
      reportData.transactions.forEach((txn) => {
        excelData.push([
          dayjs(txn.date).format("DD-MM-YY"),
          txn.type,
          txn.amount.toFixed(2),
          txn.createdBy,
          txn.remarks || "",
        ]);
      });
    }

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(excelData);
    XLSX.utils.book_append_sheet(wb, ws, "Financial Movement");
    XLSX.writeFile(
      wb,
      `Financial_Report_${selectedArea}_${dateRange.start}.xlsx`
    );
  };

  const exportToPDF = () => {
    if (!reportData) return;

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
    });

    doc.setFontSize(14);
    doc.text(
      `${selectedType === "outlet" ? "Outlet" : selectedType}: ${
        selectedArea || ""
      }`,
      14,
      15
    );
    doc.text(
      `Period: ${dayjs(dateRange.start).format("DD-MM-YY")} to ${dayjs(
        dateRange.end
      ).format("DD-MM-YY")}`,
      14,
      22
    );

    // Summary table
    autoTable(doc, {
      startY: 30,
      head: [["Item", "Amount"]],
      body: [
        ["Opening Due", reportData.openingDue.toFixed(2)],
        ["Primary Added", reportData.primary.toFixed(2)],
        ["Payments", reportData.payment.toFixed(2)],
        ["Office Returns", reportData.officeReturn.toFixed(2)],
        ["Closing Due", reportData.closingDue.toFixed(2)],
      ],
      theme: "grid",
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
      },
    });

    // Transactions table
    if (reportData.transactions && reportData.transactions.length > 0) {
      doc.text("Transaction Details", 14, doc.lastAutoTable.finalY + 10);

      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 15,
        head: [["Date", "Type", "Amount", "Created By", "Remarks"]],
        body: reportData.transactions.map((txn) => [
          dayjs(txn.date).format("DD-MM-YY"),
          txn.type,
          txn.amount.toFixed(2),
          txn.createdBy,
          txn.remarks || "",
        ]),
        styles: { fontSize: 8 },
        columnStyles: {
          0: { cellWidth: 20 },
          1: { cellWidth: 20 },
          2: { cellWidth: 20 },
          3: { cellWidth: 30 },
          4: { cellWidth: "auto" },
        },
      });
    }

    doc.save(
      `Financial_Report_${selectedArea || "all"}_${dayjs().format(
        "YYYYMMDD"
      )}.pdf`
    );
  };

  return (
    <div className="flex">
      <div className="mx-auto px-6 py-8 w-full md:w-[80%]">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl sm:text-3xl font-bold text-gray-800">
            Accounts
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

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex flex-col md:flex-row gap-2">
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
            >
              Apply Filter
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-100 border-l-4 border-red-500">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Summary Cards */}
        {!loading && reportData && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-white border-l-4 border-purple-600 p-4 rounded shadow">
              <p className="text-sm text-gray-600">Opening Due</p>
              <p className="text-2xl font-semibold text-purple-700">
                {reportData.openingDue?.toFixed(2)}
              </p>
            </div>
            <div className="bg-white border-l-4 border-blue-600 p-4 rounded shadow">
              <p className="text-sm text-gray-600">Primary Added</p>
              <p className="text-2xl font-semibold text-blue-700">
                {reportData.primary?.toFixed(2)}
              </p>
            </div>
            <div className="bg-white border-l-4 border-green-600 p-4 rounded shadow">
              <p className="text-sm text-gray-600">Payments</p>
              <p className="text-2xl font-semibold text-green-700">
                {reportData.payment?.toFixed(2)}
              </p>
            </div>
            <div className="bg-white border-l-4 border-yellow-600 p-4 rounded shadow">
              <p className="text-sm text-gray-600">Office Returns</p>
              <p className="text-2xl font-semibold text-yellow-700">
                {reportData.officeReturn?.toFixed(2)}
              </p>
            </div>
            <div className="bg-white border-l-4 border-indigo-600 p-4 rounded shadow">
              <p className="text-sm text-gray-600">Closing Due</p>
              <p className="text-2xl font-semibold text-indigo-700">
                {reportData.closingDue?.toFixed(2)}
              </p>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        )}

        {/* Transaction Table */}
        {!loading && reportData?.transactions && (
          <div className="bg-white p-4 rounded shadow-md mb-6">
            <h3 className="text-lg font-bold mb-4">Transaction Details</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full border">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border p-2">Date</th>
                    <th className="border p-2">Dealer</th>
                    <th className="border p-2">Type</th>
                    <th className="border p-2">Amount</th>
                    <th className="border p-2">Created By</th>
                    <th className="border p-2">Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.transactions.map((txn, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="border p-2">
                        {dayjs(txn.date).format("DD-MM-YY")}
                      </td>
                      <td className="border p-2 capitalize">
                        {txn.outlet.replace("_", " ")}
                      </td>
                      <td className="border p-2 capitalize">
                        {txn.type.replace("_", " ")}
                      </td>
                      <td className="border p-2 ">
                        {txn.amount?.toFixed(2)}
                      </td>
                      <td className="border p-2">{txn.createdBy}</td>
                      <td className="border p-2">{txn.remarks || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!loading && !reportData && (
          <div className="text-center py-8 text-gray-500">
            No data available for selected period
          </div>
        )}
      </div>
    </div>
  );
};

export default Accounts;
