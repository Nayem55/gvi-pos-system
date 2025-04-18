import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import AdminSidebar from "../../Component/AdminSidebar";
import * as XLSX from "xlsx";

const DealerSalesReport = () => {
  const [users, setUsers] = useState([]);
  const [salesReports, setSalesReports] = useState({});
  const [stockMovementData, setStockMovementData] = useState({});
  const [targets, setTargets] = useState({});
  const [selectedMonth, setSelectedMonth] = useState(dayjs().format("YYYY-MM"));
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState({
    users: false,
    targets: false,
    sales: false,
    stock: false,
  });
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedZone, setSelectedZone] = useState("");
  const [selectedBelt, setSelectedBelt] = useState("");
  const navigate = useNavigate();

  const [year, month] = selectedMonth.split("-").map(Number);

  // Memoized functions
  const getBeltFromZone = useCallback((zoneName) => {
    if (zoneName.includes("ZONE-01")) return "Belt-1";
    if (zoneName.includes("ZONE-03")) return "Belt-3";
    return "";
  }, []);

  const getUserTarget = useCallback(
    (userId) => {
      return targets[userId] || 0;
    },
    [targets]
  );

  // Fetch data functions
  const fetchUsers = useCallback(async () => {
    try {
      setLoading((prev) => ({ ...prev, users: true }));
      const response = await axios.get(
        "https://gvi-pos-server.vercel.app/getAllUser"
      );
      setUsers(response.data);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading((prev) => ({ ...prev, users: false }));
    }
  }, []);

  const fetchTargets = useCallback(async () => {
    try {
      setLoading((prev) => ({ ...prev, targets: true }));
      const response = await axios.get(
        "https://gvi-pos-server.vercel.app/targets",
        { params: { year, month } }
      );

      const targetsMap = {};
      response.data.forEach((targetEntry) => {
        targetEntry.targets.forEach((target) => {
          if (target.year === year && target.month === month) {
            targetsMap[targetEntry.userID] = target.tp;
          }
        });
      });

      setTargets(targetsMap);
    } catch (error) {
      console.error("Error fetching targets:", error);
    } finally {
      setLoading((prev) => ({ ...prev, targets: false }));
    }
  }, [year, month]);

  const fetchSalesReports = useCallback(async () => {
    try {
      setLoading((prev) => ({ ...prev, sales: true }));
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
            timeout: 10000,
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
      setLoading((prev) => ({ ...prev, sales: false }));
    }
  }, [users, selectedMonth, startDate, endDate]);

  // Filter users
  const filteredUsers = React.useMemo(() => {
    return users.filter((user) => {
      const matchRole = selectedRole
        ? user.role === selectedRole
        : !["ASM", "RSM", "SOM"].includes(user.role);
      const matchZone = selectedZone ? user.zone.includes(selectedZone) : true;
      const belt = getBeltFromZone(user.zone);
      const matchBelt = selectedBelt ? belt === selectedBelt : true;
      return matchRole && matchZone && matchBelt;
    });
  }, [users, selectedRole, selectedZone, selectedBelt, getBeltFromZone]);

  const fetchStockMovementReports = useCallback(async () => {
    try {
      setLoading((prev) => ({ ...prev, stock: true }));

      // Get unique outlets from filtered users
      const uniqueOutlets = [
        ...new Set(filteredUsers.map((user) => user.outlet)),
      ];

      const promises = uniqueOutlets.map(async (outlet) => {
        try {
          const response = await axios.get(
            "https://gvi-pos-server.vercel.app/stock-movement-report",
            {
              params: { outlet, month: selectedMonth },
              timeout: 10000,
            }
          );
          return { outlet, data: response.data?.data || [] };
        } catch (error) {
          console.error(`Error fetching stock movement for ${outlet}:`, error);
          return { outlet, data: [] };
        }
      });

      const results = await Promise.all(promises);
      const stockDataMap = results.reduce((acc, { outlet, data }) => {
        acc[outlet] = data;
        return acc;
      }, {});

      setStockMovementData(stockDataMap);
    } catch (error) {
      console.error("Error fetching stock movement reports:", error);
    } finally {
      setLoading((prev) => ({ ...prev, stock: false }));
    }
  }, [filteredUsers, selectedMonth]);

  // Process reports data
  const aggregatedReports = React.useMemo(() => {
    // Create a map of outlet to users for quick lookup
    const outletUsersMap = filteredUsers.reduce((acc, user) => {
      if (!acc[user.outlet]) {
        acc[user.outlet] = [];
      }
      acc[user.outlet].push(user);
      return acc;
    }, {});

    return filteredUsers.map((user) => {
      let totalReports = 0;
      let totalTP = 0;
      let totalPrimary = 0;
      let totalOfficeReturn = 0;
      let totalMarketReturn = 0;

      if (["ASM", "RSM", "SOM"].includes(user.role)) {
        const assignedSOs = users.filter((u) => u.zone.includes(user.zone));
        totalReports = assignedSOs.reduce(
          (sum, so) => sum + (salesReports[so._id]?.length || 0),
          0
        );
        totalTP = assignedSOs.reduce(
          (sum, so) =>
            sum +
            (salesReports[so._id]?.reduce(
              (subSum, report) => subSum + (report.total_tp || 0),
              0
            ) || 0),
          0
        );

        // For managers, sum unique outlet stock data from their team
        const managerOutlets = [...new Set(assignedSOs.map((so) => so.outlet))];
        totalPrimary = managerOutlets.reduce(
          (sum, outlet) =>
            sum +
            ((stockMovementData[outlet] || []).reduce(
              (subSum, item) => subSum + (item.primary || 0),
              0
            ),
            0)
        );
        totalOfficeReturn = managerOutlets.reduce(
          (sum, outlet) =>
            sum +
            ((stockMovementData[outlet] || []).reduce(
              (subSum, item) => subSum + (item.officeReturn || 0),
              0
            ),
            0)
        );
        totalMarketReturn = managerOutlets.reduce(
          (sum, outlet) =>
            sum +
            ((stockMovementData[outlet] || []).reduce(
              (subSum, item) => subSum + (item.marketReturn || 0),
              0
            ),
            0)
        );
      } else {
        totalReports = salesReports[user._id]?.length || 0;
        totalTP =
          salesReports[user._id]?.reduce(
            (sum, report) => sum + (report.total_tp || 0),
            0
          ) || 0;

        // For regular users, get their outlet's stock data
        totalPrimary =
          (stockMovementData[user.outlet] || []).reduce(
            (sum, item) => sum + (item.primary || 0),
            0
          ) || 0;
        totalOfficeReturn =
          (stockMovementData[user.outlet] || []).reduce(
            (sum, item) => sum + (item.officeReturn || 0),
            0
          ) || 0;
        totalMarketReturn =
          (stockMovementData[user.outlet] || []).reduce(
            (sum, item) => sum + (item.marketReturn || 0),
            0
          ) || 0;
      }

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
        totalPrimary,
        totalOfficeReturn,
        totalMarketReturn,
        target,
        achievement,
      };
    });
  }, [filteredUsers, users, salesReports, stockMovementData, getUserTarget]);

  // Calculate totals
  const {
    totalDealers,
    totalReports,
    totalTP,
    totalPrimary,
    totalOfficeReturn,
    totalMarketReturn,
  } = React.useMemo(() => {
    // Get unique outlets to avoid duplicate counting
    const uniqueOutlets = [
      ...new Set(filteredUsers.map((user) => user.outlet)),
    ];

    return {
      totalDealers: filteredUsers.length,
      totalReports: aggregatedReports.reduce(
        (sum, user) => sum + user.totalReports,
        0
      ),
      totalTP: aggregatedReports.reduce((sum, user) => sum + user.totalTP, 0),
      totalPrimary: uniqueOutlets.reduce(
        (sum, outlet) =>
          sum +
          (stockMovementData[outlet] || []).reduce(
            (subSum, item) => subSum + (item.primary || 0),
            0
          ),
        0
      ),
      totalOfficeReturn: uniqueOutlets.reduce(
        (sum, outlet) =>
          sum +
          (stockMovementData[outlet] || []).reduce(
            (subSum, item) => subSum + (item.officeReturn || 0),
            0
          ),
        0
      ),
      totalMarketReturn: uniqueOutlets.reduce(
        (sum, outlet) =>
          sum +
          (stockMovementData[outlet] || []).reduce(
            (subSum, item) => subSum + (item.marketReturn || 0),
            0
          ),
        0
      ),
    };
  }, [filteredUsers, aggregatedReports, stockMovementData]);

  // Initial data load
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    if (selectedMonth) {
      fetchTargets();
    }
  }, [selectedMonth, fetchTargets]);

  useEffect(() => {
    if (users.length > 0) {
      fetchSalesReports();
    }
  }, [users, selectedMonth, startDate, endDate, fetchSalesReports]);

  useEffect(() => {
    if (filteredUsers.length > 0 && selectedMonth) {
      fetchStockMovementReports();
    }
  }, [filteredUsers, selectedMonth, fetchStockMovementReports]);

  const isLoading =
    loading.users || loading.targets || loading.sales || loading.stock;

  const exportToExcel = () => {
    // Prepare the data for export
    const exportData = aggregatedReports.map((report) => ({
      "User Name": report.name,
      Outlet: report.outlet,
      Zone: report.zone,
      Role: report.role,
      "Total Primary": `৳${report.totalPrimary.toFixed(2)}`,
      "Office Return": `৳${report.totalOfficeReturn.toFixed(2)}`,
      "Market Return": `৳${report.totalMarketReturn.toFixed(2)}`,
      Target: `৳${report.target}`,
      "Total TP": `৳${report.totalTP.toFixed(2)}`,
      "Achievement (%)": `${report.achievement.toFixed(1)}%`,
      // "Total Reports": report.totalReports,
    }));

    // Create a new workbook
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);

    // Add the worksheet to the workbook
    XLSX.utils.book_append_sheet(wb, ws, "Dealer Sales Report");

    // Generate the Excel file and trigger download
    const fileName = `Dealer_Sales_Report_${
      selectedMonth ||
      (startDate && endDate
        ? `${startDate}_to_${endDate}`
        : dayjs().format("YYYY-MM"))
    }.xlsx`;
    XLSX.writeFile(wb, fileName);
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
            disabled={isLoading}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
            Export to Excel
          </button>
        </div>

        {/* Summary Cards - 2 rows with 3 columns each */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="bg-blue-100 p-4 rounded-lg shadow text-center">
            <h3 className="text-lg font-semibold">Total Dealers</h3>
            <p className="text-xl font-bold">{totalDealers}</p>
          </div>
          <div className="bg-green-100 p-4 rounded-lg shadow text-center">
            <h3 className="text-lg font-semibold">Total Sales Reports</h3>
            <p className="text-xl font-bold">{totalReports}</p>
          </div>
          <div className="bg-yellow-100 p-4 rounded-lg shadow text-center">
            <h3 className="text-lg font-semibold">Total TP Sales</h3>
            <p className="text-xl font-bold">৳{totalTP.toFixed(2)}</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-purple-100 p-4 rounded-lg shadow text-center">
            <h3 className="text-lg font-semibold">Total Primary</h3>
            <p className="text-xl font-bold">৳{totalPrimary.toFixed(2)}</p>
          </div>
          <div className="bg-red-100 p-4 rounded-lg shadow text-center">
            <h3 className="text-lg font-semibold">Total Office Return</h3>
            <p className="text-xl font-bold">৳{totalOfficeReturn.toFixed(2)}</p>
          </div>
          <div className="bg-pink-100 p-4 rounded-lg shadow text-center">
            <h3 className="text-lg font-semibold">Total Market Return</h3>
            <p className="text-xl font-bold">৳{totalMarketReturn.toFixed(2)}</p>
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
            onClick={() => {
              fetchSalesReports();
              fetchStockMovementReports();
            }}
            disabled={isLoading}
          >
            {isLoading ? "Loading..." : "Filter Reports"}
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
              fetchStockMovementReports();
            }}
            disabled={isLoading}
          >
            Reset Filters
          </button>
        </div>

        {isLoading ? (
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
                  <th className="border p-2">Primary</th>
                  <th className="border p-2">Office Return</th>
                  <th className="border p-2">Market Return</th>
                  <th className="border p-2">Target</th>
                  <th className="border p-2">Total TP</th>
                  <th className="border p-2">Achievement (%)</th>
                  {/* <th className="border p-2">Total Reports</th> */}
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
                    <td className="border p-2">
                      ৳{user.totalPrimary.toFixed(2)}
                    </td>
                    <td className="border p-2">
                      ৳{user.totalOfficeReturn.toFixed(2)}
                    </td>
                    <td className="border p-2">
                      ৳{user.totalMarketReturn.toFixed(2)}
                    </td>
                    <td className="border p-2">৳{user.target}</td>
                    <td className="border p-2">৳{user.totalTP.toFixed(2)}</td>
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
                            {user.target > 0
                              ? `${user.achievement.toFixed(1)}%`
                              : "-"}
                          </span>
                        )}
                      </div>
                    </td>
                    {/* <td className="border p-2">{user.totalReports}</td> */}
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
