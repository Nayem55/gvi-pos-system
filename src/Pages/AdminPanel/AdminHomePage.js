import React, { useState, useEffect } from "react";
import axios from "axios";
import dayjs from "dayjs";
import AdminSidebar from "../../Component/AdminSidebar";
import {
  DollarSign,
  BarChart2,
  PieChart as PieChartIcon,
  List,
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

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

const AdminHomePage = () => {
  const [zoneData, setZoneData] = useState([]);
  const [totalSales, setTotalSales] = useState(0);
  const [zone1Sales, setZone1Sales] = useState(0);
  const [zone2Sales, setZone2Sales] = useState(0);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(dayjs().year());
  const [month, setMonth] = useState(dayjs().month() + 1);

  useEffect(() => {
    fetchZoneData();
  }, [year, month]);

  const fetchZoneData = async () => {
    try {
      setLoading(true);
      
      // Fetch zone-wise sales data
      const salesRes = await axios.get(
        "http://localhost:5000/sales/zone-wise",
        {
          params: {
            month: `${year}-${month.toString().padStart(2, '0')}`,
            year 
          }
        }
      );
      
      // Process the data
      processZoneData(salesRes.data);
      
    } catch (error) {
      console.error("Error fetching zone data:", error);
    } finally {
      setLoading(false);
    }
  };

  const processZoneData = (salesData) => {
    // Calculate total sales
    const totalSalesValue = salesData.reduce(
      (sum, zone) => sum + (zone.total_tp || 0), 
      0
    );
    
    setTotalSales(totalSalesValue);
    
    // Calculate zone-specific data
    let zone1Total = 0;
    let zone2Total = 0;
    
    salesData.forEach(zone => {
      if (zone._id.includes("ZONE-01")) {
        zone1Total += zone.total_tp || 0;
      } else if (zone._id.includes("ZONE-03")) {
        zone2Total += zone.total_tp || 0;
      }
    });
    
    setZone1Sales(zone1Total);
    setZone2Sales(zone2Total);
    
    setZoneData(salesData);
  };

  const formatZoneName = (name) => {
    return name.replace(/-/g, ' ');
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
                  <option key={y} value={y}>{y}</option>
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
                {Array.from({length: 12}, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>{dayjs().month(m - 1).format("MMMM")}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <>
            {/* Summary Cards - Top Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {/* Total Sales */}
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex items-center gap-3 mb-4">
                  <DollarSign size={24} className="text-blue-500" />
                  <h3 className="text-xl font-semibold">Total Sales</h3>
                </div>
                <p className="text-3xl font-bold">৳{totalSales.toLocaleString()}</p>
              </div>

              {/* Zone 01 Sales */}
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex items-center gap-3 mb-4">
                  <DollarSign size={24} className="text-green-500" />
                  <h3 className="text-xl font-semibold">Zone 01 Sales</h3>
                </div>
                <p className="text-3xl font-bold">৳{zone1Sales.toLocaleString()}</p>
              </div>

              {/* Zone 02 Sales */}
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex items-center gap-3 mb-4">
                  <DollarSign size={24} className="text-purple-500" />
                  <h3 className="text-xl font-semibold">Zone 03 Sales</h3>
                </div>
                <p className="text-3xl font-bold">৳{zone2Sales.toLocaleString()}</p>
              </div>
            </div>

            {/* Zone-wise Sales Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold mb-4">Zone-wise Sales Comparison</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={zoneData.map(zone => ({
                        ...zone,
                        name: formatZoneName(zone._id)
                      }))}
                    >
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip 
                        formatter={(value, name) => [
                          value.toLocaleString(), 
                          name === 'total_tp' ? 'Total TP' : 'Total MRP'
                        ]}
                      />
                      <Legend />
                      <Bar dataKey="total_tp" fill="#36A2EB" name="Total TP" />
                      {/* <Bar dataKey="total_mrp" fill="#FF6384" name="Total MRP" /> */}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold mb-4">Zone Distribution</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={zoneData}
                        dataKey="total_tp"
                        nameKey="_id"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={({ name, percent }) => 
                          `${formatZoneName(name)}: ${(percent * 100).toFixed(0)}%`
                        }
                      >
                        {zoneData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [value.toLocaleString(), 'Sales']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Detailed Zone Sales Table */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <List size={20} /> Zone-wise Sales Details
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Zone</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total TP</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total MRP</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {zoneData.map((zone, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatZoneName(zone._id)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {zone.total_quantity.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          ৳{zone.total_tp.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          ৳{zone.total_mrp.toLocaleString()}
                        </td>
                      </tr>
                    ))}
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