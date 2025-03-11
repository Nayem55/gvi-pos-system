import { useEffect, useState } from "react";
import axios from "axios";
import { BarChart2 } from "lucide-react";
import AdminSidebar from "../../Component/AdminSidebar";
import { Link } from "react-router-dom";

const CategoryWiseSalesReport = () => {
  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSalesData = async () => {
      try {
        const response = await axios.get(
          "https://gvi-pos-server.vercel.app/api/sales/category-wise"
        );
        setSalesData(response.data);
      } catch (err) {
        setError("Failed to fetch sales data");
      } finally {
        setLoading(false);
      }
    };

    fetchSalesData();
  }, []);

  return (
    <div className="flex">
      {/* Sidebar */}
      <AdminSidebar />

      {/* Main Content */}
      <div className="p-6 bg-gray-100 min-h-screen w-full">
        <div className="bg-white p-4 rounded-lg shadow-lg">
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 size={24} />
            <h2 className="text-xl font-semibold">Category-wise Sales Report</h2>
          </div>

          {loading ? (
            <p className="text-center text-gray-500">Loading sales data...</p>
          ) : error ? (
            <p className="text-center text-red-500">{error}</p>
          ) : (
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border p-2 text-left">Category</th>
                  <th className="border p-2 text-center">PCS</th>
                  <th className="border p-2 text-center">Total TP</th>
                  <th className="border p-2 text-center">Total MRP</th>
                  <th className="border p-2 text-center">View Details</th>
                </tr>
              </thead>
              <tbody>
                {salesData.map((category) => (
                  <tr key={category._id} className="hover:bg-gray-50">
                    <td className="border p-2">{category._id}</td>
                    <td className="border p-2 text-center">{category.total_quantity}</td>
                    <td className="border p-2 text-center">{category.total_tp}</td>
                    <td className="border p-2 text-center">{category.total_mrp}</td>
                    <td className="border p-2 text-center">
                        <Link className="bg-gray-700 text-white rounded px-2 py-1" to={`/admin/sales-movement/category-wise/detail/${category._id}`}> Details </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default CategoryWiseSalesReport;
