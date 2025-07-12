import React, { useEffect, useState } from "react";
import axios from "axios";
import AdminSidebar from "../../Component/AdminSidebar";
import OpeningStock from "../OpeningStock";
import Primary from "../Primary";
import Secondary from "../Secondary";
import OfficeReturn from "../OfficeReturn";
import MarketReturn from "../MarketReturn";

const ManageStock = () => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedTab, setSelectedTab] = useState("");
  const [stock, setStock] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        "https://gvi-pos-server.vercel.app/getAllUser"
      );
      setUsers(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching users:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedUser && selectedUser.outlet) {
      getStockValue(selectedUser.outlet);
    }
  }, [selectedUser]);

  const getStockValue = async (outletName) => {
    try {
      const response = await axios.get(
        `https://gvi-pos-server.vercel.app/api/stock-value/${outletName}`
      );
      setStock({
        dp: response.data.totalCurrentDP,
        tp: response.data.totalCurrentTP,
      });
    } catch (error) {
      console.error("Error fetching stock value:", error);
    }
  };

  const renderContent = () => {
    if (!selectedUser) {
      return (
        <div className="text-center text-red-500 font-medium mt-10">
          Please select a user to manage stock.
        </div>
      );
    }

    switch (selectedTab) {
      case "opening":
        return (
          <OpeningStock
            user={selectedUser}
            stock={stock}
            setStock={setStock}
            getStockValue={getStockValue}
          />
        );
      case "primary":
        return (
          <Primary
            user={selectedUser}
            stock={stock}
            setStock={setStock}
            getStockValue={getStockValue}
          />
        );
      case "secondary":
        return (
          <Secondary
            user={selectedUser}
            stock={stock}
            setStock={setStock}
            getStockValue={getStockValue}
          />
        );
      case "officeReturn":
        return (
          <OfficeReturn
            user={selectedUser}
            stock={stock}
            setStock={setStock}
            getStockValue={getStockValue}
          />
        );
      case "marketReturn":
        return (
          <MarketReturn
            user={selectedUser}
            stock={stock}
            setStock={setStock}
            getStockValue={getStockValue}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <AdminSidebar />

      <main className="flex-1 p-6">
        <div className="max-w-5xl mx-auto space-y-6">
          <h1 className="text-2xl font-bold text-gray-800">Manage Stock</h1>

          <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="mb-6">
              <label className="block text-gray-700 font-medium mb-2">
                Select User
              </label>
              <select
                value={selectedUser ? selectedUser._id : ""}
                onChange={(e) => {
                  const userId = e.target.value;
                  const user = users.find((u) => u._id === userId);
                  setSelectedUser(user);
                  setSelectedTab("");
                }}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Choose a user --</option>
                {users.map((user) => (
                  <option key={user._id} value={user._id}>
                    {user.outlet} ({user.name}) - {user.role}
                  </option>
                ))}
              </select>
            </div>

            {selectedUser && (
              <>
                <div className="mb-4 text-blue-600 font-semibold text-lg">
                  Total Stock Value (DP): {stock?.dp?.toFixed()}
                </div>

                <div className="mb-6">
                  <label className="block text-gray-700 font-medium mb-2">
                    Select Stock Operation
                  </label>
                  <select
                    value={selectedTab}
                    onChange={(e) => setSelectedTab(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Choose Operation --</option>
                    <option value="opening">Opening Stock</option>
                    <option value="primary">Primary</option>
                    <option value="secondary">Secondary</option>
                    <option value="officeReturn">Office Return</option>
                    <option value="marketReturn">Market Return</option>
                  </select>
                </div>
              </>
            )}
          </div>

          {/* Tab content */}
          {selectedTab && (
            <div className="bg-white p-6 rounded-xl shadow-md">
              {renderContent()}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ManageStock;
