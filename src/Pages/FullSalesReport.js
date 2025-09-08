import React, { useState, useEffect } from "react";
import dayjs from "dayjs";
import * as XLSX from "xlsx";
import { toast } from "react-hot-toast";
import axios from "axios";
import AdminSidebar from "../Component/AdminSidebar";

const FullSalesReport = () => {
  const [selectedMonth, setSelectedMonth] = useState(dayjs().format("YYYY-MM"));
  const [reportData, setReportData] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedZone, setSelectedZone] = useState("");
  const [uniqueZones, setUniqueZones] = useState([]);

  // Generate report
  const generateReport = async () => {
    try {
      setIsGenerating(true);
      const response = await axios.get("http://175.29.181.245:5000/sales/full-report", {
        params: { month: selectedMonth },
      });
      setReportData(response.data);
      const zones = [...new Set(response.data.users.map((u) => u.zone))].sort();
      setUniqueZones(zones);
      setSelectedZone("");
      toast.success("Full report generated successfully");
    } catch (error) {
      console.error("Error generating full report:", error);
      toast.error(error.response?.data?.error || "Failed to generate report");
    } finally {
      setIsGenerating(false);
    }
  };

  // Filtered users based on zone
  const filteredUsers = reportData?.users.filter(
    (user) => !selectedZone || user.zone === selectedZone
  ) || [];

  // Calculate summary
  const calculateSummary = () => {
    if (!reportData || !filteredUsers.length) return null;

    const dailySums = reportData.days.map((_, index) =>
      filteredUsers.reduce((sum, user) => sum + user.dailyTotals[index], 0)
    );
    const grandTotal = dailySums.reduce((sum, v) => sum + v, 0);

    return {
      dailySums,
      grandTotal,
    };
  };

  const summary = calculateSummary();

  // Export to Excel
  const exportToExcel = () => {
    if (!reportData) return;

    try {
      const wb = XLSX.utils.book_new();

      const headers = [
        "User Name",
        "Zone",
        "Outlet",
        ...reportData.days.map((day) => dayjs(day).format("D")),
        "Total",
      ];

      const data = [
        ["Full Sales Report"],
        [`Month: ${dayjs(reportData.month).format("MMMM YYYY")}`],
        [""],
        headers,
        ...filteredUsers.map((user) => [
          user.name,
          user.zone,
          user.outlet,
          ...user.dailyTotals.map((t) => (t > 0 ? t.toFixed(2) : "-")),
          user.total.toFixed(2),
        ]),
        [""],
        [
          "Total",
          "",
          "",
          ...summary.dailySums.map((s) => s.toFixed(2)),
          summary.grandTotal.toFixed(2),
        ],
      ];

      const ws = XLSX.utils.aoa_to_sheet(data);

      ws["!cols"] = [
        { wch: 30 },
        { wch: 20 },
        { wch: 25 },
        ...reportData.days.map(() => ({ wch: 10 })),
        { wch: 15 },
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
          fill: { fgColor: { rgb: "4472C4" } },
          alignment: { horizontal: "center", vertical: "center" },
          border: borderStyle,
        },
        info: {
          font: { bold: true, sz: 12 },
          border: borderStyle,
        },
        header: {
          font: { bold: true, color: { rgb: "FFFFFF" } },
          fill: { fgColor: { rgb: "4472C4" } },
          alignment: { horizontal: "center", vertical: "center" },
          border: borderStyle,
        },
        dataEven: {
          alignment: { horizontal: "center", vertical: "center" },
          border: borderStyle,
        },
        dataOdd: {
          fill: { fgColor: { rgb: "F2F2F2" } },
          alignment: { horizontal: "center", vertical: "center" },
          border: borderStyle,
        },
        total: {
          font: { bold: true },
          fill: { fgColor: { rgb: "FCE4D6" } },
          alignment: { horizontal: "center", vertical: "center" },
          border: borderStyle,
        },
        numberFormat: {
          t: "n",
          z: "#,##0.00",
        },
      };

      for (let i = 0; i < data.length; i++) {
        for (let j = 0; j < data[i].length; j++) {
          const cellAddress = XLSX.utils.encode_cell({ r: i, c: j });
          if (!ws[cellAddress]) continue;

          if (i === 0) {
            ws[cellAddress].s = styles.title;
          } else if (i === 1) {
            ws[cellAddress].s = styles.info;
          } else if (i === 3) {
            ws[cellAddress].s = styles.header;
          } else if (i >= 4 && i < data.length - 1) {
            ws[cellAddress].s = i % 2 === 0 ? styles.dataEven : styles.dataOdd;
            if (j >= 3) {
              ws[cellAddress].t = styles.numberFormat.t;
              ws[cellAddress].z = styles.numberFormat.z;
            }
          } else if (i === data.length - 1) {
            ws[cellAddress].s = styles.total;
            if (j >= 3) {
              ws[cellAddress].t = styles.numberFormat.t;
              ws[cellAddress].z = styles.numberFormat.z;
            }
          } else {
            ws[cellAddress].s = { border: borderStyle };
          }
        }
      }

      ws["!merges"] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: headers.length - 1 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: headers.length - 1 } },
        { s: { r: data.length - 1, c: 0 }, e: { r: data.length - 1, c: 2 } },
      ];

      XLSX.utils.book_append_sheet(wb, ws, "Full Sales Report");

      const fileName = `Full_Sales_Report_${reportData.month}.xlsx`;
      XLSX.writeFile(wb, fileName);

      toast.success("Full report exported to Excel successfully");
    } catch (error) {
      console.error("Error exporting full report to Excel:", error);
      toast.error("Failed to export report");
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <AdminSidebar />
      <div className="flex-1 overflow-auto p-4 md:p-8">
        <div className="max-w-full mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 px-6 py-4">
            <h1 className="text-2xl font-bold text-white">Full Sales Report</h1>
          </div>
          <div className="p-6 border-b border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Month
                </label>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Filter by Zone
                </label>
                <select
                  value={selectedZone}
                  onChange={(e) => setSelectedZone(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  disabled={!reportData}
                >
                  <option value="">All Zones</option>
                  {uniqueZones.map((zone) => (
                    <option key={zone} value={zone}>
                      {zone}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={generateReport}
                  disabled={isGenerating}
                  className={`w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-md shadow-sm flex items-center justify-center ${
                    isGenerating ? "opacity-50 cursor-not-allowed" : ""
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
          {reportData && (
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-800">
                  Report for {dayjs(reportData.month).format("MMMM YYYY")}
                </h2>
                <button
                  onClick={exportToExcel}
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
                  Export to Excel
                </button>
              </div>
              <div className="overflow-x-auto shadow-md rounded-lg max-h-[60vh]">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-indigo-600 sticky top-0 z-10">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                        User Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                        Zone
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                        Outlet
                      </th>
                      {reportData.days.map((day) => (
                        <th
                          key={day}
                          className="px-3 py-3 text-center text-xs font-medium text-white uppercase tracking-wider"
                        >
                          {dayjs(day).format("D")}
                        </th>
                      ))}
                      <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredUsers.map((user, index) => (
                      <tr
                        key={user.userId}
                        className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {user.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {user.zone}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {user.outlet}
                        </td>
                        {user.dailyTotals.map((total, dayIndex) => (
                          <td
                            key={dayIndex}
                            className="px-3 py-4 whitespace-nowrap text-sm text-right text-gray-900"
                          >
                            {total > 0 ? total.toFixed(2) : "-"}
                          </td>
                        ))}
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right text-gray-900">
                          {user.total.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-indigo-50 sticky bottom-0 z-10">
                    <tr>
                      <td
                        colSpan={3}
                        className="px-6 py-4 text-sm font-bold text-gray-900"
                      >
                        Total
                      </td>
                      {summary.dailySums.map((sum, index) => (
                        <td
                          key={index}
                          className="px-3 py-4 text-sm font-bold text-right text-gray-900"
                        >
                          {sum.toFixed(2)}
                        </td>
                      ))}
                      <td className="px-6 py-4 text-sm font-bold text-right text-gray-900">
                        {summary.grandTotal.toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FullSalesReport;