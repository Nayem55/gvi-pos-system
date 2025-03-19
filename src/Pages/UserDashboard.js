import React, { useState, useEffect } from "react";
import axios from "axios";
import { useLocation } from "react-router-dom";
import dayjs from "dayjs";

const UserDashboard = () => {
  const { search } = useLocation();
  const [reports, setReports] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(
    new URLSearchParams(search).get("month") || dayjs().format("YYYY-MM")
  );
  const [target, setTarget] = useState(null);
  const user = JSON.parse(localStorage.getItem("pos-user"));

  useEffect(() => {
    fetchDailyReports();
    fetchUserTarget();
  }, [user._id, selectedMonth]);

  // Fetch daily sales reports
  const fetchDailyReports = async () => {
    try {
      const response = await axios.get(
        `https://gvi-pos-server.vercel.app/sales-reports/${user._id}?month=${selectedMonth}`
      );
      setReports(response.data); 
    } catch (error) {
      console.error("Error fetching daily reports:", error);
    }
  };

  // Fetch the user's target for the selected month and year
  const fetchUserTarget = async () => {
    try {
      const year = selectedMonth.split("-")[0];
      const month = selectedMonth.split("-")[1];

      const response = await axios.get("https://gvi-pos-server.vercel.app/targets", {
        params: { year, month, userID: user._id },
      });

      const targetEntry = response.data.find(
        (entry) => entry.userID === user._id
      );
      if (targetEntry) {
        const targetForMonth = targetEntry.targets.find(
          (t) => t.year === parseInt(year) && t.month === parseInt(month)
        );
        if (targetForMonth) {
          setTarget(targetForMonth.target);
        }
      }
    } catch (error) {
      console.error("Error fetching user target:", error);
    }
  };

  // Calculate totals
  const totalMRP = reports.reduce((sum, report) => sum + (report.total_mrp || 0), 0);
  const totalTP = reports.reduce((sum, report) => sum + (report.total_tp || 0), 0);
  const totalProductsSold = reports.reduce(
    (sum, report) => sum + report.products.reduce((prodSum, product) => prodSum + product.quantity, 0),
    0
  );

  const percentageAchieved = target ? ((totalTP / target) * 100).toFixed(2) : 0;

  return (
    <div className="flex flex-col lg:flex-row bg-gray-100 min-h-screen">
      <div className="flex-1 p-6 lg:p-12">
        <div className="max-w-7xl mx-auto space-y-6">
          <h2 className="text-3xl font-semibold text-gray-800 mb-4">Sales Report</h2>

          {/* Select Month */}
          <div className="flex justify-between items-center mb-6 flex-col sm:flex-row">
            <div className="flex items-center mb-4 sm:mb-0">
              <label className="font-medium text-lg text-gray-700">Select Month: </label>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="ml-3 p-2 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="text-gray-700 font-medium">
              <span>{`Showing reports for: ${selectedMonth}`}</span>
            </div>
          </div>

          {/* Report Summary */}
          <div className="bg-white shadow-lg rounded-lg p-6 py-10 mb-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            <div className="flex gap-2">
              <span className="text-gray-600">Total Products Sold :</span>
              <span className="font-semibold text-gray-800">{totalProductsSold}</span>
            </div>
            <div className="flex gap-2">
              <span className="text-gray-600">Total MRP :</span>
              <span className="font-semibold text-gray-800">৳{totalMRP.toFixed(2)}</span>
            </div>
            <div className="flex gap-2">
              <span className="text-gray-600">Total TP :</span>
              <span className="font-semibold text-gray-800">৳{totalTP.toFixed(2)}</span>
            </div>
            <div className="flex gap-2">
              <span className="text-gray-600">Target Achieved :</span>
              <span className="font-semibold text-gray-800">
                {target ? `${percentageAchieved}%` : "No target set"}
              </span>
            </div>
          </div>

          {/* Daily Report Table */}
          <div className="bg-white shadow-lg rounded-lg p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Daily Sales</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto border-collapse border border-gray-300">
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
    </div>
  );
};

export default UserDashboard;
