import { useState } from "react";
import OpeningStock from "../OpeningStock";
import Primary from "../Primary";
import Secondary from "../Secondary";
import OfficeReturn from "../OfficeReturn";
import MarketReturn from "../MarketReturn";


export default function Home() {
  const [selectedTab, setSelectedTab] = useState("secondary");
  const [stock, setStock] = useState(0); // Total stock
  const user = JSON.parse(localStorage.getItem("pos-user"));

  return (
    <div>
      {/* Dropdown for Stock Operations */}
      <div className="p-4">
        <select
          value={selectedTab}
          onChange={(e) => setSelectedTab(e.target.value)}
          className="p-2 border rounded-lg"
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