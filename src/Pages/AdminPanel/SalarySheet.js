import React, { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import AdminSidebar from "../../Component/AdminSidebar";
import * as XLSX from "xlsx";

const API_CONFIG = {
  baseURL: "http://localhost:5000",
  timeout: 50000,
};

const api = axios.create({
  baseURL: API_CONFIG.baseURL,
  timeout: API_CONFIG.timeout,
});

const SalarySheet = () => {
  // State for stock transaction data
  const [stockData, setStockData] = useState([]);
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
    stock: false,
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


  // Fetch stock transaction data
  const fetchStockData = useCallback(async () => {
    try {
      setLoading((prev) => ({ ...prev, stock: true }));
      setError(null);

      const params = new URLSearchParams();
      if (startDate && endDate) {
        params.append("startDate", startDate);
        params.append("endDate", endDate);
      } else {
        params.append("month", selectedMonth);
      }

      const response = await api.get(`/api/stock-transactions-report?${params.toString()}`);
      if (!response.data || !Array.isArray(response.data)) {
        throw new Error("Invalid data format received from server");
      }
      setStockData(response.data);
    } catch (error) {
      console.error("Error fetching stock data:", error);
      setError(`Failed to load stock data: ${error.message}`);
    } finally {
      setLoading((prev) => ({ ...prev, stock: false }));
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

  // Filter stock data based on current filters (except role)
  const filteredStockData = useMemo(() => {
    if (!stockData || stockData.length === 0) return [];

    return stockData.filter((data) => {
      const belt = getBeltFromZone(data.zone);
      const matchZone = selectedZone ? data.zone?.includes(selectedZone) : true;
      const matchBelt = selectedBelt ? belt === selectedBelt : true;

      return matchZone && matchBelt;
    });
  }, [stockData, selectedZone, selectedBelt, getBeltFromZone]);

  // Organize reports hierarchically by zone and then by role (SOM → RSM → ASM → SO)
  const organizeReportsHierarchically = (reports) => {
    // Group by belt first
    const reportsByBelt = reports.reduce((acc, report) => {
      const belt = getBeltFromZone(report.zone) || "Unknown Belt";
      if (!acc[belt]) {
        acc[belt] = [];
      }
      acc[belt].push(report);
      return acc;
    }, {});

    // For each belt, organize by role hierarchy
    return Object.entries(reportsByBelt).map(([belt, beltReports]) => {
      // Separate all roles
      const soms = beltReports.filter((r) => r.role === "SOM");
      const rsms = beltReports.filter((r) => r.role === "RSM");
      const asms = beltReports.filter((r) => r.role === "ASM");
      const salesOfficers = beltReports.filter((r) => r.role === "SO");

      // Create maps for relationships
      const soBySom = salesOfficers.reduce((acc, so) => {
        const som = so.som || "Unknown SOM";
        if (!acc[som]) acc[som] = [];
        acc[som].push(so);
        return acc;
      }, {});

      const soByRsm = salesOfficers.reduce((acc, so) => {
        const rsm = so.rsm || "Unknown RSM";
        if (!acc[rsm]) acc[rsm] = [];
        acc[rsm].push(so);
        return acc;
      }, {});

      const soByAsm = salesOfficers.reduce((acc, so) => {
        const asm = so.asm || "Unknown ASM";
        if (!acc[asm]) acc[asm] = [];
        acc[asm].push(so);
        return acc;
      }, {});

      // Build the hierarchical structure
      const organizedReports = [];

      // Add SOMs first
      soms.forEach((som) => {
        organizedReports.push(som);

        // Find RSMs that report to this SOM
        const somRsms = rsms.filter((rsm) =>
          soBySom[rsm.name]?.some((so) => so.som === som.name)
        );

        // Add each RSM and their hierarchy
        somRsms.forEach((rsm) => {
          organizedReports.push(rsm);

          // Find ASMs that report to this RSM
          const rsmAsms = asms.filter((asm) =>
            soByRsm[asm.name]?.some((so) => so.rsm === rsm.name)
          );

          // Add each ASM and their SOs
          rsmAsms.forEach((asm) => {
            organizedReports.push(asm);

            // Add SOs for this ASM
            const asmSos = soByAsm[asm.name] || [];
            organizedReports.push(
              ...asmSos.sort((a, b) => a.name.localeCompare(b.name))
            );
          });

          // Add SOs that report directly to RSM (without ASM)
          const directSos = (soByRsm[rsm.name] || []).filter((so) => !so.asm);
          organizedReports.push(
            ...directSos.sort((a, b) => a.name.localeCompare(b.name))
          );
        });

        // Add SOs that report directly to SOM (without RSM or ASM)
        const directSos = (soBySom[som.name] || []).filter(
          (so) => !so.rsm && !so.asm
        );
        organizedReports.push(
          ...directSos.sort((a, b) => a.name.localeCompare(b.name))
        );
      });

      // Add any remaining RSMs not under a SOM
      const remainingRsms = rsms.filter(
        (rsm) => !organizedReports.some((r) => r.userId === rsm.userId)
      );
      remainingRsms.forEach((rsm) => {
        organizedReports.push(rsm);

        // Add ASMs under this RSM
        const rsmAsms = asms.filter((asm) =>
          soByRsm[asm.name]?.some((so) => so.rsm === rsm.name)
        );

        rsmAsms.forEach((asm) => {
          organizedReports.push(asm);
          const asmSos = soByAsm[asm.name] || [];
          organizedReports.push(
            ...asmSos.sort((a, b) => a.name.localeCompare(b.name))
          );
        });

        // Add SOs directly under RSM
        const directSos = (soByRsm[rsm.name] || []).filter((so) => !so.asm);
        organizedReports.push(
          ...directSos.sort((a, b) => a.name.localeCompare(b.name))
        );
      });

      // Add any remaining ASMs not under a RSM
      const remainingAsms = asms.filter(
        (asm) => !organizedReports.some((r) => r.userId === asm.userId)
      );
      remainingAsms.forEach((asm) => {
        organizedReports.push(asm);
        const asmSos = soByAsm[asm.name] || [];
        organizedReports.push(
          ...asmSos.sort((a, b) => a.name.localeCompare(b.name))
        );
      });

      // Add any remaining SOs not under any manager
      const remainingSos = salesOfficers.filter(
        (so) => !organizedReports.some((r) => r.userId === so.userId)
      );
      organizedReports.push(
        ...remainingSos.sort((a, b) => a.name.localeCompare(b.name))
      );

      return {
        belt,
        reports: organizedReports,
      };
    });
  };

  // Main aggregation logic
  const { organizedReports, summaryData } = useMemo(() => {
    if (!filteredStockData || filteredStockData.length === 0) {
      return {
        organizedReports: [],
        summaryData: {
          totalSOs: 0,
          achievedSOs: 0,
          totalSecondary: 0,
          totalPrimary: 0,
          totalMarketReturn: 0,
          totalOfficeReturn: 0,
        },
      };
    }

    // Group transactions by user
    const transactionsByUser = filteredStockData.reduce((acc, transaction) => {
      const userId = transaction.userID;
      if (!acc[userId]) {
        acc[userId] = {
          userId,
          name: transaction.user,
          outlet: transaction.outlet,
          zone: transaction.zone,
          role: transaction.role || "SO",
          asm: transaction.asm,
          rsm: transaction.rsm,
          som: transaction.som,
          transactions: [],
          totalPrimary: 0,
          totalPrimaryValue: 0,
          totalSecondary: 0,
          totalSecondaryValue: 0,
          totalMarketReturn: 0,
          totalMarketReturnValue: 0,
          totalOfficeReturn: 0,
          totalOfficeReturnValue: 0,
        };
      }
      acc[userId].transactions.push(transaction);
      
      // Aggregate based on transaction type
      switch (transaction.type.toLowerCase()) {
        case "primary":
          acc[userId].totalPrimary += transaction.quantity;
          acc[userId].totalPrimaryValue += transaction.quantity * transaction.dp;
          break;
        case "secondary":
          acc[userId].totalSecondary += transaction.quantity;
          acc[userId].totalSecondaryValue += transaction.quantity * transaction.tp;
          break;
        case "market return":
          acc[userId].totalMarketReturn += transaction.quantity;
          acc[userId].totalMarketReturnValue += transaction.quantity * transaction.dp;
          break;
        case "office return":
          acc[userId].totalOfficeReturn += transaction.quantity;
          acc[userId].totalOfficeReturnValue += transaction.quantity * transaction.dp;
          break;
      }
      return acc;
    }, {});

    // Manager level aggregations
    const managerLevels = ["ASM", "RSM", "SOM"];
    const managerReports = {};

    managerLevels.forEach((level) => {
      const managers = [
        ...new Set(filteredStockData.map((t) => t[level.toLowerCase()])),
      ].filter(Boolean);

      managers.forEach((manager) => {
        const managerKey = `${level}_${manager}`;
        const teamMembers = Object.values(transactionsByUser).filter(
          (user) => user[level.toLowerCase()] === manager
        );

        const managerTarget = teamMembers.reduce((sum, member) => {
          return sum + (Number(targetsData[member.userId]) || 0);
        }, 0);

        const managerAchievement = teamMembers.reduce((sum, member) => {
          const target = targetsData[member.userId] || 0;
          return target > 0 ? sum + (member.totalSecondaryValue / target) * 100 : sum;
        }, 0);

        managerReports[managerKey] = {
          userId: managerKey,
          name: manager,
          role: level,
          zone: teamMembers[0]?.zone || "",
          totalPrimary: teamMembers.reduce((sum, m) => sum + m.totalPrimary, 0),
          totalPrimaryValue: teamMembers.reduce((sum, m) => sum + m.totalPrimaryValue, 0),
          totalSecondary: teamMembers.reduce((sum, m) => sum + m.totalSecondary, 0),
          totalSecondaryValue: teamMembers.reduce((sum, m) => sum + m.totalSecondaryValue, 0),
          totalMarketReturn: teamMembers.reduce((sum, m) => sum + m.totalMarketReturn, 0),
          totalMarketReturnValue: teamMembers.reduce((sum, m) => sum + m.totalMarketReturnValue, 0),
          totalOfficeReturn: teamMembers.reduce((sum, m) => sum + m.totalOfficeReturn, 0),
          totalOfficeReturnValue: teamMembers.reduce((sum, m) => sum + m.totalOfficeReturnValue, 0),
          target: managerTarget,
          achievement: managerAchievement / teamMembers.length,
          transactionCount: teamMembers.reduce((sum, m) => sum + (m.transactions?.length || 0), 0),
          teamMembers: teamMembers.map((m) => m.userId),
          isManager: true,
        };
      });
    });

    // Combine all reports
    const allReports = [
      ...Object.values(transactionsByUser),
      ...Object.values(managerReports),
    ];

    // Apply filters
    const filteredReports = allReports
      .map((report) => {
        const matchRole = selectedRole ? report.role === selectedRole : true;
        const belt = getBeltFromZone(report.zone);

        if (!matchRole) return null;

        const target = report.isManager
          ? report.target // already calculated for managers
          : targetsData[report.userId] || 0;

        const achievement = target > 0 ? (report.totalSecondaryValue / target) * 100 : 0;

        return {
          ...report,
          target: Number(target).toFixed(2),
          achievement,
          belt,
          transactionCount: report.transactionCount || report.transactions?.length || 0,
        };
      })
      .filter(Boolean);

    // Organize reports hierarchically
    const organized = organizeReportsHierarchically(filteredReports);

    // Calculate summary data (SO only) from filtered data (before role filter)
    const soReports = Object.values(transactionsByUser);
    const achievedSOs = soReports.filter((so) => {
      const target = targetsData[so.userId] || 0;
      return target > 0 && (so.totalSecondaryValue / target) * 100 >= 100;
    }).length;

    return {
      organizedReports: organized,
      summaryData: {
        totalSOs: soReports.length,
        achievedSOs,
        totalSecondary: soReports.reduce((sum, so) => sum + so.totalSecondaryValue, 0),
        totalPrimary: soReports.reduce((sum, so) => sum + so.totalPrimaryValue, 0),
        totalMarketReturn: soReports.reduce((sum, so) => sum + so.totalMarketReturnValue, 0),
        totalOfficeReturn: soReports.reduce((sum, so) => sum + so.totalOfficeReturnValue, 0),
      },
    };
  }, [filteredStockData, targetsData, selectedRole, getBeltFromZone]);

  // Fetch data when filters change
  useEffect(() => {
    fetchStockData();
  }, [fetchStockData]);

  useEffect(() => {
    if (selectedMonth) {
      fetchTargets();
    }
  }, [selectedMonth, fetchTargets]);

  const isLoading = loading.stock || loading.targets;

  const exportToExcel = () => {
    // Flatten the organized reports for export
    const exportData = organizedReports.flatMap((zoneGroup) =>
      zoneGroup.reports.map((report) => ({
        "User Name": report.name,
        Outlet: report.outlet || "-",
        Zone: report.zone,
        Role: report.role,
        Belt: report.belt,
        Target: report.target,
        "Primary (TP)": report.totalPrimaryValue.toFixed(2),
        "Secondary (TP)": report.totalSecondaryValue.toFixed(2),
        "Market Return (TP)": report.totalMarketReturnValue.toFixed(2),
        "Office Return (TP)": report.totalOfficeReturnValue.toFixed(2),
        "Achievement (%)": report.achievement.toFixed(1),
        "Transaction Count": report.transactionCount,
      }))
    );

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);
    XLSX.utils.book_append_sheet(wb, ws, "Salary Sheet Report");

    const fileName = `Salary_Sheet_Report_${
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
          <h2 className="text-2xl font-bold">Salary Sheet Report</h2>
          <button
            onClick={exportToExcel}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center"
            disabled={isLoading || organizedReports.length === 0}
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
        <div className="grid grid-cols-5 gap-4 mb-4">
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
            <h3 className="text-lg font-semibold">Total Secondary (TP)</h3>
            <p className="text-xl font-bold">
              {summaryData.totalSecondary.toFixed(2)}
            </p>
          </div>
          <div className="bg-purple-100 p-4 rounded-lg shadow text-center">
            <h3 className="text-lg font-semibold">Total Primary (TP)</h3>
            <p className="text-xl font-bold">
              {summaryData.totalPrimary.toFixed(2)}
            </p>
          </div>
          <div className="bg-red-100 p-4 rounded-lg shadow text-center">
            <h3 className="text-lg font-semibold">Total Returns (TP)</h3>
            <p className="text-xl font-bold">
              {(summaryData.totalMarketReturn + summaryData.totalOfficeReturn).toFixed(2)}
            </p>
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
        ) : organizedReports.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-lg text-gray-600">
              No stock transaction data found for the selected filters
            </p>
          </div>
        ) : (
          <div className="relative overflow-auto max-h-[90vh]">
            {organizedReports.map((beltGroup, beltIndex) => (
              <div key={beltIndex} className="mb-8">
                <h3 className="text-lg font-bold bg-gray-200 p-2 sticky top-0 z-10">
                  {beltGroup.belt}
                </h3>
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="p-2">User</th>
                      <th className="p-2">Outlet</th>
                      <th className="p-2">Zone</th>
                      <th className="p-2">Role</th>
                      <th className="p-2">Target (TP)</th>
                      <th className="p-2">Primary (TP)</th>
                      <th className="p-2">Secondary (TP)</th>
                      <th className="p-2">Market Return (TP)</th>
                      <th className="p-2">Office Return (TP)</th>
                      <th className="p-2">Achievement</th>
                      <th className="p-2">Transaction Count</th>
                      <th className="p-2">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {beltGroup.reports.map((report, index) => (
                      <tr
                        key={`${beltIndex}-${index}`}
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
                        <td className="border p-2">
                          {report.totalPrimaryValue.toFixed(2)}
                        </td>
                        <td className="border p-2">
                          {report.totalSecondaryValue.toFixed(2)}
                        </td>
                        <td className="border p-2">
                          {report.totalMarketReturnValue.toFixed(2)}
                        </td>
                        <td className="border p-2">
                          {report.totalOfficeReturnValue.toFixed(2)}
                        </td>
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
                          {report.transactionCount}
                        </td>
                        <td className="border p-2">
                          {!report.isManager && (
                            <button
                              className="bg-gray-800 text-white px-3 py-1 rounded hover:bg-gray-700"
                              onClick={() =>
                                navigate(
                                  `/stock-transactions/daily/${report.userId}?${
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SalarySheet;