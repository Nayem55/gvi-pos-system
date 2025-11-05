import React, { useState, useEffect } from "react";
import dayjs from "dayjs";
import * as XLSX from "xlsx";
import { toast } from "react-hot-toast";
import axios from "axios";
import AdminSidebar from "../../Component/AdminSidebar";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import JSZip from "jszip";
import { saveAs } from "file-saver";

const FullTDDReport = () => {
  const [selectedMonth, setSelectedMonth] = useState(dayjs().format("YYYY-MM"));
  const [reportData, setReportData] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedZone, setSelectedZone] = useState("");
  const [uniqueZones, setUniqueZones] = useState([]);
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);
  const [downloadingAll, setDownloadingAll] = useState(false);
  const user = JSON.parse(localStorage.getItem("pos-user") || "{}");

  // Get user role and determine access level
  const userRole = user?.role || "";
  const isSuperAdmin = userRole === "super admin";
  const isASM = userRole === "ASM";
  const isSOM = userRole === "SOM";
  const isSO = userRole === "SO";
  
  // Get user's zone for ASM/SOM filtering
  const userZone = user?.zone || "";

  // Generate summary report
  const generateReport = async () => {
    try {
      setIsGenerating(true);
      
      // For SO users, only fetch their own data
      if (isSO) {
        const response = await axios.get(
          "http://175.29.181.245:5000/tdda/admin-report",
          {
            params: {
              userId: user._id,
              month: selectedMonth,
            },
          }
        );
        
        // Transform single user report to full report format
        const userData = response.data;
        const transformedData = {
          month: selectedMonth,
          days: userData.dailyExpenses.map(expense => expense.date),
          users: [{
            userId: user.userId,
            name: userData.userInfo.name,
            zone: userData.userInfo.area || user.zone || "",
            outlet: userData.userInfo.designation || "",
            dailyTotals: userData.dailyExpenses.map(expense => 
              parseFloat(expense.totalExpense) || 0
            ),
            total: parseFloat(userData.summary.totalExpense) || 0
          }]
        };
        
        setReportData(transformedData);
        setUniqueZones([userData.userInfo.area || user.zone || ""]);
        setSelectedZone(userData.userInfo.area || user.zone || "");
      } else {
        // For other roles, fetch full report
        const response = await axios.get(
          "http://175.29.181.245:5000/tdda/full-report",
          {
            params: { month: selectedMonth },
          }
        );
        
        let filteredData = response.data;
        
        // Filter data based on role
        if (isASM || isSOM) {
          filteredData = {
            ...response.data,
            users: response.data.users.filter(u => 
              u.zone && userZone && u.zone.includes(userZone)
            )
          };
        }
        
        setReportData(filteredData);
        const zones = [...new Set(filteredData.users.map((u) => u.zone))].sort();
        setUniqueZones(zones);
        setSelectedZone("");
      }
      
      toast.success("Report generated successfully");
    } catch (error) {
      console.error("Error generating report:", error);
      toast.error(error.response?.data?.error || "Failed to generate report");
    } finally {
      setIsGenerating(false);
    }
  };

  // Fetch detailed report data for a specific user
  const fetchReportDataForUser = async (userId) => {
    try {
      const response = await axios.get(
        "http://175.29.181.245:5000/tdda/admin-report",
        {
          params: {
            userId: userId,
            month: selectedMonth,
          },
        }
      );

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

      return fixedData;
    } catch (error) {
      console.error(`Error fetching report data for user ${userId}:`, error);
      return null;
    }
  };

  // Generate PDF blob for a user's detailed report
  const generatePDFBlob = async (reportData) => {
    try {
      const doc = new jsPDF({
        orientation: "landscape",
      });

      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(68, 114, 196);
      doc.text(
        "Employee TD/DA Report",
        doc.internal.pageSize.getWidth() / 2,
        15,
        {
          align: "center",
        }
      );

      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "normal");
      doc.text(`Name: ${reportData.userInfo.name}`, 10, 25);
      doc.text(`Designation: ${reportData.userInfo.designation}`, 90, 25);
      doc.text(`Month: ${reportData.userInfo.month}`, 170, 25);
      doc.text(`Area: ${reportData.userInfo.area}`, 240, 25);

      autoTable(doc, {
        startY: 35,
        margin: { left: 10, right: 10 },
        tableWidth: "auto",
        head: [
          [
            { content: "Date" },
            { content: "Visited Place", colSpan: 2 },
            { content: "HQ" },
            { content: "Ex. HQ" },
            { content: "Transport Bill", colSpan: 4 },
            { content: "Hotel Bill" },
            { content: "Total" },
          ],
          ["", "From", "To", "", "", "Bus", "CNG", "Train", "Other", "", ""],
        ],
        body: reportData.dailyExpenses.map((day) => [
          day.date,
          day.from,
          day.to,
          day.hqExHq?.hq ? parseFloat(day.hqExHq.hq).toFixed(2) : "-",
          day.hqExHq?.exHq ? parseFloat(day.hqExHq.exHq).toFixed(2) : "-",
          day.transport?.bus ? parseFloat(day.transport.bus).toFixed(2) : "-",
          day.transport?.cng ? parseFloat(day.transport.cng).toFixed(2) : "-",
          day.transport?.train
            ? parseFloat(day.transport.train).toFixed(2)
            : "-",
          day.transport?.other
            ? parseFloat(day.transport.other).toFixed(2)
            : "-",
          day.hotelBill ? parseFloat(day.hotelBill).toFixed(2) : "-",
          day.totalExpense ? parseFloat(day.totalExpense).toFixed(2) : "-",
        ]),
        headStyles: {
          fillColor: [68, 114, 196],
          textColor: [255, 255, 255],
          fontStyle: "bold",
          halign: "center",
          valign: "middle",
        },
        styles: {
          fontSize: 10,
          halign: "center",
          valign: "middle",
          cellPadding: 2,
        },
        alternateRowStyles: {
          fillColor: [242, 242, 242],
        },
        columnStyles: {
          0: { cellWidth: 30 },
          1: { cellWidth: 30 },
          2: { cellWidth: 30 },
          3: { cellWidth: 25 },
          4: { cellWidth: 25 },
          5: { cellWidth: 20 },
          6: { cellWidth: 20 },
          7: { cellWidth: 20 },
          8: { cellWidth: 20 },
          9: { cellWidth: 25 },
          10: { cellWidth: 25 },
        },
      });

      const finalY = doc.lastAutoTable.finalY + 10;
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(
        `Total Working Days: ${reportData.summary.totalWorkingDays}`,
        10,
        finalY
      );
      doc.text(
        `Total Expense: ${parseFloat(
          reportData.summary.totalExpense || 0
        ).toFixed(2)}`,
        90,
        finalY
      );

      return doc.output("blob");
    } catch (error) {
      console.error("Error generating PDF blob:", error);
      return null;
    }
  };

  // Download all detailed reports as PDFs in a ZIP file, filtered by zone
  const downloadAllPDFs = async () => {
    if (!selectedMonth) {
      toast.error("Please select a month");
      return;
    }

    if (!reportData) {
      toast.error("Please generate the report first");
      return;
    }

    // SO users can only download their own PDF
    if (isSO) {
      try {
        setDownloadingAll(true);
        const detailedReport = await fetchReportDataForUser(user.userId);
        if (detailedReport && detailedReport.dailyExpenses.length > 0) {
          const pdfBlob = await generatePDFBlob(detailedReport);
          if (pdfBlob) {
            const fileName = `TADA_Report_${detailedReport.userInfo.name.replace(
              /\s+/g,
              "_"
            )}_${detailedReport.userInfo.month}.pdf`;
            saveAs(pdfBlob, fileName);
            toast.success("PDF report downloaded successfully");
          }
        } else {
          toast.error("No report data available");
        }
      } catch (error) {
        console.error("Error downloading PDF:", error);
        toast.error("Failed to download PDF report");
      } finally {
        setDownloadingAll(false);
      }
      return;
    }

    // For other roles, download multiple PDFs
    setDownloadingAll(true);
    const zip = new JSZip();
    const timestamp = dayjs().format("YYYYMMDD_HHmmss");

    try {
      const usersToProcess = selectedZone
        ? reportData.users.filter((user) => user.zone === selectedZone)
        : reportData.users;

      for (const user of usersToProcess) {
        const detailedReport = await fetchReportDataForUser(user.userId);
        if (detailedReport && detailedReport.dailyExpenses.length > 0) {
          const pdfBlob = await generatePDFBlob(detailedReport);
          if (pdfBlob) {
            const fileName = `TADA_Report_${detailedReport.userInfo.name.replace(
              /\s+/g,
              "_"
            )}_${detailedReport.userInfo.month}.pdf`;
            zip.file(fileName, pdfBlob);
          }
        }
      }

      if (Object.keys(zip.files).length === 0) {
        toast.error("No detailed reports available for the selected criteria");
        setDownloadingAll(false);
        return;
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const fileName = selectedZone
        ? `TADA_Reports_Zone_${selectedZone}_${selectedMonth}_${timestamp}.zip`
        : `All_Users_TADA_Reports_${selectedMonth}_${timestamp}.zip`;
      saveAs(zipBlob, fileName);
      toast.success("Detailed PDF reports downloaded successfully");
    } catch (error) {
      console.error("Error downloading detailed PDFs:", error);
      toast.error("Failed to download detailed PDF reports");
    } finally {
      setDownloadingAll(false);
    }
  };

  // Filtered users based on zone
  const filteredUsers =
    reportData?.users.filter(
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

  // Export summary to Excel
  const exportToExcel = () => {
    if (!reportData) return;

    try {
      const wb = XLSX.utils.book_new();

      const headers = [
        "User Name",
        "Zone",
        "Outlet",
        ...reportData.days.map((day) => dayjs(day).format("ddd, D")),
        "Total",
      ];

      const data = [
        ["Full TA/DA Report"],
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
        ...reportData.days.map(() => ({ wch: 12 })),
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

      XLSX.utils.book_append_sheet(wb, ws, "Full TDDA Report");

      const fileName = `Full_TDDA_Report_${reportData.month}.xlsx`;
      XLSX.writeFile(wb, fileName);

      toast.success("Full report exported to Excel successfully");
    } catch (error) {
      console.error("Error exporting full report to Excel:", error);
      toast.error("Failed to export report");
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {isSuperAdmin && <AdminSidebar />}
      <div className={`${isSuperAdmin ? "flex-1" : "w-full"} overflow-auto p-4 md:p-8`}>
        <div className="max-w-full mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 px-6 py-4">
            <h1 className="text-2xl font-bold text-white">
              {isSO ? "My TD/DA Report" : "Full TD/DA Report"}
            </h1>
            {!isSuperAdmin && (
              <p className="text-indigo-200 text-sm mt-1">
                Role: {userRole} {userZone && `| Zone: ${userZone}`}
              </p>
            )}
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
              
              {/* Zone filter - only show for Super Admin, ASM, and SOM */}
              {(isSuperAdmin || isASM || isSOM) && (
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
              )}
              
              <div className="flex items-end space-x-4">
                <button
                  onClick={generateReport}
                  disabled={isGenerating}
                  className={`flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-md shadow-sm flex items-center justify-center ${
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
                
                {/* Export button - show for all roles but with different options */}
                {(isSuperAdmin || isASM || isSOM || isSO) && (
                  <div className="relative flex-1">
                    <button
                      onClick={() => setExportDropdownOpen(!exportDropdownOpen)}
                      className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md shadow-sm flex items-center justify-center"
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
                      <div className="absolute top-12 left-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10">
                        <div
                          className="py-1"
                          role="menu"
                          aria-orientation="vertical"
                        >
                          {/* Excel export - only for Super Admin, ASM, SOM */}
                          {(isSuperAdmin || isASM || isSOM) && (
                            <button
                              onClick={() => {
                                exportToExcel();
                                setExportDropdownOpen(false);
                              }}
                              disabled={!reportData}
                              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                              role="menuitem"
                            >
                              Export to Excel
                            </button>
                          )}
                          
                          {/* PDF download - for all roles */}
                          <button
                            onClick={() => {
                              downloadAllPDFs();
                              setExportDropdownOpen(false);
                            }}
                            disabled={
                              downloadingAll || !reportData || !selectedMonth
                            }
                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                            role="menuitem"
                          >
                            {downloadingAll
                              ? "Downloading..."
                              : isSO 
                                ? "Download My PDF" 
                                : "Download All PDF"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
          {reportData && (
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-800">
                  Report for {dayjs(reportData.month).format("MMMM YYYY")}
                  {isSO && " - Personal Report"}
                  {(isASM || isSOM) && ` - ${userZone} Zone`}
                </h2>
              </div>
              <div className="overflow-x-auto shadow-md rounded-lg max-h-[60vh]">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-indigo-600 sticky top-0 z-10">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                        User Name
                      </th>
                      {(isSuperAdmin || isASM || isSOM) && (
                        <>
                          <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                            Zone
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                            Outlet
                          </th>
                        </>
                      )}
                      {reportData.days.map((day) => (
                        <th
                          key={day}
                          className="px-3 py-3 text-center text-xs font-medium text-white uppercase tracking-wider"
                          title={dayjs(day).format("YYYY-MM-DD")}
                        >
                          {dayjs(day).format("ddd, D")}
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
                        {(isSuperAdmin || isASM || isSOM) && (
                          <>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {user.zone}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {user.outlet}
                            </td>
                          </>
                        )}
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
                  {/* Show summary only for Super Admin, ASM, SOM (not for SO) */}
                  {(isSuperAdmin || isASM || isSOM) && summary && (
                    <tfoot className="bg-indigo-50 sticky bottom-0 z-10">
                      <tr>
                        <td
                          colSpan={isSuperAdmin ? 3 : 1}
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
                  )}
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FullTDDReport;