import React, { useState, useEffect } from "react";
import axios from "axios";
import dayjs from "dayjs";
import AdminSidebar from "../../Component/AdminSidebar";

const StockMovementReport = () => {
  const [selectedOutlet, setSelectedOutlet] = useState("");
  const [month, setMonth] = useState(dayjs().format("YYYY-MM"));
  const [selectedYear, setSelectedYear] = useState("");
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState([]);
  const [error, setError] = useState(null);

  const outlets = [
    "Madina Trade International: New Market",
    "Shamima Akter: New Market",
    "Sheikh Enterprise: Mirpur",
  ];

  // Fetch report data when outlet or date changes
  useEffect(() => {
    if (selectedOutlet && month) {
      fetchReportData();
    }
  }, [selectedOutlet, month]);

  const fetchReportData = async () => {
    setLoading(true);
    setError(null);

    console.log("Fetching report with params:", {
      outlet: selectedOutlet,
      month: month,
    });

    try {
      const response = await axios.get(
        "https://gvi-pos-server.vercel.app/stock-movement-report",
        {
          params: {
            outlet: selectedOutlet,
            month: month,
          },
          timeout: 10000, // 10 second timeout
        }
      );

      console.log("API response:", response);

      if (response.data && response.data.success) {
        setReportData(response.data.data);
      } else {
        throw new Error(response.data?.message || "Invalid response format");
      }
    } catch (error) {
      console.error("API error:", error);
      setError(error.message || "Failed to fetch stock movement report");
      setReportData([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex">
      {/* Admin Sidebar */}
      <div className="">
        <AdminSidebar /> {/* Sidebar component */}
      </div>

      {/* Main Content */}
      <div className="mx-auto px-4 py-8 w-[80%]">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Stock Movement Report</h2>

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <select
            value={selectedOutlet}
            onChange={(e) => setSelectedOutlet(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select Outlet</option>
            {outlets.map((outlet, index) => (
              <option key={index} value={outlet}>
                {outlet}
              </option>
            ))}
          </select>

          <div>
            <label className="font-medium">Select Month: </label>
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="border rounded p-2 ml-2"
            />
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 border-l-4 border-red-500 text-red-700">
            <p>{error}</p>
            <p className="text-sm mt-1">Check console for more details</p>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Barcode
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Primary (PC)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Market Return (PC)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Office Return (PC)
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reportData.map((item, index) => (
                  <tr
                    key={`${item.barcode}-${index}`}
                    className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.productName || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.barcode}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.primary}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.marketReturn}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.officeReturn}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {reportData.length === 0 && !loading && !error && (
              <div className="text-center py-8 text-gray-500">
                No data available for the selected criteria
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StockMovementReport;
