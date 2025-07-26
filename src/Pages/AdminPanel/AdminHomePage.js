import React, { useState, useEffect } from "react";
import axios from "axios";
import dayjs from "dayjs";
import AdminSidebar from "../../Component/AdminSidebar";
import {
  DollarSign,
  BarChart2,
  PieChart as PieChartIcon,
  List,
  Target,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884D8",
  "#82CA9D",
];

const AdminHomePage = () => {
  const [zoneData, setZoneData] = useState([]);
  const [targetData, setTargetData] = useState([]);
  const [totalSales, setTotalSales] = useState(0);
  const [totalTarget, setTotalTarget] = useState(0);
  const [zone1Sales, setZone1Sales] = useState(0);
  const [zone1Target, setZone1Target] = useState(0);
  const [zone2Sales, setZone2Sales] = useState(0);
  const [zone2Target, setZone2Target] = useState(0);
  const [zone1Data, setZone1Data] = useState([]);
  const [zone3Data, setZone3Data] = useState([]);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(dayjs().year());
  const [month, setMonth] = useState(dayjs().month() + 1);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, [year, month]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const salesPromise = axios
        .get("http://localhost:5000/sales/zone-wise", {
          params: {
            month: `${year}-${month.toString().padStart(2, "0")}`,
            year,
          },
        })
        .catch(() => ({ data: [] }));

      const targetsPromise = axios
        .get("http://localhost:5000/targets/zone-wise", {
          params: { year, month },
        })
        .catch(() => ({ data: [] }));

      const [salesRes, targetsRes] = await Promise.all([
        salesPromise,
        targetsPromise,
      ]);
      processData(salesRes.data, targetsRes.data);
    } catch (err) {
      setError("Failed to load data. Showing available information.");
      processData([], []);
    } finally {
      setLoading(false);
    }
  };

  const processData = (salesData, targetData) => {
    const totalSalesValue = salesData.reduce(
      (sum, zone) => sum + (zone.total_tp || 0),
      0
    );
    const totalTargetValue = targetData.reduce(
      (sum, zone) => sum + (zone.total_tp_target || 0),
      0
    );

    setTotalSales(totalSalesValue);
    setTotalTarget(totalTargetValue);

    let zone1SalesTotal = 0;
    let zone1TargetTotal = 0;
    let zone2SalesTotal = 0;
    let zone2TargetTotal = 0;

    // Filter data for Zone-01 and Zone-03
    const zone1SalesData = salesData.filter(zone => zone._id && zone._id.includes("ZONE-01"));
    const zone3SalesData = salesData.filter(zone => zone._id && zone._id.includes("ZONE-03"));

    setZone1Data(zone1SalesData);
    setZone3Data(zone3SalesData);

    salesData.forEach((zone) => {
      if (zone._id && zone._id.includes("ZONE-01")) {
        zone1SalesTotal += zone.total_tp || 0;
      } else if (zone._id && zone._id.includes("ZONE-03")) {
        zone2SalesTotal += zone.total_tp || 0;
      }
    });

    targetData.forEach((zone) => {
      if (zone._id && zone._id.includes("ZONE-01")) {
        zone1TargetTotal += zone.total_tp_target || 0;
      } else if (zone._id && zone._id.includes("ZONE-03")) {
        zone2TargetTotal += zone.total_tp_target || 0;
      }
    });

    setZone1Sales(zone1SalesTotal);
    setZone1Target(zone1TargetTotal);
    setZone2Sales(zone2SalesTotal);
    setZone2Target(zone2TargetTotal);

    setZoneData(salesData);
    setTargetData(targetData);
  };

  const formatZoneName = (name) => {
    if (!name) return "Unknown Zone";
    return name.replace(/-/g, " ");
  };

  const calculateAchievement = (sales, target) => {
    if (!target || target === 0) return 0;
    return Math.round((sales / target) * 100);
  };

  const renderDataCard = (title, target, sales, icon, color) => {
    const achievement = calculateAchievement(sales, target);
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center gap-3 mb-4">
          {icon}
          <h3 className="text-xl font-semibold">{title}</h3>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">Target:</span>
            <span className="font-semibold">
              ৳{target.toLocaleString() || "N/A"}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">Sales:</span>
            <span className="font-semibold">
              ৳{sales.toLocaleString() || "0"}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <TrendingUp
              size={18}
              className={sales >= target ? "text-green-500" : "text-red-500"}
            />
            <span
              className={sales >= target ? "text-green-500" : "text-red-500"}
            >
              {achievement}% Achieved
            </span>
          </div>
        </div>
      </div>
    );
  };

  const renderZoneBarChart = (zoneData, zoneName) => {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold mb-4">
          {zoneName} Sales Breakdown
        </h3>
        <div className="h-64">
          {zoneData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={zoneData.map((zone) => ({
                  ...zone,
                  name: formatZoneName(zone._id),
                }))}
              >
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip
                  formatter={(value) => value.toLocaleString()}
                />
                <Legend />
                <Bar
                  dataKey="total_tp"
                  fill={zoneName.includes("01") ? "#36A2EB" : "#FF6384"}
                  name="Total Sales"
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">
              No sales data available for {zoneName}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex">
      <AdminSidebar />
      <div className="p-6 bg-gray-100 min-h-screen w-full">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <BarChart2 size={24} /> Sales Dashboard
          </h1>
          <div className="flex gap-4">
            <div>
              <label htmlFor="year" className="mr-2 font-medium">
                Year:
              </label>
              <select
                id="year"
                className="px-3 py-2 border rounded-md"
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value))}
              >
                {[2023, 2024, 2025].map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="month" className="mr-2 font-medium">
                Month:
              </label>
              <select
                id="month"
                className="px-3 py-2 border rounded-md"
                value={month}
                onChange={(e) => setMonth(parseInt(e.target.value))}
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>
                    {dayjs()
                      .month(m - 1)
                      .format("MMMM")}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-yellow-100 text-yellow-800 rounded flex items-center gap-2">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {renderDataCard(
                "Total Target vs Sales",
                totalTarget,
                totalSales,
                <Target size={24} className="text-blue-500" />,
                "blue"
              )}
              {renderDataCard(
                "Zone 01 Target vs Sales",
                zone1Target,
                zone1Sales,
                <Target size={24} className="text-green-500" />,
                "green"
              )}
              {renderDataCard(
                "Zone 03 Target vs Sales",
                zone2Target,
                zone2Sales,
                <Target size={24} className="text-purple-500" />,
                "purple"
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {renderZoneBarChart(zone1Data, "Zone 01")}
              {renderZoneBarChart(zone3Data, "Zone 03")}
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <List size={20} /> Zone-wise Sales Details
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Zone
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Quantity
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Sales
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {zoneData.length > 0 ? (
                      zoneData.map((zone, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {formatZoneName(zone._id)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {zone.total_quantity?.toLocaleString() || "0"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            ৳{(zone.total_tp || 0).toLocaleString()}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan="3"
                          className="px-6 py-4 text-center text-sm text-gray-500"
                        >
                          No sales data available
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminHomePage;