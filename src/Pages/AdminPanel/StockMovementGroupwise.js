import React, { useState, useEffect } from "react";
import axios from "axios";
import dayjs from "dayjs";
import AdminSidebar from "../../Component/AdminSidebar";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf/dist/jspdf.umd.min.js";
import "jspdf-autotable";
import autoTable from "jspdf-autotable";

const GroupStockMovementReport = () => {
  const user = JSON.parse(localStorage.getItem("pos-user"));
  const [selectedType, setSelectedType] = useState("ASM"); // ASM, RSM, or Zone
  const [selectedArea, setSelectedArea] = useState("");
  const [areaOptions, setAreaOptions] = useState([]);
  const [exportDropdown, setExportDropdown] = useState(false);
  const [dateRange, setDateRange] = useState({
    start: dayjs().startOf("month").format("YYYY-MM-DD"),
    end: dayjs().endOf("month").format("YYYY-MM-DD"),
  });
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState([]);
  const [error, setError] = useState(null);

  // Fetch area options based on selected type
  useEffect(() => {
    const fetchAreaOptions = async () => {
      try {
        const response = await axios.get(
          "http://175.29.181.245:5000/api/area-options",
          { params: { type: selectedType } }
        );
        if (response.data?.success) {
          setAreaOptions(response.data.data);
          if (response.data.data.length > 0) {
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
    if (selectedArea && dateRange.start && dateRange.end) {
      fetchReportData();
    }
  }, [selectedArea, dateRange]);

  const fetchReportData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Validate dates
      if (!dateRange.start || !dateRange.end) {
        throw new Error("Please select both start and end dates");
      }

      // Format dates properly
      const params = {
        areaType: selectedType,
        areaValue: selectedArea,
        startDate: dayjs(dateRange.start).format("YYYY-MM-DD HH:mm:ss"),
        endDate: dayjs(dateRange.end).format("YYYY-MM-DD HH:mm:ss"),
      };

      const response = await axios.get(
        "http://175.29.181.245:5000/api/area-stock-movement",
        { params }
      );

      if (response.data?.success) {
        const filteredData = response.data.data.filter((item) => {
          return (
            (item.openingStock && item.openingStock !== 0) ||
            (item.primary && item.primary !== 0) ||
            (item.secondary && item.secondary !== 0) ||
            (item.officeReturn && item.officeReturn !== 0) ||
            (item.marketReturn && item.marketReturn !== 0)
          );
        });
        // Sort the data alphabetically by productName
        const sortedData = [...filteredData].sort((a, b) =>
          a.productName.localeCompare(b.productName)
        );
        setReportData(sortedData);
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
      } else if (error.request) {
        errorMessage = "No response from server";
      }
      setError(errorMessage);
      setReportData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterClick = () => {
    fetchReportData();
  };

  // Export functions (similar to your existing ones, just updated labels)
  const exportToExcel = () => {
    const sortedData = [...reportData].sort((a, b) =>
      a.productName.localeCompare(b.productName)
    );

    const excelData = [
      [
        `${selectedType}: ${selectedArea}`,
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        `Period: ${
          dayjs(dateRange.start).format("DD-MM-YY") +
          " to " +
          dayjs(dateRange.end).format("DD-MM-YY")
        }`,
      ],
      ["", "", "", "", "", "", "", "", ""],
      [
        "Sl",
        "Products Name",
        "Opening Stock",
        "",
        "Primary",
        "",
        "Market Return",
        "",
        "Office Return",
        "",
        "Secondary",
        "",
        "Closing Stock",
        "",
      ],
      [
        "",
        "",
        "Qty",
        "Value",
        "Qty",
        "Value",
        "Qty",
        "Value",
        "Qty",
        "Value",
        "Qty",
        "Value",
        "Qty",
        "Value",
      ],
      ...sortedData.map((item, index) => [
        index + 1,
        item.productName,
        item.openingStock,
        item.openingValueDP?.toFixed(2),
        item.primary,
        item.primaryValueDP?.toFixed(2),
        item.marketReturn,
        item.marketReturnValueDP?.toFixed(2),
        item.officeReturn,
        item.officeReturnValueDP?.toFixed(2),
        item.secondary,
        item.secondaryValueDP?.toFixed(2),
        item.openingStock +
          item.primary +
          item.marketReturn -
          item.secondary -
          item.officeReturn,
        (
          item.openingValueDP +
          item.primaryValueDP +
          item.marketReturnValueDP -
          item.secondaryValueDP -
          item.officeReturnValueDP
        )?.toFixed(2),
      ]),
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(excelData);

    ws["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 7 } },
      { s: { r: 0, c: 8 }, e: { r: 0, c: 13 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 7 } },
      { s: { r: 1, c: 8 }, e: { r: 1, c: 13 } },
      { s: { r: 2, c: 2 }, e: { r: 2, c: 3 } },
      { s: { r: 2, c: 4 }, e: { r: 2, c: 5 } },
      { s: { r: 2, c: 6 }, e: { r: 2, c: 7 } },
      { s: { r: 2, c: 8 }, e: { r: 2, c: 9 } },
      { s: { r: 2, c: 10 }, e: { r: 2, c: 11 } },
      { s: { r: 2, c: 12 }, e: { r: 2, c: 13 } },
    ];

    XLSX.utils.book_append_sheet(wb, ws, "Stock Movement");
    XLSX.writeFile(
      wb,
      `Stock_Movement_${selectedType}_${selectedArea}_${dateRange.start}.xlsx`
    );
  };

  const exportToPDF = () => {
    const sortedData = [...reportData].sort((a, b) =>
      a.productName.localeCompare(b.productName)
    );

    try {
      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
      });

      doc.setFontSize(12);
      doc.text(`${selectedType}: ${selectedArea || ""}`, 14, 15);

      const pageWidth = doc.internal.pageSize.getWidth();
      doc.text(
        `Period: ${
          dayjs(dateRange.start).format("DD-MM-YY") +
          " to " +
          dayjs(dateRange.end).format("DD-MM-YY")
        }`,
        pageWidth - 75,
        15
      );

      const headers = [
        [
          "Sl",
          "Products Name",
          "Opening Stock",
          "",
          "Primary",
          "",
          "Market Return",
          "",
          "Office Return",
          "",
          "Secondary",
          "",
          "Closing Stock",
          "",
        ],
        [
          "",
          "",
          "Qty",
          "Value",
          "Qty",
          "Value",
          "Qty",
          "Value",
          "Qty",
          "Value",
          "Qty",
          "Value",
          "Qty",
          "Value",
        ],
      ];

      const data = sortedData.map((item, index) => [
        index + 1,
        item.productName || "",
        item.openingStock || 0,
        item.openingValueDP?.toFixed(2) || "0.00",
        item.primary || 0,
        item.primaryValueDP?.toFixed(2) || "0.00",
        item.marketReturn || 0,
        item.marketReturnValueDP?.toFixed(2) || "0.00",
        item.officeReturn || 0,
        item.officeReturnValueDP?.toFixed(2) || "0.00",
        item.secondary || 0,
        item.secondaryValueDP?.toFixed(2) || "0.00",
        item.openingStock +
          item.primary +
          item.marketReturn -
          item.secondary -
          item.officeReturn || 0,
        (
          item.openingValueDP +
          item.primaryValueDP +
          item.marketReturnValueDP -
          item.secondaryValueDP -
          item.officeReturnValueDP
        )?.toFixed(2) || "0.00",
      ]);

      autoTable(doc, {
        head: headers,
        body: data,
        startY: 30,
        margin: { horizontal: 10 },
        styles: {
          fontSize: 8,
          cellPadding: 2,
          overflow: "linebreak",
          halign: "center",
        },
        columnStyles: {
          0: { cellWidth: 8, halign: "center" },
          1: { cellWidth: 30, halign: "left" },
        },
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: 255,
          fontStyle: "bold",
        },
        didParseCell: function (data) {
          if (data.section === "head" && data.row.index === 0) {
            if (
              data.column.dataKey === 2 ||
              data.column.dataKey === 4 ||
              data.column.dataKey === 6 ||
              data.column.dataKey === 8 ||
              data.column.dataKey === 10 ||
              data.column.dataKey === 12
            ) {
              data.cell.colSpan = 2;
            }
          }
        },
      });

      const fileName = `Stock_Report_${selectedType}_${selectedArea || "all"}_${
        dayjs(dateRange.start).format("YYYY-MM-DD") +
          " to " +
          dayjs(dateRange.end).format("YYYY-MM-DD") || dayjs().format("MMMM")
      }_${dayjs().format("YYYYMMDD")}.pdf`;
      doc.save(fileName);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF. Please try again.");
    }
  };

  // Calculate totals
  const totals = reportData.reduce(
    (acc, item) => {
      acc.openingQty += item.openingStock || 0;
      acc.openingValue += item.openingValueDP || 0;
      acc.primaryQty += item.primary || 0;
      acc.primaryValue += item.primaryValueDP || 0;
      acc.marketReturnQty += item.marketReturn || 0;
      acc.marketReturnValue += item.marketReturnValueDP || 0;
      acc.officeReturnQty += item.officeReturn || 0;
      acc.officeReturnValue += item.officeReturnValueDP || 0;
      acc.secondaryQty += item.secondary || 0;
      acc.secondaryValue += item.secondaryValueDP || 0;
      acc.closingQty += item.closingStock || 0;
      acc.closingValue += item.closingValueDP || 0;
      return acc;
    },
    {
      openingQty: 0,
      openingValue: 0,
      primaryQty: 0,
      primaryValue: 0,
      marketReturnQty: 0,
      marketReturnValue: 0,
      officeReturnQty: 0,
      officeReturnValue: 0,
      secondaryQty: 0,
      secondaryValue: 0,
      closingQty: 0,
      closingValue: 0,
    }
  );

  return (
    <div className="flex">
      <AdminSidebar />

      <div className="mx-auto px-6 py-8 w-full md:w-[80%]">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-gray-800">
            Group Stock Movement Report
          </h2>
          <div className="relative">
            <button
              onClick={() => setExportDropdown(!exportDropdown)}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded flex items-center"
              disabled={reportData.length === 0}
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
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-4 py-2 border rounded-md shadow-sm"
          >
            <option value="ASM">ASM Wise</option>
            <option value="RSM">RSM Wise</option>
            <option value="Zone">Zone Wise</option>
          </select>

          <select
            value={selectedArea}
            onChange={(e) => setSelectedArea(e.target.value)}
            className="px-4 py-2 border rounded-md shadow-sm"
          >
            {areaOptions.map((area, index) => (
              <option key={index} value={area}>
                {area}
              </option>
            ))}
          </select>

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
              onClick={handleFilterClick}
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
        {!loading && reportData.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
            <div className="bg-white border-l-4 border-purple-600 p-4 rounded shadow">
              <p className="text-sm text-gray-600">Opening Stock (DP)</p>
              <p className="text-2xl font-semibold text-purple-700">
                {totals.openingValue?.toFixed(2)}
              </p>
            </div>
            <div className="bg-white border-l-4 border-green-600 p-4 rounded shadow">
              <p className="text-sm text-gray-600">Primary Stock (DP)</p>
              <p className="text-2xl font-semibold text-green-700">
                {totals.primaryValue?.toFixed(2)}
              </p>
            </div>
            <div className="bg-white border-l-4 border-blue-600 p-4 rounded shadow">
              <p className="text-sm text-gray-600">Secondary Sales (DP)</p>
              <p className="text-2xl font-semibold text-blue-700">
                {totals.secondaryValue?.toFixed(2)}
              </p>
            </div>
            <div className="bg-white border-l-4 border-red-600 p-4 rounded shadow">
              <p className="text-sm text-gray-600">Market Returns (DP)</p>
              <p className="text-2xl font-semibold text-red-700">
                {totals.marketReturnValue?.toFixed(2)}
              </p>
            </div>
            <div className="bg-white border-l-4 border-yellow-600 p-4 rounded shadow">
              <p className="text-sm text-gray-600">Office Returns (DP)</p>
              <p className="text-2xl font-semibold text-yellow-700">
                {totals.officeReturnValue?.toFixed(2)}
              </p>
            </div>
            <div className="bg-white border-l-4 border-indigo-600 p-4 rounded shadow">
              <p className="text-sm text-gray-600">Closing Stock (DP)</p>
              <p className="text-2xl font-semibold text-indigo-700">
                {(
                  totals.openingValue +
                  totals.primaryValue +
                  totals.marketReturnValue -
                  totals.secondaryValue -
                  totals.officeReturnValue
                )?.toFixed(2)}
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

        {/* Report Table */}
        {!loading && reportData.length > 0 && (
          <div
            className="overflow-x-auto shadow rounded-lg"
            style={{ maxHeight: "95vh" }}
          >
            <table className="min-w-full border">
              <thead className="sticky top-[-1px] bg-white z-10">
                <tr>
                  <th colSpan="14" className="bg-gray-200 px-4 py-2 text-left">
                    {selectedType}: {selectedArea}
                  </th>
                </tr>
                <tr>
                  <th colSpan="14" className="bg-gray-200 px-4 py-3 text-left">
                    Period: {dayjs(dateRange.start).format("DD-MM-YY")} to{" "}
                    {dayjs(dateRange.end).format("DD-MM-YY")}
                  </th>
                </tr>
                <tr className="bg-gray-100">
                  <th rowSpan="2" className=" p-2 sticky top-22 bg-gray-100">
                    Sl
                  </th>
                  <th rowSpan="2" className="p-2 sticky top-22 bg-gray-100">
                    Products Name
                  </th>
                  <th
                    colSpan="2"
                    className=" p-2 text-center sticky top-24 bg-gray-100"
                  >
                    Opening Stock
                  </th>
                  <th
                    colSpan="2"
                    className=" p-2 text-center sticky top-24 bg-gray-100"
                  >
                    Primary
                  </th>
                  <th
                    colSpan="2"
                    className=" p-2 text-center sticky top-24 bg-gray-100"
                  >
                    Market Return
                  </th>
                  <th
                    colSpan="2"
                    className=" p-2 text-center sticky top-24 bg-gray-100"
                  >
                    Office Return
                  </th>
                  <th
                    colSpan="2"
                    className=" p-2 text-center sticky top-24 bg-gray-100"
                  >
                    Secondary
                  </th>
                  <th
                    colSpan="2"
                    className=" p-2 text-center sticky top-24 bg-gray-100"
                  >
                    Closing Stock
                  </th>
                </tr>
                <tr className="bg-gray-100 sticky top-32">
                  <th className="border p-2">Qty</th>
                  <th className="border p-2">Value</th>
                  <th className="border p-2">Qty</th>
                  <th className="border p-2">Value</th>
                  <th className="border p-2">Qty</th>
                  <th className="border p-2">Value</th>
                  <th className="border p-2">Qty</th>
                  <th className="border p-2">Value</th>
                  <th className="border p-2">Qty</th>
                  <th className="border p-2">Value</th>
                  <th className="border p-2">Qty</th>
                  <th className="border p-2">Value</th>
                </tr>
              </thead>
              <tbody>
                {reportData.map((item, index) => (
                  <tr key={item.barcode} className="hover:bg-gray-50">
                    <td className="border p-2">{index + 1}</td>
                    <td className="border p-2">{item.productName}</td>
                    <td className="border p-2 text-right">
                      {item.openingStock} pcs
                    </td>
                    <td className="border p-2 text-right">
                      {item.openingValueDP?.toFixed(2)}
                    </td>
                    <td className="border p-2 text-right">
                      {item.primary} pcs
                    </td>
                    <td className="border p-2 text-right">
                      {item.primaryValueDP?.toFixed(2)}
                    </td>
                    <td className="border p-2 text-right">
                      {item.marketReturn} pcs
                    </td>
                    <td className="border p-2 text-right">
                      {item.marketReturnValueDP?.toFixed(2)}
                    </td>
                    <td className="border p-2 text-right">
                      {item.officeReturn} pcs
                    </td>
                    <td className="border p-2 text-right">
                      {item.officeReturnValueDP?.toFixed(2)}
                    </td>
                    <td className="border p-2 text-right">
                      {item.secondary} pcs
                    </td>
                    <td className="border p-2 text-right">
                      {item.secondaryValueDP?.toFixed(2)}
                    </td>
                    <td className="border p-2 text-right">
                      {item.openingStock +
                        item.primary +
                        item.marketReturn -
                        item.secondary -
                        item.officeReturn}{" "}
                      pcs
                    </td>
                    <td className="border p-2 text-right">
                      {(
                        item.openingValueDP +
                        item.primaryValueDP +
                        item.marketReturnValueDP -
                        item.secondaryValueDP -
                        item.officeReturnValueDP
                      )?.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="sticky bottom-[-1px] bg-gray-100">
                <tr className="font-bold">
                  <td className="p-2" colSpan="2">
                    Total
                  </td>
                  <td className="p-2 text-right">{totals.openingQty}</td>
                  <td className="p-2 text-right">
                    {totals.openingValue.toFixed(2)}
                  </td>
                  <td className="p-2 text-right">{totals.primaryQty}</td>
                  <td className="p-2 text-right">
                    {totals.primaryValue.toFixed(2)}
                  </td>
                  <td className="p-2 text-right">{totals.marketReturnQty}</td>
                  <td className="p-2 text-right">
                    {totals.marketReturnValue.toFixed(2)}
                  </td>
                  <td className="p-2 text-right">{totals.officeReturnQty}</td>
                  <td className="p-2 text-right">
                    {totals.officeReturnValue.toFixed(2)}
                  </td>
                  <td className="p-2 text-right">{totals.secondaryQty}</td>
                  <td className="p-2 text-right">
                    {totals.secondaryValue.toFixed(2)}
                  </td>
                  <td className="p-2 text-right">{totals.closingQty}</td>
                  <td className="p-2 text-right">
                    {totals.closingValue.toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {!loading && reportData.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No data available for selected period
          </div>
        )}
      </div>
    </div>
  );
};

export default GroupStockMovementReport;
