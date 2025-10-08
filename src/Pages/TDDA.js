import React, { useState, useEffect } from "react";
import dayjs from "dayjs";
import * as XLSX from "xlsx";
import { toast } from "react-hot-toast";
import axios from "axios";
import AdminSidebar from "../Component/AdminSidebar";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import JSZip from "jszip";
import { saveAs } from "file-saver";

const TDDAdminPanel = () => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(dayjs().format("YYYY-MM"));
  const [reportData, setReportData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);
  const [downloadingAll, setDownloadingAll] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState(null);
  const [selectedDateForCount, setSelectedDateForCount] = useState(dayjs().format("YYYY-MM-DD"));
  const [submissionsCount, setSubmissionsCount] = useState(null);
  const [submissionUsers, setSubmissionUsers] = useState([]);
  const [isCounting, setIsCounting] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [selectedZone, setSelectedZone] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  console.log(exportDropdownOpen);

  // Fetch all users with TDDA records
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get("http://175.29.181.245:5000/tdda/users");
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

  // Generate report for a single user
  const generateReport = async () => {
    if (!selectedUser) {
      toast.error("Please select a user");
      return;
    }

    try {
      setIsGenerating(true);
      const response = await axios.get("http://175.29.181.245:5000/tdda/admin-report", {
        params: {
          userId: selectedUser,
          month: selectedMonth,
        },
      });

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

  // Fetch report data for a specific user
  const fetchReportDataForUser = async (userId) => {
    try {
      const response = await axios.get("http://175.29.181.245:5000/tdda/admin-report", {
        params: {
          userId: userId,
          month: selectedMonth,
        },
      });

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

  // Generate PDF blob for a user's report
  const generatePDFBlob = async (reportData) => {
    try {
      const doc = new jsPDF({
        orientation: "landscape",
      });

      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(68, 114, 196);
      doc.text("Employee TD/DA Report", doc.internal.pageSize.getWidth() / 2, 15, {
        align: "center",
      });

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
          [
            "",
            "From",
            "To",
            "",
            "",
            "Bus",
            "CNG",
            "Train",
            "Other",
            "",
            "",
          ],
        ],
        body: reportData.dailyExpenses.map((day) => [
          day.date,
          day.from,
          day.to,
          day.hqExHq?.hq ? parseFloat(day.hqExHq.hq).toFixed(2) : "-",
          day.hqExHq?.exHq ? parseFloat(day.hqExHq.exHq).toFixed(2) : "-",
          day.transport?.bus ? parseFloat(day.transport.bus).toFixed(2) : "-",
          day.transport?.cng ? parseFloat(day.transport.cng).toFixed(2) : "-",
          day.transport?.train ? parseFloat(day.transport.train).toFixed(2) : "-",
          day.transport?.other ? parseFloat(day.transport.other).toFixed(2) : "-",
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
      doc.text(`Total Working Days: ${reportData.summary.totalWorkingDays}`, 10, finalY);
      doc.text(
        `Total Expense: ${parseFloat(reportData.summary.totalExpense || 0).toFixed(2)}`,
        90,
        finalY
      );

      return doc.output("blob");
    } catch (error) {
      console.error("Error generating PDF blob:", error);
      return null;
    }
  };

  // Download all users' reports as PDFs in a ZIP file
  const downloadAllPDFs = async () => {
    if (!selectedMonth) {
      toast.error("Please select a month");
      return;
    }

    setDownloadingAll(true);
    const zip = new JSZip();
    const timestamp = dayjs().format("YYYYMMDD_HHmmss");

    try {
      for (const user of users) {
        const reportData = await fetchReportDataForUser(user._id);
        if (reportData && reportData.dailyExpenses.length > 0) {
          const pdfBlob = await generatePDFBlob(reportData);
          if (pdfBlob) {
            const fileName = `TADA_Report_${reportData.userInfo.name.replace(/\s+/g, "_")}_${reportData.userInfo.month}.pdf`;
            zip.file(fileName, pdfBlob);
          }
        }
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });
      saveAs(zipBlob, `All_Users_TADA_Reports_${timestamp}.zip`);
      toast.success("All PDF reports downloaded successfully");
    } catch (error) {
      console.error("Error downloading all PDFs:", error);
      toast.error("Failed to download all PDF reports");
    } finally {
      setDownloadingAll(false);
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
      name: reportData.userInfo.name,
      designation: reportData.userInfo.designation,
      area: reportData.userInfo.area,
      userId: selectedUser,
    });
    setEditModalOpen(true);
  };

  // Handle edit form change
  const handleEditChange = (field, value, subfield = null) => {
    setEditForm((prev) => {
      if (subfield) {
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
      generateReport();
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
      generateReport();
    } catch (error) {
      console.error("Error deleting record:", error);
      toast.error("Failed to delete record");
    }
  };

  // Get submission count and user status
  const getSubmissionCount = async () => {
    try {
      setIsCounting(true);
      const response = await axios.get("http://175.29.181.245:5000/tdda/count-by-date", {
        params: { date: selectedDateForCount }
      });
      setSubmissionsCount(response.data.count);
      setSubmissionUsers(response.data.users);
      setSelectedZone("");
      setSelectedStatus("");
      setStatusModalOpen(true);
      toast.success("Submission data fetched successfully");
    } catch (error) {
      console.error("Error fetching submission count:", error);
      toast.error("Failed to fetch submission data");
    } finally {
      setIsCounting(false);
    }
  };

  // Get unique zones for filter dropdown
  const uniqueZones = [...new Set(submissionUsers.map(user => user.zone))].sort();

  // Filter users by selected zone and status
  const filteredUsers = submissionUsers.filter(user => {
    const zoneMatch = !selectedZone || user.zone === selectedZone;
    const statusMatch = !selectedStatus || 
      (selectedStatus === "submitted" && user.submitted) ||
      (selectedStatus === "not-submitted" && !user.submitted);
    return zoneMatch && statusMatch;
  });

  // Export submission status to Excel
  const exportStatusToExcel = () => {
    try {
      const wb = XLSX.utils.book_new();

      const data = [
        ["TD/DA Submission Status Report"],
        [`Date: ${selectedDateForCount}`],
        [""],
        ["User Name", "Zone", "Status"]
      ];

      filteredUsers.forEach(user => {
        data.push([
          user.name,
          user.zone,
          user.submitted ? "Submitted" : "Not Submitted"
        ]);
      });

      data.push([""]);
      data.push(["Total Users", submissionUsers.length]);
      data.push(["Submitted Users", submissionsCount]);
      data.push(["Not Submitted Users", submissionUsers.length - submissionsCount]);

      const ws = XLSX.utils.aoa_to_sheet(data);

      ws["!cols"] = [
        { wch: 30 },
        { wch: 20 },
        { wch: 15 }
      ];

      const borderStyle = {
        top: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
        left: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } },
      };

      for (let i = 0; i < data.length; i++) {
        for (let j = 0; j < data[i].length; j++) {
          const cellAddress = XLSX.utils.encode_cell({ r: i, c: j });

          if (!ws[cellAddress]) continue;

          if (i === 0) {
            ws[cellAddress].s = {
              font: { bold: true, sz: 16, color: { rgb: "FFFFFF" } },
              fill: { fgColor: { rgb: "4472C4" } },
              alignment: { horizontal: "center", vertical: "center" },
              border: borderStyle,
            };
          } else if (i === 1) {
            ws[cellAddress].s = {
              font: { bold: true, sz: 12 },
              border: borderStyle,
            };
          } else if (i === 3) {
            ws[cellAddress].s = {
              font: { bold: true, color: { rgb: "FFFFFF" } },
              fill: { fgColor: { rgb: "4472C4" } },
              alignment: { horizontal: "center", vertical: "center" },
              border: borderStyle,
            };
          } else if (i >= data.length - 3 && i <= data.length - 1) {
            ws[cellAddress].s = {
              font: { bold: true },
              fill: { fgColor: { rgb: "FCE4D6" } },
              alignment: { horizontal: "center", vertical: "center" },
              border: borderStyle,
            };
          } else if (i > 3 && i < data.length - 3) {
            ws[cellAddress].s = {
              alignment: { horizontal: "center", vertical: "center" },
              border: borderStyle,
            };
          } else {
            ws[cellAddress].s = { border: borderStyle };
          }
        }
      }

      ws["!merges"] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 2 } },
      ];

      XLSX.utils.book_append_sheet(wb, ws, "Submission Status");

      const fileName = `TDDA_Submission_Status_${selectedDateForCount}.xlsx`;

      XLSX.writeFile(wb, fileName);

      toast.success("Submission status exported to Excel successfully");
    } catch (error) {
      console.error("Error exporting submission status to Excel:", error);
      toast.error("Failed to export submission status");
    }
  };

  // Export to Excel
  const exportToExcel = () => {
    if (!reportData) return;

    try {
      const wb = XLSX.utils.book_new();

      const data = [
        ["Employee TD/DA Report", "", "", "", "", "", "", "", "", ""],
        [
          "Name:",
          reportData.userInfo.name,
          "",
          "Designation:",
          reportData.userInfo.designation,
          "",
          "Month:",
          reportData.userInfo.month,
          "",
          "",
        ],
        ["Area:", reportData.userInfo.area, "", "", "", "", "", "", "", ""],
        [""],
        [
          "Date",
          "Visited Place",
          "",
          "HQ",
          "Ex. HQ",
          "Transport Bill",
          "",
          "",
          "",
          "Hotel Bill",
          "Total",
        ],
        ["", "From", "To", "", "", "Bus", "CNG", "Train", "Other", "", ""],
        ...reportData.dailyExpenses.map((day) => [
          day.date,
          day.from,
          day.to,
          day.hqExHq?.hq ? parseFloat(day.hqExHq.hq).toFixed(2) : "-",
          day.hqExHq?.exHq ? parseFloat(day.hqExHq.exHq).toFixed(2) : "-",
          day.transport?.bus ? parseFloat(day.transport.bus).toFixed(2) : "-",
          day.transport?.cng ? parseFloat(day.transport.cng).toFixed(2) : "-",
          day.transport?.train ? parseFloat(day.transport.train).toFixed(2) : "-",
          day.transport?.other ? parseFloat(day.transport.other).toFixed(2) : "-",
          day.hotelBill ? parseFloat(day.hotelBill).toFixed(2) : "-",
          day.totalExpense ? parseFloat(day.totalExpense).toFixed(2) : "-",
        ]),
        [""],
        [
          "Total Working Days:",
          reportData.summary.totalWorkingDays,
          "",
          "",
          "",
          "",
          "",
          "",
          "",
          "",
          "",
        ],
        [
          "Total Expense:",
          parseFloat(reportData.summary.totalExpense || 0).toFixed(2),
          "",
          "",
          "",
          "",
          "",
          "",
          "",
          "",
          "",
        ],
      ];

      const ws = XLSX.utils.aoa_to_sheet(data);

      ws["!cols"] = [
        { wch: 12 },
        { wch: 15 },
        { wch: 15 },
        { wch: 10 },
        { wch: 10 },
        { wch: 8 },
        { wch: 8 },
        { wch: 8 },
        { wch: 8 },
        { wch: 12 },
        { wch: 12 },
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
        mainHeader: {
          font: { bold: true, color: { rgb: "FFFFFF" } },
          fill: { fgColor: { rgb: "4472C4" } },
          alignment: { horizontal: "center", vertical: "center" },
          border: borderStyle,
        },
        subHeader: {
          font: { bold: true, color: { rgb: "FFFFFF" } },
          fill: { fgColor: { rgb: "5B9BD5" } },
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
          } else if (i >= 1 && i <= 2) {
            ws[cellAddress].s = styles.info;
          } else if (i === 4) {
            ws[cellAddress].s = styles.mainHeader;
          } else if (i === 5) {
            ws[cellAddress].s = styles.subHeader;
          } else if (i >= 6 && i < data.length - 3 && data[i][0]) {
            ws[cellAddress].s = i % 2 === 0 ? styles.dataEven : styles.dataOdd;
            if (j >= 3 && j <= 10) {
              ws[cellAddress].t = styles.numberFormat.t;
              ws[cellAddress].z = styles.numberFormat.z;
            }
          } else if (i >= data.length - 2) {
            ws[cellAddress].s = styles.total;
            if (j === 1) {
              ws[cellAddress].t = styles.numberFormat.t;
              ws[cellAddress].z = styles.numberFormat.z;
            }
          } else {
            ws[cellAddress].s = { border: borderStyle };
          }
        }
      }

      ws["!merges"] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 10 } },
        { s: { r: 4, c: 1 }, e: { r: 4, c: 2 } },
        { s: { r: 4, c: 5 }, e: { r: 4, c: 8 } },
        { s: { r: data.length - 2, c: 0 }, e: { r: data.length - 2, c: 1 } },
        { s: { r: data.length - 1, c: 0 }, e: { r: data.length - 1, c: 1 } },
      ];

      XLSX.utils.book_append_sheet(wb, ws, "TDDA Report");

      const fileName = `TADA_Report_${reportData.userInfo.name.replace(
        /\s+/g,
        "_"
      )}_${reportData.userInfo.month}.xlsx`;

      XLSX.writeFile(wb, fileName);

      toast.success("Excel report downloaded successfully");
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      toast.error("Failed to export report");
    }
  };

  // Export to PDF
  const exportToPDF = () => {
    if (!reportData) return;

    try {
      const doc = new jsPDF({
        orientation: "landscape",
      });

      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(68, 114, 196);
      doc.text("Employee TD/DA Report", doc.internal.pageSize.getWidth() / 2, 15, {
        align: "center",
      });

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
          [
            "",
            "From",
            "To",
            "",
            "",
            "Bus",
            "CNG",
            "Train",
            "Other",
            "",
            "",
          ],
        ],
        body: reportData.dailyExpenses.map((day) => [
          day.date,
          day.from,
          day.to,
          day.hqExHq?.hq ? parseFloat(day.hqExHq.hq).toFixed(2) : "-",
          day.hqExHq?.exHq ? parseFloat(day.hqExHq.exHq).toFixed(2) : "-",
          day.transport?.bus ? parseFloat(day.transport.bus).toFixed(2) : "-",
          day.transport?.cng ? parseFloat(day.transport.cng).toFixed(2) : "-",
          day.transport?.train ? parseFloat(day.transport.train).toFixed(2) : "-",
          day.transport?.other ? parseFloat(day.transport.other).toFixed(2) : "-",
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
      doc.text(`Total Working Days: ${reportData.summary.totalWorkingDays}`, 10, finalY);
      doc.text(
        `Total Expense: ${parseFloat(reportData.summary.totalExpense || 0).toFixed(2)}`,
        90,
        finalY
      );

      const fileName = `TADA_Report_${reportData.userInfo.name.replace(
        /\s+/g,
        "_"
      )}_${reportData.userInfo.month}.pdf`;

      doc.save(fileName);
      toast.success("PDF report downloaded successfully");
    } catch (error) {
      console.error("Error exporting to PDF:", error);
      toast.error("Failed to export PDF report");
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <AdminSidebar />
      <div className="flex-1 overflow-auto p-4 md:p-8">
        <div className="max-w-6xl mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-6 py-4">
            <h1 className="text-2xl font-bold text-white">TA/DA Admin Panel</h1>
          </div>
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
              <div className="flex items-end space-x-4">
                <button
                  onClick={getSubmissionCount}
                  disabled={isCounting}
                  className={`flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-md shadow-sm flex items-center justify-center ${
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
                    <div className="absolute top-[-80px] left-[170px] mt-2 w-48 bg-white rounded-md shadow-lg z-10">
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
                          disabled={!reportData}
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
                          disabled={!reportData}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                          role="menuitem"
                        >
                          Export to PDF
                        </button>
                        <button
                          onClick={() => {
                            downloadAllPDFs();
                            setExportDropdownOpen(false);
                          }}
                          disabled={downloadingAll}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                          role="menuitem"
                        >
                          {downloadingAll ? "Downloading..." : "Download All PDFs"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              {submissionsCount !== null && (
                <div className="bg-blue-50 p-3 rounded-md shadow-sm">
                  <p className="text-sm text-gray-600">Number of Users Submitted</p>
                  <p className="font-medium text-gray-900">{submissionsCount}</p>
                </div>
              )}
            </div>
          </div>
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
            </div>
          )}
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
      {editModalOpen && editForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto relative">
            <button
              onClick={() => setEditModalOpen(false)}
              className="absolute top-4 right-4 text-gray-600 hover:text-gray-800"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
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
      {deleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-sm w-full relative">
            <button
              onClick={() => setDeleteModalOpen(false)}
              className="absolute top-4 right-4 text-gray-600 hover:text-gray-800"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
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
      {statusModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-4xl w-full max-h-[80vh] overflow-y-auto relative">
            <button
              onClick={() => setStatusModalOpen(false)}
              className="absolute top-4 right-4 text-gray-600 hover:text-gray-800"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            <h2 className="text-xl font-bold mb-4">Submission Status for {selectedDateForCount}</h2>
            <p className="text-sm text-gray-600 mb-4">Total Submissions: {submissionsCount} / {submissionUsers.length}</p>
            
            <div className="flex justify-end mb-4">
              <button
                onClick={exportStatusToExcel}
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
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Filter by Zone
                </label>
                <select
                  value={selectedZone}
                  onChange={(e) => setSelectedZone(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Zones</option>
                  {uniqueZones.map((zone) => (
                    <option key={zone} value={zone}>
                      {zone}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Filter by Status
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Status</option>
                  <option value="submitted">Submitted</option>
                  <option value="not-submitted">Not Submitted</option>
                </select>
              </div>
            </div>
            
            <div className="border-t border-gray-200">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="p-2 text-left text-sm font-medium text-gray-700">User Name</th>
                    <th className="p-2 text-left text-sm font-medium text-gray-700">Zone</th>
                    <th className="p-2 text-left text-sm font-medium text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user, index) => (
                    <tr
                      key={user.userId}
                      className={`${index % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-gray-100`}
                    >
                      <td className="p-2 border-b border-gray-200">{user.name}</td>
                      <td className="p-2 border-b border-gray-200">{user.zone}</td>
                      <td className="p-2 border-b border-gray-200">
                        <span
                          className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                            user.submitted
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {user.submitted ? "Submitted" : "Not Submitted"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TDDAdminPanel;