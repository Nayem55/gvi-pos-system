import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import AdminSidebar from "../Component/AdminSidebar";

const AlterOutletsPage = () => {
  const [outlets, setOutlets] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchOutlets = async () => {
    try {
      setLoading(true);
      const response = await axios.get("https://gvi-pos-server.vercel.app/get-outlets");
      setOutlets(response.data);
    } catch (error) {
      console.error("Error fetching outlets:", error);
      toast.error("Failed to load outlets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOutlets();
  }, []);

  return (
    <div className="flex">
      <AdminSidebar />
      <div className="p-4 w-full">
        <h2 className="text-2xl font-bold mb-6">Manage Outlets</h2>

        <div className="bg-white p-6 rounded-lg shadow-md">
          {loading ? (
            <p>Loading outlets...</p>
          ) : outlets.length === 0 ? (
            <p>No outlets found</p>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border p-2 text-left">Outlet Name</th>
                  <th className="border p-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {outlets.map((outlet, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="border p-2">{outlet}</td>
                    <td className="border p-2 text-green-600">Active</td>
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

export default AlterOutletsPage;