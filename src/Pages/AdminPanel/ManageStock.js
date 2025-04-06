import React, { useEffect, useState } from "react";
import axios from "axios";
import AdminSidebar from "../../Component/AdminSidebar";
import OpeningStock from "../OpeningStock";
import Primary from "../Primary";
import Secondary from "../Secondary";
import OfficeReturn from "../OfficeReturn";
import MarketReturn from "../MarketReturn";

const outlets = [
  "Madina Trade International: New Market",
  "Shamima Akter: New Market",
  "Sheikh Enterprise: Mirpur",
];

const ManageStock = () => {
  const user = JSON.parse(localStorage.getItem("pos-user"));
  const isAdmin = true;
  const [selectedOutlet, setSelectedOutlet] = useState("");
  const [selectedTab, setSelectedTab] = useState("");
  const [stock, setStock] = useState(0);

  useEffect(() => {
    if (selectedOutlet) {
      getStockValue(selectedOutlet);
    }
  }, [selectedOutlet]);

  const getStockValue = async (outletName) => {
    try {
      const response = await axios.get(
        `https://gvi-pos-server.vercel.app/api/stock-value/${outletName}`
      );
      const stockValue = response.data.totalStockValue;
      setStock(stockValue);
    } catch (error) {
      console.error("Error fetching stock value:", error);
    }
  };

  const renderContent = () => {
    if (!selectedOutlet) {
      return (
        <div className="text-center text-red-500 font-medium mt-10">
          Please select an outlet to manage stock.
        </div>
      );
    }

    const outletUser = { ...user, outlet: selectedOutlet };

    switch (selectedTab) {
      case "opening":
        return <OpeningStock user={outletUser} stock={stock} setStock={setStock} />;
      case "primary":
        return <Primary user={outletUser} stock={stock} setStock={setStock} />;
      case "secondary":
        return <Secondary user={outletUser} stock={stock} setStock={setStock} />;
      case "officeReturn":
        return <OfficeReturn user={outletUser} stock={stock} setStock={setStock} />;
      case "marketReturn":
        return <MarketReturn user={outletUser} stock={stock} setStock={setStock} />;
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
            {isAdmin && (
              <div className="mb-6">
                <label className="block text-gray-700 font-medium mb-2">
                  Select Outlet
                </label>
                <select
                  value={selectedOutlet}
                  onChange={(e) => {
                    setSelectedOutlet(e.target.value);
                    setSelectedTab("");
                  }}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Choose an outlet --</option>
                  {outlets.map((outlet) => (
                    <option key={outlet} value={outlet}>
                      {outlet}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {selectedOutlet && (
              <>
                <div className="mb-4 text-blue-600 font-semibold text-lg">
                  Total Stock Value (DP): ৳ {stock.toFixed(2)}
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
                    {/* <option value="secondary">Secondary</option> */}
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
