import { useEffect, useState } from "react";
import OpeningStock from "../OpeningStock";
import Primary from "../Primary";
import Secondary from "../Secondary";
import OfficeReturn from "../OfficeReturn";
import MarketReturn from "../MarketReturn";
import axios from "axios";
import PaymentVoucher from "../../Component/PaymentVoucher";
import PosVoucher from "../PosVoucher";
import TadaVoucher from "../TadaVoucher";

export default function Home() {
  const [selectedTab, setSelectedTab] = useState("secondary");
  const [stock, setStock] = useState(0); // Total stock
  const [currentDue, setCurrentDue] = useState(0); // Total due
  const user = JSON.parse(localStorage.getItem("pos-user"));

  useEffect(() => {
    if (user && user.outlet) {
      getStockValue(user.outlet); // Pass outlet name from the user object
    }
  }, []);

  // const getStockValue = async (outletName) => {
  //   try {
  //     const response = await axios.get(
  //       `https://gvi-pos-server.vercel.app/api/stock-value/${outletName}`
  //     );
  //     const stockValue = response.data.totalCurrentDP;
  //     setStock({dp:response.data.totalCurrentDP,tp:response.data.totalCurrentTP}); // Update the stock state with the received value
  //   } catch (error) {
  //     console.error("Error fetching stock value:", error);
  //   }
  // };
  const getStockValue = async (outletName) => {
    try {
      const encodedOutletName = encodeURIComponent(outletName);
      const response = await axios.get(
        `https://gvi-pos-server.vercel.app/api/stock-value/${encodedOutletName}`
      );
      const due = await axios.get(
        `https://gvi-pos-server.vercel.app/current-due/${encodedOutletName}`
      );

      setCurrentDue(due.data.current_due);
      setStock({
        dp: response.data.totalCurrentDP,
        tp: response.data.totalCurrentTP,
      });
    } catch (error) {
      console.error("Error fetching stock value:", error);
    }
  };

  return (
    <div className="py-4 w-full max-w-md mx-auto min-h-screen">
      {/* Dropdown for Stock Operations */}
      <div className="p-4 sm:py-4">
        {/* <p className="p-1 text-sm mb-1 font-bold text-secondary">Select Your Voucher</p> */}
        <select
          value={selectedTab}
          onChange={(e) => setSelectedTab(e.target.value)}
          className="p-2 border rounded-lg w-[100%]"
        >
          <option value="opening">Opening Stock</option>
          <option value="primary">Primary</option>
          <option value="secondary">Secondary</option>
          <option value="pos">POS</option>
          <option value="officeReturn">Office Return</option>
          <option value="marketReturn">Market Return</option> 
          <option value="payment">Payment</option> 
          <option value="tada">TA/DA</option> 
        </select>
      </div>

      {/* Render Selected Tab */}
      {selectedTab === "opening" && (
        <OpeningStock
          user={user}
          stock={stock}
          currentDue={currentDue}
          setStock={setStock}
          getStockValue={getStockValue}
        />
      )}
      {selectedTab === "primary" && (
        <Primary
          user={user}
          stock={stock}
          setStock={setStock}
          currentDue={currentDue}
          getStockValue={getStockValue}
        />
      )}
      {selectedTab === "secondary" && (
        <Secondary
          user={user}
          stock={stock}
          setStock={setStock}
          currentDue={currentDue}
          getStockValue={getStockValue}
        />
      )}
      {selectedTab === "officeReturn" && (
        <OfficeReturn
          user={user}
          stock={stock}
          setStock={setStock}
          currentDue={currentDue}
          getStockValue={getStockValue}
        />
      )}
      {selectedTab === "marketReturn" && (
        <MarketReturn
          user={user}
          stock={stock}
          setStock={setStock}
          currentDue={currentDue}
          getStockValue={getStockValue}
        />
      )}
      {selectedTab === "payment" && (
        <PaymentVoucher
          user={user}
          stock={stock}
          setStock={setStock}
          currentDue={currentDue}
          getStockValue={getStockValue}
        />
      )}
      {selectedTab === "pos" && (
        <PosVoucher
          user={user}
          stock={stock}
          setStock={setStock}
          currentDue={currentDue}
          getStockValue={getStockValue}
        />
      )}
      {selectedTab === "tada" && (
        <TadaVoucher
          user={user}
          stock={stock}
          setStock={setStock}
          currentDue={currentDue}
          getStockValue={getStockValue}
        />
      )}
    </div>
  );
}
