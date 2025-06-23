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

  // Export to Excel
  const exportToExcel = () => {
    if (!reportData) return;
    
    try {
      // Create a new workbook
      const wb = XLSX.utils.book_new();
      
      // Prepare data for the worksheet
      const data = [
        ["Employee TD/DA Report", "", "", "", "", "", "", "", "", "", ""],
        ["Name:", reportData.userInfo.name, "", "", "Designation:", reportData.userInfo.designation, "", "", "Month:", reportData.userInfo.month, ""],
        ["Area:", reportData.userInfo.area, "", "", "", "", "", "", "", "", ""],
        [],
        ["Date", "Visited Place", "", "HQ", "Ex. HQ", "TRANSPORT BILL", "", "", "Hotel Bill", "Total Expense", "IMS On Day"],
        ["", "From", "To", "", "", "Bus", "CNG", "Train", "", "", ""],
        ...reportData.dailyExpenses.map(day => [
          day.date,
          day.from,
          day.to,
          day.hq,
          day.exHq,
          day.transport?.bus || "",
          day.transport?.cng || "",
          day.transport?.train || "",
          day.hotelBill,
          day.totalExpense,
          day.imsOnDay
        ]),
        [],
        ["Total Working Days:", reportData.summary.totalWorkingDays],
        ["Total Expense:", typeof reportData.summary.totalExpense === 'number' 
          ? reportData.summary.totalExpense.toFixed(2) 
          : parseFloat(reportData.summary.totalExpense || 0).toFixed(2)]
      ];

      // Create worksheet
      const ws = XLSX.utils.aoa_to_sheet(data);
      
      // Set column widths
      ws['!cols'] = [
        {wch: 10}, {wch: 12}, {wch: 12}, {wch: 8}, {wch: 8}, 
        {wch: 8}, {wch: 8}, {wch: 8}, {wch: 10}, {wch: 12}, {wch: 10}
      ];

      // Merge cells
      ws['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 10 } },
        { s: { r: 4, c: 1 }, e: { r: 4, c: 2 } },
        { s: { r: 4, c: 5 }, e: { r: 4, c: 7 } }
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
        <div className="max-w-6xl mx-auto bg-white shadow-md rounded-lg overflow-hidden p-6">
          <h1 className="text-2xl font-bold text-center mb-6">TD/DA Admin Panel</h1>
          
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Select User</label>
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div className="flex items-end">
              <button
                onClick={generateReport}
                disabled={isGenerating || !selectedUser}
                className={`w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded flex items-center justify-center ${
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
          
          {/* Report Summary */}
          {reportData && (
            <div className="mb-6">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-4">
                <h2 className="text-lg font-semibold text-blue-800 mb-2">Report Summary</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Employee Name</p>
                    <p className="font-medium">{reportData.userInfo.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Designation</p>
                    <p className="font-medium">{reportData.userInfo.designation}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Month</p>
                    <p className="font-medium">{dayjs(reportData.userInfo.month).format('MMMM YYYY')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Working Days</p>
                    <p className="font-medium">{reportData.summary.totalWorkingDays}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Expense</p>
                    <p className="font-medium">
                      {typeof reportData.summary.totalExpense === 'number' 
                        ? reportData.summary.totalExpense.toFixed(2) 
                        : parseFloat(reportData.summary.totalExpense || 0).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
              
              <button
                onClick={exportToExcel}
                className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded flex items-center justify-center mb-4"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export to Excel
              </button>
            </div>
          )}
          
          {/* Daily Expenses Table */}
          {reportData && (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 p-2">Date</th>
                    <th className="border border-gray-300 p-2">From</th>
                    <th className="border border-gray-300 p-2">To</th>
                    <th className="border border-gray-300 p-2">HQ</th>
                    <th className="border border-gray-300 p-2">Ex. HQ</th>
                    <th className="border border-gray-300 p-2">Bus</th>
                    <th className="border border-gray-300 p-2">CNG</th>
                    <th className="border border-gray-300 p-2">Train</th>
                    <th className="border border-gray-300 p-2">Hotel Bill</th>
                    <th className="border border-gray-300 p-2">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.dailyExpenses.map((day, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="border border-gray-300 p-2 text-center">{day.date}</td>
                      <td className="border border-gray-300 p-2">{day.from}</td>
                      <td className="border border-gray-300 p-2">{day.to}</td>
                      <td className="border border-gray-300 p-2">{day.hq ? day.hqExHqAmount : '-'}</td>
                      <td className="border border-gray-300 p-2">{day.exHq ? day.hqExHqAmount : '-'}</td>
                      <td className="border border-gray-300 p-2 text-right">{day.transport?.bus || '-'}</td>
                      <td className="border border-gray-300 p-2 text-right">{day.transport?.cng || '-'}</td>
                      <td className="border border-gray-300 p-2 text-right">{day.transport?.train || '-'}</td>
                      <td className="border border-gray-300 p-2 text-right">{day.hotelBill || '-'}</td>
                      <td className="border border-gray-300 p-2 text-right font-medium">
                        {day.totalExpense || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TDDAdminPanel;