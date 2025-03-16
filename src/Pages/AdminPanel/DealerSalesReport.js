import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import AdminSidebar from "../../Component/AdminSidebar";

const DealerSalesReport = () => {
  const [users, setUsers] = useState([]);
  const [salesReports, setSalesReports] = useState({});
  const [selectedMonth, setSelectedMonth] = useState(dayjs().format("YYYY-MM"));
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (users.length > 0) {
      fetchSalesReports();
    }
  }, [users]); // Fetch reports only after users are loaded

  const fetchUsers = async () => {
    try {
      const response = await axios.get("https://gvi-pos-server.vercel.app/getAllUser");
      setUsers(response.data);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const fetchSalesReports = async () => {
    try {
      setLoading(true);
      setSalesReports({});

      let params = {};
      if (startDate && endDate) {
        params.startDate = startDate;
        params.endDate = endDate;
      } else {
        params.month = selectedMonth;
      }

      const reportPromises = users.map((user) =>
        axios
          .get(`https://gvi-pos-server.vercel.app/sales-reports/${user._id}`, { params })
          .then((response) => ({ userId: user._id, reportData: response.data }))
          .catch(() => ({ userId: user._id, reportData: [] }))
      );

      const reports = await Promise.all(reportPromises);

      const reportData = reports.reduce((acc, { userId, reportData }) => {
        acc[userId] = reportData;
        return acc;
      }, {});

      setSalesReports(reportData);
    } catch (error) {
      console.error("Error fetching sales reports:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex">
      <AdminSidebar />
      <div className="p-4 w-full">
        <h2 className="text-2xl font-bold mb-4">Sales Reports</h2>

        {/* Filters */}
        <div className="mb-4 flex gap-4 items-end">
          <div>
            <label className="font-medium">Select Month: </label>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="border rounded p-2 ml-2"
              disabled={startDate && endDate}
            />
          </div>
          <div>
            <label className="font-medium">Start Date: </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border rounded p-2"
            />
          </div>
          <div>
            <label className="font-medium">End Date: </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="border rounded p-2"
            />
          </div>
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            onClick={fetchSalesReports}
          >
            Filter Reports
          </button>
          <button
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            onClick={() => {
              setStartDate("");
              setEndDate("");
              fetchSalesReports(); // Fetch default month-wise report
            }}
          >
            Reset Dates
          </button>
        </div>

        {/* Sales Report Table */}
        {loading ? (
          <div className="flex justify-center items-center my-10">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500"></div>
          </div>
        ) : (
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2">User</th>
                <th className="border p-2">Outlet</th>
                <th className="border p-2">Total Reports</th>
                <th className="border p-2">Total MRP</th>
                <th className="border p-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const reports = salesReports[user._id] || [];
                const totalReports = reports.length;
                const totalMRP = reports.reduce(
                  (sum, report) => sum + (report.total_mrp || 0),
                  0
                );

                return (
                  <tr key={user._id} className="border">
                    <td className="border p-2">{user.name}</td>
                    <td className="border p-2">{user.outlet}</td>
                    <td className="border p-2">{totalReports}</td>
                    <td className="border p-2">৳{totalMRP.toFixed(2)}</td>
                    <td className="border p-2">
                      <button
                        className="bg-gray-800 text-white px-3 py-1 rounded"
                        onClick={() =>
                          navigate(
                            `/sales-report/daily/${user._id}?${
                              startDate && endDate
                                ? `startDate=${startDate}&endDate=${endDate}`
                                : `month=${selectedMonth}`
                            }`
                          )
                        }
                      >
                        View Daily Report
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default DealerSalesReport;
