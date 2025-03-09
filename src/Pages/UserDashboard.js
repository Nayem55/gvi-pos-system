import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useLocation } from "react-router-dom";
import dayjs from "dayjs";

const UserDashboard = () => {
  const { search } = useLocation(); // Get the query parameters (e.g., selected month)
  const [reports, setReports] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(new URLSearchParams(search).get("month") || dayjs().format("YYYY-MM"));
  const user = JSON.parse(localStorage.getItem("pos-user"))


  useEffect(() => {
    fetchDailyReports();
  }, [user._id, selectedMonth]);

  const fetchDailyReports = async () => {
    try {
      const response = await axios.get(
        `https://gvi-pos-server.vercel.app/sales-reports/${user._id}?month=${selectedMonth}`
      );
      setReports(response.data); // Store the fetched daily reports
    } catch (error) {
      console.error("Error fetching daily reports:", error);
    }
  };

  // Calculate the totals
  const totalMRP = reports.reduce((sum, report) => sum + (report.total_mrp || 0), 0);
  const totalTP = reports.reduce((sum, report) => sum + (report.total_tp || 0), 0);
  const totalProductsSold = reports.reduce(
    (sum, report) => sum + report.products.reduce((prodSum, product) => prodSum + product.quantity, 0),
    0
  );

  return (
    <div className="flex">
      <div className="flex-1 p-6 bg-gray-100">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-gray-800 mb-6">Sales Report</h2>

          {/* Select Month */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center">
              <label className="font-medium text-lg text-gray-700">Select Month: </label>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="ml-3 p-2 rounded-lg border border-gray-300"
              />
            </div>
            <div className="text-gray-700 font-medium">
              <span>{`Showing reports for: ${selectedMonth}`}</span>
            </div>
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
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
