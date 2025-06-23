import React, { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import * as XLSX from 'xlsx';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import AdminSidebar from '../Component/AdminSidebar';

const TDDAdminPanel = () => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(dayjs().format('YYYY-MM'));
  const [reportData, setReportData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Fetch all users with TDDA records
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get('https://gvi-pos-server.vercel.app/tdda/users');
        setUsers(response.data);
      } catch (error) {
        console.error('Error fetching users:', error);
        toast.error('Failed to load users');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUsers();
  }, []);

  // Generate report
  const generateReport = async () => {
    if (!selectedUser) {
      toast.error('Please select a user');
      return;
    }
    
    try {
      setIsGenerating(true);
      const response = await axios.get('https://gvi-pos-server.vercel.app/tdda/admin-report', {
        params: {
          userId: selectedUser,
          month: selectedMonth
        }
      });
      
      // Fix the summary.totalExpense if it's malformed
      const fixedData = response.data;
      if (typeof fixedData.summary.totalExpense === 'string' && fixedData.summary.totalExpense.includes('[object Object]')) {
        fixedData.summary.totalExpense = fixedData.dailyExpenses.reduce((sum, day) => 
          sum + (parseFloat(day.totalExpense) || 0), 0);
      }
      
      setReportData(fixedData);
      toast.success('Report generated successfully');
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error(error.response?.data?.error || 'Failed to generate report');
    } finally {
      setIsGenerating(false);
    }
  };

  // Export to Excel with professional styling
  const exportToExcel = () => {
    if (!reportData) return;
    
    try {
      // Create a new workbook
      const wb = XLSX.utils.book_new();
      
      // Prepare data for the worksheet
      const data = [
        // Title row
        ["Employee TD/DA Report", "", "", "", "", "", "", "", "", ""],
        // Employee info
        ["Name:", reportData.userInfo.name, "", "Designation:", reportData.userInfo.designation, "", "Month:", reportData.userInfo.month, "", ""],
        ["Area:", reportData.userInfo.area, "", "", "", "", "", "", "", ""],
        // Empty row
        [""],
        // Table headers
        ["Date", "Visited Place", "HQ", "Ex. HQ", "Transport Bill", "Hotel Bill", "Total Expense", "IMS On Day", "", ""],
        ["", "From", "To", "", "", "Bus", "CNG", "Train", "", ""],
        // Daily expenses data
        ...reportData.dailyExpenses.map(day => [
          day.date,
          day.from,
          day.to,
          day.hq || "-",
          day.exHq || "-",
          day.transport?.bus || "-",
          day.transport?.cng || "-",
          day.transport?.train || "-",
          day.hotelBill || "-",
          day.totalExpense || "-"
        ]),
        // Empty row
        [""],
        // Summary
        ["Total Working Days:", reportData.summary.totalWorkingDays, "", "", "", "", "", "", "", ""],
        ["Total Expense:", typeof reportData.summary.totalExpense === 'number' 
          ? reportData.summary.totalExpense.toFixed(2) 
          : parseFloat(reportData.summary.totalExpense || 0).toFixed(2), "", "", "", "", "", "", "", ""]
      ];

      // Create worksheet
      const ws = XLSX.utils.aoa_to_sheet(data);
      
      // Set column widths
      ws['!cols'] = [
        {wch: 12},  // Date
        {wch: 15},  // From (Visited Place)
        {wch: 15},  // To (Visited Place)
        {wch: 10},  // HQ
        {wch: 10},  // Ex HQ
        {wch: 8},   // Bus
        {wch: 8},   // CNG
        {wch: 8},   // Train
        {wch: 12},  // Hotel Bill
        {wch: 12}   // Total Expense
      ];

      // Define cell styles
      const styles = {
        title: { 
          font: { bold: true, sz: 16, color: { rgb: "000000" } }, 
          alignment: { horizontal: "center" },
          fill: { fgColor: { rgb: "D9E1F2" } }
        },
        header: { 
          font: { bold: true, color: { rgb: "FFFFFF" } }, 
          fill: { fgColor: { rgb: "4472C4" } },
          border: {
            top: { style: "thin", color: { rgb: "000000" } },
            bottom: { style: "thin", color: { rgb: "000000" } },
            left: { style: "thin", color: { rgb: "000000" } },
            right: { style: "thin", color: { rgb: "000000" } }
          }
        },
        subHeader: {
          font: { bold: true },
          fill: { fgColor: { rgb: "B4C6E7" } },
          border: {
            top: { style: "thin", color: { rgb: "000000" } },
            bottom: { style: "thin", color: { rgb: "000000" } },
            left: { style: "thin", color: { rgb: "000000" } },
            right: { style: "thin", color: { rgb: "000000" } }
          }
        },
        data: {
          border: {
            top: { style: "thin", color: { rgb: "000000" } },
            bottom: { style: "thin", color: { rgb: "000000" } },
            left: { style: "thin", color: { rgb: "000000" } },
            right: { style: "thin", color: { rgb: "000000" } }
          }
        },
        summary: {
          font: { bold: true },
          fill: { fgColor: { rgb: "FCE4D6" } },
          border: {
            top: { style: "thin", color: { rgb: "000000" } },
            bottom: { style: "thin", color: { rgb: "000000" } },
            left: { style: "thin", color: { rgb: "000000" } },
            right: { style: "thin", color: { rgb: "000000" } }
          }
        }
      };

      // Apply styles to cells
      for (let i = 0; i < data.length; i++) {
        for (let j = 0; j < data[i].length; j++) {
          const cellAddress = XLSX.utils.encode_cell({ r: i, c: j });
          
          if (i === 0) { // Title row
            ws[cellAddress].s = styles.title;
          } else if (i === 4) { // Main header row
            ws[cellAddress].s = styles.header;
          } else if (i === 5) { // Sub-header row
            ws[cellAddress].s = styles.subHeader;
          } else if (i >= 6 && i < data.length - 3 && data[i][0]) { // Data rows
            ws[cellAddress].s = styles.data;
            if (j === 9) { // Total Expense column
              ws[cellAddress].t = 'n'; // Set as number type
              ws[cellAddress].z = '#,##0.00'; // Format with 2 decimal places
            }
          } else if (i >= data.length - 2) { // Summary rows
            ws[cellAddress].s = styles.summary;
          }
        }
      }

      // Merge cells
      ws['!merges'] = [
        // Title merge
        { s: { r: 0, c: 0 }, e: { r: 0, c: 9 } },
        // Visited Place header merge
        { s: { r: 4, c: 1 }, e: { r: 4, c: 2 } },
        // Transport Bill header merge
        { s: { r: 4, c: 4 }, e: { r: 4, c: 7 } },
        // Summary merges
        { s: { r: data.length - 2, c: 0 }, e: { r: data.length - 2, c: 1 } },
        { s: { r: data.length - 1, c: 0 }, e: { r: data.length - 1, c: 1 } }
      ];

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, "TDDA Report");
      
      // Generate file name
      const fileName = `TDDA_Report_${reportData.userInfo.name.replace(/\s+/g, '_')}_${reportData.userInfo.month}.xlsx`;
      
      // Export the workbook
      XLSX.writeFile(wb, fileName);
      
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      toast.error('Failed to export report');
    }
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Select User</label>
                <select
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  disabled={isLoading}
                >
                  <option value="">Select a user</option>
                  {users?.map(user => (
                    <option key={user._id} value={user._id}>
                      {user.name} ({user.designation || user.role})
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Month</label>
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
                    (isGenerating || !selectedUser) ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isGenerating ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
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
          
          {/* Report Summary */}
          {reportData && (
            <div className="p-6 border-b border-gray-200">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-4">
                <h2 className="text-lg font-semibold text-blue-800 mb-3">Report Summary</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white p-3 rounded-md shadow-sm">
                    <p className="text-sm text-gray-600">Employee Name</p>
                    <p className="font-medium text-gray-900">{reportData.userInfo.name}</p>
                  </div>
                  <div className="bg-white p-3 rounded-md shadow-sm">
                    <p className="text-sm text-gray-600">Designation</p>
                    <p className="font-medium text-gray-900">{reportData.userInfo.designation}</p>
                  </div>
                  <div className="bg-white p-3 rounded-md shadow-sm">
                    <p className="text-sm text-gray-600">Month</p>
                    <p className="font-medium text-gray-900">{dayjs(reportData.userInfo.month).format('MMMM YYYY')}</p>
                  </div>
                  <div className="bg-white p-3 rounded-md shadow-sm">
                    <p className="text-sm text-gray-600">Total Working Days</p>
                    <p className="font-medium text-gray-900">{reportData.summary.totalWorkingDays}</p>
                  </div>
                  <div className="bg-white p-3 rounded-md shadow-sm">
                    <p className="text-sm text-gray-600">Total Expense</p>
                    <p className="font-medium text-gray-900">
                      {typeof reportData.summary.totalExpense === 'number' 
                        ? reportData.summary.totalExpense.toFixed(2) 
                        : parseFloat(reportData.summary.totalExpense || 0).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end">
                <button
                  onClick={exportToExcel}
                  className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md shadow-sm flex items-center justify-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Export to Excel
                </button>
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
                      <th className="p-3 text-left" colSpan="2">Visited Place</th>
                      <th className="p-3 text-left">HQ</th>
                      <th className="p-3 text-left">Ex. HQ</th>
                      <th className="p-3 text-left" colSpan="3">Transport Bill</th>
                      <th className="p-3 text-left">Hotel Bill</th>
                      <th className="p-3 text-left">Total</th>
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
                      <th></th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.dailyExpenses.map((day, index) => (
                      <tr key={index} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-gray-100`}>
                        <td className="p-3 border-b border-gray-200">{day.date}</td>
                        <td className="p-3 border-b border-gray-200">{day.from}</td>
                        <td className="p-3 border-b border-gray-200">{day.to}</td>
                        <td className="p-3 border-b border-gray-200">{day.hq? day.hqExHqAmount : '-'}</td>
                        <td className="p-3 border-b border-gray-200">{day.exHq? day.hqExHqAmount : '-'}</td>
                        <td className="p-3 border-b border-gray-200">{day.transport?.bus || '-'}</td>
                        <td className="p-3 border-b border-gray-200">{day.transport?.cng || '-'}</td>
                        <td className="p-3 border-b border-gray-200">{day.transport?.train || '-'}</td>
                        <td className="p-3 border-b border-gray-200">{day.hotelBill || '-'}</td>
                        <td className="p-3 border-b border-gray-200 font-semibold">
                          {day.totalExpense || '-'}
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
    </div>
  );
};

export default TDDAdminPanel;