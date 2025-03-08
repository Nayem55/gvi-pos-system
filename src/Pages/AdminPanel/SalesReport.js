import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import AdminSidebar from "../../Component/AdminSidebar";

const SalesReport = () => {
  const [users, setUsers] = useState([]);
  const [salesReports, setSalesReports] = useState({});
  const [selectedMonth, setSelectedMonth] = useState(dayjs().format("YYYY-MM"));
  const navigate = useNavigate();

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (users.length > 0) {
      fetchSalesReports();
    }
  }, [users, selectedMonth]);

  const fetchUsers = async () => {
    try {
      const response = await axios.get("https://gvi-pos-server.vercel.app/getAllUser");
      setUsers(response.data);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const fetchSalesReports = async () => {
    const reports = {};
    for (const user of users) {
      try {
        const response = await axios.get(
          `https://gvi-pos-server.vercel.app/sales-reports/${user._id}?month=${selectedMonth}`
        );
        reports[user._id] = response.data;
      } catch (error) {
        console.error(`Error fetching sales report for ${user.name}:`, error);
      }
    }
    setSalesReports(reports);
  };

  return (
    <div className="flex">
      <AdminSidebar />
      <div className="p-4 w-full">
        <h2 className="text-2xl font-bold mb-4">Sales Reports</h2>
        <div className="mb-4">
          <label className="font-medium">Select Month: </label>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="border rounded p-2 ml-2"
          />
        </div>
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2">User</th>
              <th className="border p-2">Outlet</th>
              <th className="border p-2">Total Reports</th>
              {/* <th className="border p-2">Total Products Sold</th> */}
              <th className="border p-2">Total MRP</th>
              <th className="border p-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const reports = salesReports[user._id] || [];
              const totalReports = reports.length;
              {/* const totalProductsSold = reports.reduce((sum, report) => sum + (report.total_products || 0), 0); */}
              const totalMRP = reports.reduce((sum, report) => sum + (report.total_mrp || 0), 0);

              return (
                <tr key={user._id} className="border">
                  <td className="border p-2">{user.name}</td>
                  <td className="border p-2">{user.outlet}</td>
                  <td className="border p-2">{totalReports}</td>
                  {/* <td className="border p-2">{totalProductsSold}</td> */}
                  <td className="border p-2">৳{totalMRP.toFixed(2)}</td>
                  <td className="border p-2">
                    <button
                      className="bg-blue-500 text-white px-3 py-1 rounded"
                      onClick={() =>
                        navigate(`/sales-report/daily/${user._id}?month=${selectedMonth}`)
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
      </div>
    </div>
  );
};

export default SalesReport;
