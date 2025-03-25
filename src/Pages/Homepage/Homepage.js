import { useEffect, useState } from "react";
import OpeningStock from "../OpeningStock";
import Primary from "../Primary";
import Secondary from "../Secondary";
import OfficeReturn from "../OfficeReturn";
import MarketReturn from "../MarketReturn";
import axios from "axios";

export default function Home() {
  const [selectedTab, setSelectedTab] = useState("secondary");
  const [stock, setStock] = useState(0); // Total stock
  const user = JSON.parse(localStorage.getItem("pos-user"));

  useEffect(() => {
    if (user && user.outlet) {
      getStockValue(user.outlet); // Pass outlet name from the user object
    }
  }, [user]);

  const getStockValue = async (outletName) => {
    try {
      const response = await axios.get(
        `https://gvi-pos-server.vercel.app/api/stock-value/${outletName}`
      );
      const stockValue = response.data.totalStockValue;
      setStock(stockValue); // Update the stock state with the received value
    } catch (error) {
      console.error("Error fetching stock value:", error);
    }
  };

  return (
    <div>
      {/* Dropdown for Stock Operations */}
      <div className="p-4">
        <select
          value={selectedTab}
          onChange={(e) => setSelectedTab(e.target.value)}
          className="p-2 border rounded-lg w-[100%]"
        >
          <option value="opening">Opening Stock</option>
          <option value="primary">Primary</option>
          <option value="secondary">Secondary</option>
          <option value="officeReturn">Office Return</option>
          <option value="marketReturn">Market Return</option>
        </select>
      </div>

      {/* Render Selected Tab */}
      {selectedTab === "opening" && (
        <OpeningStock user={user} stock={stock} setStock={setStock} />
      )}
      {selectedTab === "primary" && (
        <Primary user={user} stock={stock} setStock={setStock} />
      )}
      {selectedTab === "secondary" && (
        <Secondary user={user} stock={stock} setStock={setStock} />
      )}
      {selectedTab === "officeReturn" && (
        <OfficeReturn user={user} stock={stock} setStock={setStock} />
      )}
      {selectedTab === "marketReturn" && (
        <MarketReturn user={user} stock={stock} setStock={setStock} />
      )}
    </div>
  );
}
