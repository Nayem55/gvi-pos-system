import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import AdminSidebar from "../../Component/AdminSidebar";

const DealerSalesReport = () => {
  const [users, setUsers] = useState([]);
  const [salesReports, setSalesReports] = useState({});
  const [targets, setTargets] = useState({}); // Changed to object for easier lookup
  const [selectedMonth, setSelectedMonth] = useState(dayjs().format("YYYY-MM"));
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedZone, setSelectedZone] = useState("");
  const [selectedBelt, setSelectedBelt] = useState("");
  const navigate = useNavigate();

  // Extract year and month from selectedMonth
  const [year, month] = selectedMonth.split("-").map(Number);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (selectedMonth) {
      fetchTargets();
    }
  }, [selectedMonth]);

  useEffect(() => {
    if (users.length > 0) {
      fetchSalesReports();
    }
  }, [users, selectedMonth, startDate, endDate]);

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

  const fetchTargets = async () => {
    try {
      const response = await axios.get(
        "https://gvi-pos-server.vercel.app/targets",
        {
          params: { year, month },
        }
      );

      // Convert targets array to an object with userID as key for easier lookup
      const targetsMap = {};
      response.data.forEach((targetEntry) => {
        targetEntry.targets.forEach((target) => {
          if (target.year === year && target.month === month) {
            targetsMap[targetEntry.userID] = target.tp; // Using tp as the target value
          }
        });
      });

      setTargets(targetsMap);
    } catch (error) {
      console.error("Error fetching targets:", error);
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

  const getBeltFromZone = (zoneName) => {
    if (zoneName.includes("ZONE-01")) return "Belt-1";
    if (zoneName.includes("ZONE-03")) return "Belt-3";
    return "";
  };

  const getUserTarget = (userId) => {
    return targets[userId] || 0; // Return 0 if no target found
  };

  const filteredUsers = users.filter((user) => {
    const matchRole = selectedRole
      ? user.role === selectedRole
      : !["ASM", "RSM", "SOM"].includes(user.role);
    const matchZone = selectedZone ? user.zone.includes(selectedZone) : true;
    const belt = getBeltFromZone(user.zone);
    const matchBelt = selectedBelt ? belt === selectedBelt : true;
    return matchRole && matchZone && matchBelt;
  });

  const aggregatedReports = filteredUsers.map((user) => {
    let totalReports = 0;
    let totalMRP = 0;

    if (["ASM", "RSM", "SOM"].includes(user.role)) {
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
      totalReports = salesReports[user._id]?.length || 0;
      totalMRP =
        salesReports[user._id]?.reduce(
          (sum, report) => sum + (report.total_mrp || 0),
          0
        ) || 0;
    }

    const target = getUserTarget(user._id);
    const achievement = target > 0 ? (totalMRP / target) * 100 : 0;

    return {
      userId: user._id,
      name: user.name,
      outlet: user.outlet,
      zone: user.zone,
      role: user.role,
      totalReports,
      totalMRP,
      target,
      achievement,
    };
  });

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

        {/* Summary Cards */}
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
        <div className="mb-4 flex flex-wrap gap-4 items-end">
          <div>
            <label className="font-medium">Select Month:</label>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="border rounded p-2 ml-2"
              disabled={startDate && endDate}
            />
          </div>
          <div>
            <label className="font-medium">Start Date:</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border rounded p-2 ml-2"
            />
          </div>
          <div>
            <label className="font-medium">End Date:</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="border rounded p-2 ml-2"
            />
          </div>

          <div>
            <label className="font-medium">Role:</label>
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

          <div>
            <label className="font-medium">Zone:</label>
            <select
              value={selectedZone}
              onChange={(e) => setSelectedZone(e.target.value)}
              className="border rounded p-2 ml-2"
            >
              <option value="">All Zones</option>
              <option value="DHAKA-01-ZONE-01">DHAKA-01-ZONE-01</option>
              <option value="DHAKA-02-ZONE-03">DHAKA-02-ZONE-03</option>
              <option value="DHAKA-03-ZONE-03">DHAKA-03-ZONE-03</option>
              <option value="KHULNA-ZONE-01">KHULNA-ZONE-01</option>
              <option value="COMILLA-ZONE-03">COMILLA-ZONE-03</option>
              <option value="CHITTAGONG-ZONE-03">CHITTAGONG-ZONE-03</option>
              <option value="RANGPUR-ZONE-01">RANGPUR-ZONE-01</option>
              <option value="BARISAL-ZONE-03">BARISAL-ZONE-03</option>
              <option value="BOGURA-ZONE-01">BOGURA-ZONE-01</option>
              <option value="MYMENSINGH-ZONE-01">MYMENSINGH-ZONE-01</option>
            </select>
          </div>

          <div>
            <label className="font-medium">Belt:</label>
            <select
              value={selectedBelt}
              onChange={(e) => setSelectedBelt(e.target.value)}
              className="border rounded p-2 ml-2"
            >
              <option value="">All Belts</option>
              <option value="Belt-1">Belt-1 (ZONE-01)</option>
              <option value="Belt-3">Belt-3 (ZONE-03)</option>
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
              setSelectedZone("");
              setSelectedBelt("");
              fetchSalesReports();
            }}
          >
            Reset Filters
          </button>
        </div>

        {/* Table */}
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
                  <th className="border p-2">Zone</th>
                  <th className="border p-2">Role</th>
                  <th className="border p-2">Target</th>
                  <th className="border p-2">Total MRP</th>
                  <th className="border p-2">Achievement (%)</th>
                  <th className="border p-2">Total Reports</th>
                  <th className="border p-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {aggregatedReports.map((user) => (
                  <tr key={user.userId} className="border">
                    <td className="border p-2">{user.name}</td>
                    <td className="border p-2">{user.outlet}</td>
                    <td className="border p-2">{user.zone}</td>
                    <td className="border p-2">{user.role}</td>
                    <td className="border p-2">৳{user.target}</td>
                    <td className="border p-2">৳{user.totalMRP.toFixed(2)}</td>
                    <td className="border p-2">
                      <div className="relative h-6 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`absolute inset-0 flex items-center justify-center h-full rounded-full ${
                            user.achievement >= 100
                              ? "bg-green-500"
                              : user.achievement >= 70
                              ? "bg-blue-500"
                              : user.achievement >= 40
                              ? "bg-yellow-500"
                              : "bg-red-500"
                          }`}
                          style={{
                            width: `${Math.min(100, user.achievement)}%`,
                            transition: "width 0.5s ease-in-out",
                          }}
                        >
                          {/* <span className="text-xs font-medium text-white mix-blend-difference">
                            {user.target > 0
                              ? `${user.achievement.toFixed(1)}%`
                              : "-"}
                          </span> */}
                        </div>
                        {user.target > 0 && (
                          <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white font-bold">
                            {user.target > 0
                              ? `${user.achievement.toFixed(1)}%`
                              : "-"}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="border p-2">{user.totalReports}</td>
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
