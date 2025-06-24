import React, { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import AdminSidebar from "../../Component/AdminSidebar";
import * as XLSX from "xlsx";

const API_CONFIG = {
  baseURL: "https://gvi-pos-server.vercel.app",
  timeout: 50000,
};

const api = axios.create({
  baseURL: API_CONFIG.baseURL,
  timeout: API_CONFIG.timeout,
});

const DealerSalesReport = () => {
  // State for sales data
  const [salesData, setSalesData] = useState([]);
  const [targetsData, setTargetsData] = useState({});

  // Filter and display state
  const [selectedMonth, setSelectedMonth] = useState(dayjs().format("YYYY-MM"));
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedZone, setSelectedZone] = useState("");
  const [selectedBelt, setSelectedBelt] = useState("");

  // Loading and error states
  const [loading, setLoading] = useState({
    sales: false,
    targets: false,
  });
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Get belt from zone name
  const getBeltFromZone = useCallback((zoneName) => {
    if (!zoneName) return "";
    if (zoneName.includes("ZONE-01")) return "Belt-1";
    if (zoneName.includes("ZONE-03")) return "Belt-3";
    return "";
  }, []);

  // Fetch sales data with embedded user info
  const fetchSalesData = useCallback(async () => {
    try {
      setLoading((prev) => ({ ...prev, sales: true }));
      setError(null);

      const params = new URLSearchParams();
      if (startDate && endDate) {
        params.append("startDate", startDate);
        params.append("endDate", endDate);
      } else {
        params.append("month", selectedMonth);
      }

      const response = await api.get(`/sales-reports?${params.toString()}`);
      if (!response.data || !Array.isArray(response.data)) {
        throw new Error("Invalid data format received from server");
      }
      setSalesData(response.data);
    } catch (error) {
      console.error("Error fetching sales data:", error);
      setError(`Failed to load sales data: ${error.message}`);
    } finally {
      setLoading((prev) => ({ ...prev, sales: false }));
    }
  }, [selectedMonth, startDate, endDate]);

  // Fetch targets for the selected month
  const fetchTargets = useCallback(async () => {
    try {
      setLoading((prev) => ({ ...prev, targets: true }));
      setError(null);

      const [year, month] = selectedMonth.split("-").map(Number);
      const response = await api.get("/targets", { params: { year, month } });

      const targetsMap = {};
      response.data.forEach((targetEntry) => {
        targetEntry.targets.forEach((target) => {
          if (target.year === year && target.month === month) {
            targetsMap[targetEntry.userID] = target.tp;
          }
        });
      });
      setTargetsData(targetsMap);
    } catch (error) {
      console.error("Error fetching targets:", error);
      setError("Failed to load targets. Please try again.");
    } finally {
      setLoading((prev) => ({ ...prev, targets: false }));
    }
  }, [selectedMonth]);

  // Main aggregation logic
  const { aggregatedReports, summaryData } = useMemo(() => {
    if (!salesData || salesData.length === 0) {
      return {
        aggregatedReports: [],
        summaryData: {
          totalSOs: 0,
          achievedSOs: 0,
          totalTP: 0,
          asmTotals: {},
          rsmTotals: {},
          somTotals: {}
        }
      };
    }

    // Group sales by SO
    const salesByUser = salesData.reduce((acc, sale) => {
      if (!sale.user || !sale.so) return acc;

      const userId = sale.user;
      if (!acc[userId]) {
        acc[userId] = {
          userId,
          name: sale.so,
          outlet: sale.outlet,
          zone: sale.zone,
          role: sale.role || "SO",
          asm: sale.asm,
          rsm: sale.rsm,
          som: sale.som,
          sales: [],
          totalTP: 0,
          totalDP: 0,
          totalMRP: 0,
        };
      }
      acc[userId].sales.push(sale);
      acc[userId].totalTP += sale.total_tp || 0;
      return acc;
    }, {});

    // Manager level aggregations
    const managerLevels = ["ASM", "RSM", "SOM"];
    const managerReports = {};
    const managerTotals = {
      ASM: {},
      RSM: {},
      SOM: {}
    };

    managerLevels.forEach((level) => {
      const managers = [...new Set(salesData.map(s => s[level.toLowerCase()]))].filter(Boolean);
      
      managers.forEach(manager => {
        const managerKey = `${level}_${manager}`;
        const teamMembers = Object.values(salesByUser).filter(
          user => user[level.toLowerCase()] === manager
        );

        const teamTP = teamMembers.reduce((sum, member) => sum + (member.totalTP || 0), 0);
        
        managerReports[managerKey] = {
          userId: managerKey,
          name: manager,
          role: level,
          zone: teamMembers[0]?.zone || '',
          totalTP: teamTP,
          salesCount: teamMembers.reduce((sum, m) => sum + (m.sales?.length || 0), 0),
          teamMembers: teamMembers.map(m => m.userId),
          isManager: true
        };

        // Store manager totals
        managerTotals[level][manager] = teamTP;
      });
    });

    // Combine all reports
    const allReports = [...Object.values(salesByUser), ...Object.values(managerReports)];

    // Apply filters
    const filteredReports = allReports
      .map((report) => {
        const matchRole = selectedRole ? report.role === selectedRole : true;
        const matchZone = selectedZone ? report.zone?.includes(selectedZone) : true;
        const belt = getBeltFromZone(report.zone);
        const matchBelt = selectedBelt ? belt === selectedBelt : true;

        if (!matchRole || !matchZone || !matchBelt) return null;

        const target = targetsData[report.userId] || 0;
        const achievement = target > 0 ? (report.totalTP / target) * 100 : 0;

        return {
          ...report,
          target,
          achievement,
          belt,
          salesCount: report.salesCount || report.sales?.length || 0
        };
      })
      .filter(Boolean);

    // Calculate summary data (SO only)
    const soReports = Object.values(salesByUser);
    const achievedSOs = soReports.filter(so => {
      const target = targetsData[so.userId] || 0;
      return target > 0 && ((so.totalTP / target) * 100) >= 100;
    }).length;

    return {
      aggregatedReports: filteredReports,
      summaryData: {
        totalSOs: soReports.length,
        achievedSOs,
        totalTP: soReports.reduce((sum, so) => sum + (so.totalTP || 0), 0),
        asmTotals: managerTotals.ASM,
        rsmTotals: managerTotals.RSM,
        somTotals: managerTotals.SOM
      }
    };
  }, [salesData, targetsData, selectedRole, selectedZone, selectedBelt, getBeltFromZone]);

  // Fetch data when filters change
  useEffect(() => {
    fetchSalesData();
  }, [fetchSalesData]);

  useEffect(() => {
    if (selectedMonth) {
      fetchTargets();
    }
  }, [selectedMonth, fetchTargets]);

  const isLoading = loading.sales || loading.targets;

  const exportToExcel = () => {
    const exportData = aggregatedReports.map((report) => ({
      "User Name": report.name,
      Outlet: report.outlet || "-",
      Zone: report.zone,
      Role: report.role,
      Belt: report.belt,
      Target: report.target,
      "Total TP": report.totalTP.toFixed(2),
      "Achievement (%)": report.achievement.toFixed(1),
      "Total Sales": report.salesCount,
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);
    XLSX.utils.book_append_sheet(wb, ws, "Dealer Sales Report");

    const fileName = `Dealer_Sales_Report_${
      selectedMonth ||
      (startDate && endDate ? `${startDate}_to_${endDate}` : dayjs().format("YYYY-MM"))
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

        {/* Summary Section */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="bg-blue-100 p-4 rounded-lg shadow text-center">
            <h3 className="text-lg font-semibold">Active SOs</h3>
            <p className="text-xl font-bold">{summaryData.totalSOs}</p>
          </div>
          <div className="bg-green-100 p-4 rounded-lg shadow text-center">
            <h3 className="text-lg font-semibold">Target Achieved</h3>
            <p className="text-xl font-bold">
              {summaryData.achievedSOs} / {summaryData.totalSOs}
            </p>
          </div>
          <div className="bg-yellow-100 p-4 rounded-lg shadow text-center">
            <h3 className="text-lg font-semibold">Total TP (SO Only)</h3>
            <p className="text-xl font-bold">{summaryData.totalTP.toFixed(2)}</p>
          </div>
        </div>

        {/* Manager Summary Section */}
        <div className="bg-gray-100 p-4 rounded-lg shadow mb-4">
          <h3 className="text-lg font-semibold mb-2">Manager Summaries</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white p-3 rounded-lg text-center">
              <h4 className="font-medium">ASM Total TP</h4>
              <p className="text-lg font-bold">
                {Object.values(summaryData.asmTotals).reduce((sum, tp) => sum + tp, 0).toFixed(2)}
              </p>
            </div>
            <div className="bg-white p-3 rounded-lg text-center">
              <h4 className="font-medium">RSM Total TP</h4>
              <p className="text-lg font-bold">
                {Object.values(summaryData.rsmTotals).reduce((sum, tp) => sum + tp, 0).toFixed(2)}
              </p>
            </div>
            <div className="bg-white p-3 rounded-lg text-center">
              <h4 className="font-medium">SOM Total TP</h4>
              <p className="text-lg font-bold">
                {Object.values(summaryData.somTotals).reduce((sum, tp) => sum + tp, 0).toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <div className="mb-4 flex flex-wrap gap-4 items-end">
          {/* Date Filters */}
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

          {/* Role Filter */}
          <div>
            <label className="font-medium">Role:</label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="border rounded p-2 ml-2"
            >
              <option value="">All Roles</option>
              <option value="SO">Sales Officer</option>
              <option value="ASM">ASM</option>
              <option value="RSM">RSM</option>
              <option value="SOM">SOM</option>
            </select>
          </div>

          {/* Zone Filter */}
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

          {/* Belt Filter */}
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

        {/* Results Table */}
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
                  <th className="p-2 sticky top-0 bg-gray-100">Sales Count</th>
                  <th className="p-2 sticky top-0 bg-gray-100">Action</th>
                </tr>
              </thead>
              <tbody>
                {aggregatedReports.map((report) => (
                  <tr
                    key={report.userId}
                    className={`border hover:bg-gray-50 ${
                      report.isManager ? "bg-blue-50" : ""
                    }`}
                  >
                    <td className="border p-2">
                      {report.name}
                      {report.isManager && (
                        <span className="ml-2 text-xs text-blue-600">
                          ({report.role})
                        </span>
                      )}
                    </td>
                    <td className="border p-2">{report.outlet || "-"}</td>
                    <td className="border p-2">{report.zone}</td>
                    <td className="border p-2">{report.role}</td>
                    <td className="border p-2">{report.target}</td>
                    <td className="border p-2">{report.totalTP.toFixed(2)}</td>
                    <td className="border p-2">
                      <div className="relative h-6 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`absolute inset-0 flex items-center justify-center h-full rounded-full ${
                            report.achievement >= 100
                              ? "bg-green-500"
                              : report.achievement >= 70
                              ? "bg-blue-500"
                              : report.achievement >= 40
                              ? "bg-yellow-500"
                              : "bg-red-500"
                          }`}
                          style={{
                            width: `${Math.min(100, report.achievement)}%`,
                            transition: "width 0.5s ease-in-out",
                          }}
                        ></div>
                        {report.target > 0 && (
                          <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white font-bold">
                            {report.achievement.toFixed(1)}%
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="border p-2 text-center">
                      {report.salesCount}
                    </td>
                    <td className="border p-2">
                      {!report.isManager && (
                        <button
                          className="bg-gray-800 text-white px-3 py-1 rounded hover:bg-gray-700"
                          onClick={() =>
                            navigate(
                              `/sales-report/daily/${report.userId}?${
                                startDate && endDate
                                  ? `startDate=${startDate}&endDate=${endDate}`
                                  : `month=${selectedMonth}`
                              }`
                            )
                          }
                        >
                          Details
                        </button>
                      )}
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