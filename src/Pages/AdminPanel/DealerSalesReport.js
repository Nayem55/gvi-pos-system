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
  const [selectedRole, setSelectedRole] = useState(""); // Empty string shows all roles
  const navigate = useNavigate();

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (users.length > 0) {
      fetchSalesReports();
    }
  }, [users]);

  const fetchUsers = async () => {
    try {
      const response = await axios.get(
        "https://gvi-pos-server.vercel.app/getAllUser"
      );
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
          .get(`https://gvi-pos-server.vercel.app/sales-reports/${user._id}`, {
            params,
          })
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
  // Filter users by selected role
  const filteredUsers = selectedRole
    ? users.filter((user) => user.role === selectedRole)
    : users.filter((user) => !["ASM", "RSM", "SOM"].includes(user.role)); // Exclude managers in "All Roles" view

  // Aggregating Reports for ASM, RSM, and SOM
  const aggregatedReports = filteredUsers.map((user) => {
    let totalReports = 0;
    let totalMRP = 0;

    if (user.role === "ASM" || user.role === "RSM" || user.role === "SOM") {
      // When specific manager role is selected, show their aggregated reports
      const assignedSOs = users.filter((u) => u.zone.includes(user.zone));
      totalReports = assignedSOs.reduce(
        (sum, so) => sum + (salesReports[so._id]?.length || 0),
        0
      );
      totalMRP = assignedSOs.reduce(
        (sum, so) =>
          sum +
          (salesReports[so._id]?.reduce(
            (subSum, report) => subSum + (report.total_mrp || 0),
            0
          ) || 0),
        0
      );
    } else {
      // Regular users (SO, SELF, COMMISSION)
      totalReports = salesReports[user._id]?.length || 0;
      totalMRP =
        salesReports[user._id]?.reduce(
          (sum, report) => sum + (report.total_mrp || 0),
          0
        ) || 0;
    }

    return {
      userId: user._id,
      name: user.name,
      outlet: user.outlet,
      role: user.role,
      totalReports,
      totalMRP,
    };
  });

  // Calculate Summary Data based on filtered users
  const totalDealers = filteredUsers.length;
  const totalReports = aggregatedReports.reduce(
    (sum, user) => sum + user.totalReports,
    0
  );
  const totalMRP = aggregatedReports.reduce(
    (sum, user) => sum + user.totalMRP,
    0
  );

  return (
    <div className="flex">
      <AdminSidebar />
      <div className="p-4 w-full">
        <h2 className="text-2xl font-bold mb-4">Dealer Sales Reports</h2>

        {/* Summary Report */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-100 p-4 rounded-lg shadow text-center">
            <h3 className="text-lg font-semibold">Total Dealers</h3>
            <p className="text-xl font-bold">{totalDealers}</p>
          </div>
          <div className="bg-green-100 p-4 rounded-lg shadow text-center">
            <h3 className="text-lg font-semibold">Total Sales Reports</h3>
            <p className="text-xl font-bold">{totalReports}</p>
          </div>
          <div className="bg-yellow-100 p-4 rounded-lg shadow text-center">
            <h3 className="text-lg font-semibold">Total MRP Sales</h3>
            <p className="text-xl font-bold">৳{totalMRP.toFixed(2)}</p>
          </div>
        </div>

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
              className="border rounded p-2 ml-2"
            />
          </div>
          <div>
            <label className="font-medium">End Date: </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="border rounded p-2 ml-2"
            />
          </div>

          {/* Role Filter Dropdown */}
          <div>
            <label className="font-medium">Role: </label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="border rounded p-2 ml-2"
            >
              <option value="">All Roles</option>
              <option value="SO">Sales Officer</option>
              <option value="SELF">Self</option>
              <option value="COMMISSION">Commission</option>
              <option value="ASM">ASM</option>
              <option value="RSM">RSM</option>
              <option value="SOM">SOM</option>
            </select>
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
              setSelectedRole("");
              fetchSalesReports();
            }}
          >
            Reset Filters
          </button>
        </div>

        {/* Sales Report Table */}
        {loading ? (
          <div className="flex justify-center items-center my-10">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border p-2">User</th>
                  <th className="border p-2">Outlet</th>
                  <th className="border p-2">Role</th>
                  <th className="border p-2">Total Reports</th>
                  <th className="border p-2">Total MRP</th>
                  <th className="border p-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {aggregatedReports.map((user) => (
                  <tr key={user.userId} className="border">
                    <td className="border p-2">{user.name}</td>
                    <td className="border p-2">{user.outlet}</td>
                    <td className="border p-2">{user.role}</td>
                    <td className="border p-2">{user.totalReports}</td>
                    <td className="border p-2">৳{user.totalMRP.toFixed(2)}</td>
                    <td className="border p-2">
                      <button
                        className="bg-gray-800 text-white px-3 py-1 rounded hover:bg-gray-700"
                        onClick={() =>
                          navigate(
                            `/sales-report/daily/${user.userId}?${
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
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default DealerSalesReport;
