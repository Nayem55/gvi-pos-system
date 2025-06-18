import React, { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import AdminSidebar from "../../Component/AdminSidebar";
import * as XLSX from "xlsx";

const API_CONFIG = {
  baseURL: "https://gvi-pos-server.vercel.app",
  timeout: 30000,
};

const api = axios.create({
  baseURL: API_CONFIG.baseURL,
  timeout: API_CONFIG.timeout,
});

const DealerSalesReport = () => {
  // State for all raw data
  const [allUsers, setAllUsers] = useState([]);
  const [allSalesReports, setAllSalesReports] = useState({});
  const [allTargets, setAllTargets] = useState({});

  // Filter and display state
  const [selectedMonth, setSelectedMonth] = useState(dayjs().format("YYYY-MM"));
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedZone, setSelectedZone] = useState("");
  const [selectedBelt, setSelectedBelt] = useState("");

  // Loading and error states
  const [loading, setLoading] = useState({
    initialLoad: true,
    sales: false,
    targets: false,
  });
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Fetch all initial data
  const fetchInitialData = useCallback(async () => {
    try {
      setLoading((prev) => ({ ...prev, initialLoad: true }));
      setError(null);

      // Fetch all users
      const usersResponse = await api.get("/getAllUser");
      setAllUsers(usersResponse.data);
    } catch (error) {
      console.error("Error fetching initial data:", error);
      setError("Failed to load initial data. Please try again.");
    } finally {
      setLoading((prev) => ({ ...prev, initialLoad: false }));
    }
  }, []);

  // Fetch targets for the selected month
  const fetchTargets = useCallback(async () => {
    try {
      setLoading((prev) => ({ ...prev, targets: true }));
      setError(null);

      const [year, month] = selectedMonth.split("-").map(Number);
      const targetsResponse = await api.get("/targets", {
        params: { year, month },
      });

      const targetsMap = {};
      targetsResponse.data.forEach((targetEntry) => {
        targetEntry.targets.forEach((target) => {
          if (target.year === year && target.month === month) {
            targetsMap[targetEntry.userID] = target.tp;
          }
        });
      });
      setAllTargets(targetsMap);
    } catch (error) {
      console.error("Error fetching targets:", error);
      setError("Failed to load targets. Please try again.");
    } finally {
      setLoading((prev) => ({ ...prev, targets: false }));
    }
  }, [selectedMonth]);

  // Fetch sales data when month/date range changes
  const fetchReportData = useCallback(async () => {
    if (allUsers.length === 0) return;

    try {
      setLoading((prev) => ({ ...prev, sales: true }));
      setError(null);

      // Prepare date parameters
      let params = {};
      if (startDate && endDate) {
        params.startDate = startDate;
        params.endDate = endDate;
      } else {
        params.month = selectedMonth;
      }

      // Fetch sales reports for all users
      const salesPromises = allUsers.map((user) =>
        api
          .get(`/sales-reports/${user._id}`, { params })
          .then((response) => ({ userId: user._id, reportData: response.data }))
          .catch(() => ({ userId: user._id, reportData: [] }))
      );

      const salesResults = await Promise.all(salesPromises);
      const salesData = salesResults.reduce((acc, { userId, reportData }) => {
        acc[userId] = reportData;
        return acc;
      }, {});
      setAllSalesReports(salesData);
    } catch (error) {
      console.error("Error fetching report data:", error);
      setError("Failed to load report data. Please try again.");
    } finally {
      setLoading((prev) => ({ ...prev, sales: false }));
    }
  }, [allUsers, selectedMonth, startDate, endDate]);

  // Get belt from zone name
  const getBeltFromZone = useCallback((zoneName) => {
    if (zoneName.includes("ZONE-01")) return "Belt-1";
    if (zoneName.includes("ZONE-03")) return "Belt-3";
    return "";
  }, []);

  // Get target for a user in the selected period
  const getUserTarget = useCallback(
    (userId) => {
      return allTargets[userId] || 0;
    },
    [allTargets]
  );

  // Apply all filters to get the users to display
  const filteredUsers = useMemo(() => {
    return allUsers.filter((user) => {
      const matchRole = selectedRole
        ? user.role === selectedRole
        : !["ASM", "RSM", "SOM"].includes(user.role);
      const matchZone = selectedZone ? user.zone.includes(selectedZone) : true;
      const belt = getBeltFromZone(user.zone);
      const matchBelt = selectedBelt ? belt === selectedBelt : true;
      return matchRole && matchZone && matchBelt;
    });
  }, [allUsers, selectedRole, selectedZone, selectedBelt, getBeltFromZone]);

  // Aggregate reports data with proper calculations and filter out empty/zero sales
  const aggregatedReports = useMemo(() => {
    return filteredUsers
      .map((user) => {
        let totalReports = 0;
        let totalTP = 0;

        if (["ASM", "RSM", "SOM"].includes(user.role)) {
          // For managers, calculate based on their team
          const teamMembers = allUsers.filter((u) => u.zone.includes(user.zone));

          // Sales data
          totalReports = teamMembers.reduce(
            (sum, member) => sum + (allSalesReports[member._id]?.length || 0),
            0
          );
          totalTP = teamMembers.reduce(
            (sum, member) =>
              sum +
              (allSalesReports[member._id]?.reduce(
                (subSum, report) => subSum + (report.total_tp || 0),
                0
              ) || 0),
            0
          );
        } else {
          // For regular users
          totalReports = allSalesReports[user._id]?.length || 0;
          totalTP =
            allSalesReports[user._id]?.reduce(
              (sum, report) => sum + (report.total_tp || 0),
              0
            ) || 0;
        }

        // Skip users with no sales reports or zero TP
        if (totalReports === 0 || totalTP === 0) return null;

        const target = getUserTarget(user._id);
        const achievement = target > 0 ? (totalTP / target) * 100 : 0;

        return {
          userId: user._id,
          name: user.name,
          outlet: user.outlet,
          zone: user.zone,
          role: user.role,
          totalReports,
          totalTP,
          target,
          achievement,
        };
      })
      .filter(Boolean); // Remove null entries
  }, [filteredUsers, allUsers, allSalesReports, getUserTarget]);

  // Calculate totals for active dealers only
  const { totalDealers, achievedTargetCount, totalTP } = useMemo(() => {
    return {
      totalDealers: aggregatedReports.length,
      achievedTargetCount: aggregatedReports.filter(
        (user) => user.achievement >= 100
      ).length,
      totalTP: aggregatedReports.reduce((sum, user) => sum + user.totalTP, 0),
    };
  }, [aggregatedReports]);

  // Initial data load
  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // Fetch targets when month changes
  useEffect(() => {
    if (selectedMonth) {
      fetchTargets();
    }
  }, [selectedMonth, fetchTargets]);

  // Fetch report data when month/date range changes
  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  const isLoading = loading.initialLoad || loading.sales || loading.targets;

  const exportToExcel = () => {
    const exportData = aggregatedReports.map((report) => ({
      "User Name": report.name,
      Outlet: report.outlet || "-",
      Zone: report.zone,
      Role: report.role,
      Target: report.target,
      "Total TP": report.totalTP.toFixed(2),
      "Achievement (%)": report.achievement.toFixed(1),
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);
    XLSX.utils.book_append_sheet(wb, ws, "Dealer Sales Report");

    const fileName = `Dealer_Sales_Report_${
      selectedMonth ||
      (startDate && endDate
        ? `${startDate}_to_${endDate}`
        : dayjs().format("YYYY-MM"))
    }.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const handleResetFilters = () => {
    setStartDate("");
    setEndDate("");
    setSelectedRole("");
    setSelectedZone("");
    setSelectedBelt("");
  };

  return (
    <div className="flex">
      <AdminSidebar />
      <div className="p-4 w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Dealer Sales Reports</h2>
          <button
            onClick={exportToExcel}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center"
            disabled={isLoading || aggregatedReports.length === 0}
          >
            Export to Excel
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
            <p>{error}</p>
          </div>
        )}

        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="bg-blue-100 p-4 rounded-lg shadow text-center">
            <h3 className="text-lg font-semibold">Active Dealers</h3>
            <p className="text-xl font-bold">{totalDealers}</p>
          </div>
          <div className="bg-green-100 p-4 rounded-lg shadow text-center">
            <h3 className="text-lg font-semibold">Achieved Target</h3>
            <p className="text-xl font-bold">
              {achievedTargetCount} / {totalDealers}
            </p>
          </div>
          <div className="bg-yellow-100 p-4 rounded-lg shadow text-center">
            <h3 className="text-lg font-semibold">Total TP</h3>
            <p className="text-xl font-bold">{totalTP.toFixed(2)}</p>
          </div>
        </div>

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
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            onClick={handleResetFilters}
            disabled={isLoading}
          >
            Reset Filters
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center my-10">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500"></div>
          </div>
        ) : aggregatedReports.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-lg text-gray-600">
              No sales data found for the selected filters
            </p>
          </div>
        ) : (
          <div className="relative overflow-auto max-h-[90vh]">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100 sticky top-0 z-10">
                  <th className="p-2 sticky top-0 bg-gray-100">User</th>
                  <th className="p-2 sticky top-0 bg-gray-100">Outlet</th>
                  <th className="p-2 sticky top-0 bg-gray-100">Zone</th>
                  <th className="p-2 sticky top-0 bg-gray-100">Role</th>
                  <th className="p-2 sticky top-0 bg-gray-100">Target (TP)</th>
                  <th className="p-2 sticky top-0 bg-gray-100">Sales (TP)</th>
                  <th className="p-2 sticky top-0 bg-gray-100">Achievement</th>
                  <th className="p-2 sticky top-0 bg-gray-100">Action</th>
                </tr>
              </thead>
              <tbody>
                {aggregatedReports.map((user) => (
                  <tr key={user.userId} className="border hover:bg-gray-50">
                    <td className="border p-2">{user.name}</td>
                    <td className="border p-2">{user.outlet || "-"}</td>
                    <td className="border p-2">{user.zone}</td>
                    <td className="border p-2">{user.role}</td>
                    <td className="border p-2">{user.target}</td>
                    <td className="border p-2">{user.totalTP.toFixed(2)}</td>
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
                        ></div>
                        {user.target > 0 && (
                          <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white font-bold">
                            {user.achievement.toFixed(1)}%
                          </span>
                        )}
                      </div>
                    </td>
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
                        Details
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