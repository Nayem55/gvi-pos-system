import { useEffect, useState } from "react";
import axios from "axios";
import dayjs from "dayjs";

const UserDashboard = () => {
  const [salesReports, setSalesReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(dayjs().format("YYYY-MM")); // Default: current month

  const user = JSON.parse(localStorage.getItem("pos-user"));


  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `https://gvi-pos-server.vercel.app/sales-reports/${user._id}?month=${selectedMonth}`
        );
        setSalesReports(response.data);
      } catch (error) {
        console.error("Error fetching sales reports:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [user._id, selectedMonth]);

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Sales Reports</h2>

      {/* Month Selector */}
      <div className="flex justify-left mb-4">
        <input
          type="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="border rounded-lg px-4 py-2"
        />
      </div>

      {loading ? (
        <p className="text-center text-gray-600">Loading...</p>
      ) : salesReports.length === 0 ? (
        <p className="text-center text-gray-600">No sales reports found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300 bg-white text-sm">
            <thead>
              <tr className="bg-gray-800 text-white text-left">
                <th className="border px-4 py-2">Date</th>
                <th className="border px-4 py-2">Outlet</th>
                <th className="border px-4 py-2">Total TP</th>
                <th className="border px-4 py-2">Total MRP</th>
                <th className="border px-4 py-2">Products</th>
              </tr>
            </thead>
            <tbody>
              {salesReports.map((report) => (
                <tr key={report._id} className="hover:bg-gray-100">
                  <td className="border px-4 py-2">
                    {dayjs(report.sale_date).format("DD-MMMM-YYYY")}
                  </td>
                  <td className="border px-4 py-2">{report.outlet}</td>
                  <td className="border px-4 py-2">{report.total_tp} BDT</td>
                  <td className="border px-4 py-2">{report.total_mrp} BDT</td>
                  <td className="border px-4 py-2">
                    <ul className="list-disc pl-4">
                      {report.products.map((item, index) => (
                        <li key={index}>
                          {item.product_name} - {item.quantity} pcs
                        </li>
                      ))}
                    </ul>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default UserDashboard;
