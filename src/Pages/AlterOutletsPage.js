import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import AdminSidebar from "../Component/AdminSidebar";

const AlterOutletsPage = () => {
  const [outlets, setOutlets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [transferMode, setTransferMode] = useState(false);
  const [selectedSource, setSelectedSource] = useState("");
  const [selectedTarget, setSelectedTarget] = useState("");
  const [isTransferring, setIsTransferring] = useState(false);

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

  const handleTransfer = async () => {
    if (!selectedSource || !selectedTarget) {
      toast.error("Please select both source and target outlets");
      return;
    }

    if (selectedSource === selectedTarget) {
      toast.error("Source and target outlets cannot be the same");
      return;
    }

    try {
      setIsTransferring(true);
      const response = await axios.post("https://gvi-pos-server.vercel.app/transfer-outlet-stock", {
        sourceOutlet: selectedSource,
        targetOutlet: selectedTarget
      });

      toast.success(response.data.message);
      setTransferMode(false);
      setSelectedSource("");
      setSelectedTarget("");
      fetchOutlets(); // Refresh the outlet list
    } catch (error) {
      console.error("Transfer failed:", error);
      toast.error(error.response?.data?.message || "Transfer failed");
    } finally {
      setIsTransferring(false);
    }
  };

  return (
    <div className="flex">
      <AdminSidebar />
      <div className="p-4 w-full">
        <h2 className="text-2xl font-bold mb-6">Manage Outlets</h2>

        <div className="flex justify-end mb-4">
          <button
            onClick={() => setTransferMode(!transferMode)}
            className={`px-4 py-2 rounded-md ${transferMode ? 'bg-gray-500 hover:bg-gray-600' : 'bg-blue-600 hover:bg-blue-700'} text-white`}
          >
            {transferMode ? "Cancel Transfer" : "Transfer Outlet Stock"}
          </button>
        </div>

        {transferMode && (
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <h3 className="text-lg font-semibold mb-4">Transfer Outlet Stock</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  From Outlet (Source)
                </label>
                <select
                  value={selectedSource}
                  onChange={(e) => setSelectedSource(e.target.value)}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="">Select source outlet</option>
                  {outlets.map((outlet, index) => (
                    <option key={`source-${index}`} value={outlet}>
                      {outlet}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  To Outlet (Target)
                </label>
                <select
                  value={selectedTarget}
                  onChange={(e) => setSelectedTarget(e.target.value)}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="">Select target outlet</option>
                  {outlets
                    .filter(outlet => outlet !== selectedSource)
                    .map((outlet, index) => (
                      <option key={`target-${index}`} value={outlet}>
                        {outlet}
                      </option>
                    ))}
                </select>
              </div>
            </div>
            <button
              onClick={handleTransfer}
              disabled={isTransferring || !selectedSource || !selectedTarget}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md disabled:bg-gray-400"
            >
              {isTransferring ? "Transferring..." : "Confirm Transfer"}
            </button>
          </div>
        )}

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
                  {transferMode && <th className="border p-2 text-left">Action</th>}
                </tr>
              </thead>
              <tbody>
                {outlets.map((outlet, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="border p-2">{outlet}</td>
                    <td className="border p-2 text-green-600">Active</td>
                    {transferMode && (
                      <td className="border p-2">
                        <button
                          onClick={() => setSelectedSource(outlet)}
                          className={`px-2 py-1 mr-2 text-xs rounded ${selectedSource === outlet ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
                        >
                          Set as Source
                        </button>
                        <button
                          onClick={() => setSelectedTarget(outlet)}
                          className={`px-2 py-1 text-xs rounded ${selectedTarget === outlet ? 'bg-green-600 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
                        >
                          Set as Target
                        </button>
                      </td>
                    )}
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