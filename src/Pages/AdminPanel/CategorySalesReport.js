import { useEffect, useState } from "react";
import axios from "axios";
import { BarChart2 } from "lucide-react";
import AdminSidebar from "../../Component/AdminSidebar";
import { Link } from "react-router-dom";
import dayjs from "dayjs";

const CategoryWiseSalesReport = () => {
  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [month, setMonth] = useState(dayjs().format("YYYY-MM"));
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const fetchSalesData = async (params) => {
    try {
      setLoading(true);
      const response = await axios.get(
        "http://localhost:5000/sales/category-wise", // Replace with your actual server URL
        { params }
      );
      setSalesData(response.data);
    } catch (err) {
      setError("Failed to fetch sales data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch data when the component loads
    fetchSalesData({ month });
  }, []); // Empty dependency array ensures this runs only once on page load

  const handleFilter = () => {
    // Construct the query params based on the filter state
    const params = {};

    if (startDate && endDate) {
      params.startDate = startDate;
      params.endDate = endDate;
    } else if (month) {
      params.month = month;
    }

    fetchSalesData(params); // Fetch sales data with selected filters
  };

  const handleResetFilters = () => {
    setStartDate("");
    setEndDate("");
    setMonth(dayjs().format("YYYY-MM")); // Reset month to current month
    fetchSalesData({ month: dayjs().format("YYYY-MM") }); // Fetch month-wise data
  };

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

          {/* Filters */}
          <div className="mb-4 flex gap-4 items-end">
            <div>
              <label className="font-medium">Select Month: </label>
              <input
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="border rounded p-2 ml-2"
                disabled={startDate && endDate} // Disable month input when custom date range is used
              />
            </div>
            <div>
              <label className="font-medium">Start Date: </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="border rounded p-2"
              />
            </div>
            <div>
              <label className="font-medium">End Date: </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="border rounded p-2"
              />
            </div>
            <button
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              onClick={handleFilter} // Apply filter on button click
            >
              Filter Reports
            </button>
            <button
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
              onClick={handleResetFilters} // Reset filters to default (month-wise)
            >
              Reset Filters
            </button>
          </div>

          {/* Sales Report Table */}
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
                      <Link
                        className="bg-gray-700 text-white rounded px-2 py-1"
                        to={`/admin/sales-movement/category-wise/detail/${category._id}`}
                      >
                        Details
                      </Link>
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
