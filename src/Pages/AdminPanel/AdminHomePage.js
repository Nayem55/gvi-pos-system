import React, { useState, useEffect } from "react";
import axios from "axios";
import dayjs from "dayjs";
import { ShoppingCart, DollarSign, Box, TrendingUp } from "lucide-react";
import AdminSidebar from "../../Component/AdminSidebar";
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

const AdminHomePage = () => {
  const [salesData, setSalesData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [summary, setSummary] = useState({
    totalSold: 0,
    totalTP: 0,
    totalMRP: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [month, setMonth] = useState(dayjs().format("YYYY-MM"));

  useEffect(() => {
    fetchSalesData({ month });
    fetchCategoryData();
  }, [month]);

  const fetchSalesData = async (params) => {
    try {
      setLoading(true);
      const response = await axios.get(
        "https://gvi-pos-server.vercel.app/api/sales/product-wise",
        { params }
      );
      setSalesData(response.data);
      calculateSummary(response.data);
    } catch (err) {
      setError("Failed to fetch sales data");
    } finally {
      setLoading(false);
    }
  };

  const calculateSummary = (data) => {
    const totalSold = data.reduce(
      (sum, item) => sum + (item.total_quantity || 0),
      0
    );
    const totalTP = data.reduce((sum, item) => sum + (item.total_tp || 0), 0);
    const totalMRP = data.reduce((sum, item) => sum + (item.total_mrp || 0), 0);
    setSummary({ totalSold, totalTP, totalMRP });
  };

  const fetchCategoryData = async () => {
    try {
      const response = await axios.get(
        "https://gvi-pos-server.vercel.app/sales/category-wise",
        { params: { month } }
      );
      setCategoryData(response.data);
    } catch (error) {
      console.error("Error fetching category data:", error);
    }
  };

  const totalCategories = categoryData.length;

  return (
    <div className="flex">
      <AdminSidebar />
      <div className="p-6 bg-gray-100 min-h-screen w-full">
        <h1 className="text-2xl font-semibold mb-6 flex items-center gap-2">
          <TrendingUp size={24} /> Admin Dashboard
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-blue-100 p-6 rounded-lg shadow-md">
            <div className="flex items-center gap-3">
              <DollarSign size={24} className="text-blue-500" />
              <h3 className="text-xl font-semibold">Total MRP</h3>
            </div>
            <p className="text-2xl font-bold mt-2">
              ৳{summary.totalMRP.toFixed(2)}
            </p>
          </div>
          <div className="bg-green-100 p-6 rounded-lg shadow-md">
            <div className="flex items-center gap-3">
              <DollarSign size={24} className="text-green-500" />
              <h3 className="text-xl font-semibold">Total TP</h3>
            </div>
            <p className="text-2xl font-bold mt-2">
              ৳{summary.totalTP.toFixed(2)}
            </p>
          </div>
          <div className="bg-yellow-100 p-6 rounded-lg shadow-md">
            <div className="flex items-center gap-3">
              <ShoppingCart size={24} className="text-yellow-500" />
              <h3 className="text-xl font-semibold">Products Sold</h3>
            </div>
            <p className="text-2xl font-bold mt-2">{summary.totalSold}</p>
          </div>
          <div className="bg-purple-100 p-6 rounded-lg shadow-md">
            <div className="flex items-center gap-3">
              <Box size={24} className="text-purple-500" />
              <h3 className="text-xl font-semibold">Categories</h3>
            </div>
            <p className="text-2xl font-bold mt-2">{totalCategories}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-4">Monthly Sales Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={salesData}>
                <XAxis dataKey="_id" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="total_mrp" fill="#36A2EB" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-4">Category Wise Sales</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  dataKey="total_tp"
                  nameKey="_id"
                  fill="#4BC0C0"
                >
                  {categoryData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={["#FF6384", "#36A2EB", "#FFCE56"][index % 3]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminHomePage;
