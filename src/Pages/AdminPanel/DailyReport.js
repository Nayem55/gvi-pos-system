import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useLocation } from "react-router-dom";
import dayjs from "dayjs";
import AdminSidebar from "../../Component/AdminSidebar";

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

  useEffect(() => {
    fetchDailyReports();
  }, [userId, filterMonth, filterStartDate, filterEndDate]); // Only runs when filter values update

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
        `https://gvi-pos-server.vercel.app/sales-reports/${userId}`,
        { params }
      );
      setReports(response.data);
    } catch (error) {
      console.error("Error fetching daily reports:", error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate totals
  const totalMRP = reports.reduce((sum, report) => sum + (report.total_mrp || 0), 0);
  const totalTP = reports.reduce((sum, report) => sum + (report.total_tp || 0), 0);
  const totalProductsSold = reports.reduce(
    (sum, report) => sum + report.products.reduce((prodSum, product) => prodSum + product.quantity, 0),
    0
  );

  return (
    <div className="flex">
      <AdminSidebar />
      <div className="flex-1 p-6 bg-gray-100">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-gray-800 mb-6">Daily Sales Report</h2>

          {/* Filters */}
          <div className="mb-6 flex gap-4 items-end">
            <div>
              <label className="font-medium">Select Month: </label>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => {
                  setSelectedMonth(e.target.value);
                  setStartDate(""); // Clear date range when selecting month
                  setEndDate("");
                }}
                className="border rounded p-2 ml-2"
                disabled={startDate && endDate}
              />
            </div>
            <div>
              <label className="font-medium">Start Date: </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setSelectedMonth(""); // Clear month when selecting date range
                }}
                className="border rounded p-2"
              />
            </div>
            <div>
              <label className="font-medium">End Date: </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setSelectedMonth(""); // Clear month when selecting date range
                }}
                className="border rounded p-2"
              />
            </div>
            <button
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              onClick={() => {
                setFilterMonth(selectedMonth);
                setFilterStartDate(startDate);
                setFilterEndDate(endDate);
              }}
            >
              Filter Reports
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
          </div>

          {/* Report Summary */}
          <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Report Summary</h3>
            <div className="grid grid-cols-3 gap-6">
              <div className="flex gap-2">
                <span className="text-gray-600">Total Products Sold:</span>
                <span className="font-semibold text-gray-800">{totalProductsSold}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-gray-600">Total MRP:</span>
                <span className="font-semibold text-gray-800">৳{totalMRP.toFixed(2)}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-gray-600">Total TP:</span>
                <span className="font-semibold text-gray-800">৳{totalTP.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Daily Report Table */}
          {loading ? (
            <div className="flex justify-center items-center my-10">
              <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500"></div>
            </div>
          ) : (
            <div className="bg-white shadow-lg rounded-lg p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Daily Sales</h3>
              <table className="min-w-full table-auto border-collapse">
                <thead className="bg-gray-200">
                  <tr>
                    <th className="p-4 text-left font-medium text-gray-700">Date</th>
                    <th className="p-4 text-left font-medium text-gray-700">Products Sold</th>
                    <th className="p-4 text-left font-medium text-gray-700">Total MRP</th>
                    <th className="p-4 text-left font-medium text-gray-700">Total TP</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((report, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="p-4 text-gray-800">{dayjs(report.sale_date).format("YYYY-MM-DD")}</td>
                      <td className="p-4 text-gray-600">
                        {report.products.map((product, productIndex) => (
                          <div key={productIndex}>
                            {product.product_name} (Qty: {product.quantity})
                          </div>
                        ))}
                      </td>
                      <td className="p-4 text-gray-800">৳{report.total_mrp.toFixed(2)}</td>
                      <td className="p-4 text-gray-800">৳{report.total_tp.toFixed(2)}</td>
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

export default DailyReport;
