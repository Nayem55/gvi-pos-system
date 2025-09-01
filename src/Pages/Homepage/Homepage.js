import { useCallback, useEffect, useState } from "react";
import OpeningStock from "../OpeningStock";
import Primary from "../Primary";
import Secondary from "../Secondary";
import OfficeReturn from "../OfficeReturn";
import MarketReturn from "../MarketReturn";
import axios from "axios";
import PaymentVoucher from "../../Component/PaymentVoucher";
import PosVoucher from "../PosVoucher";
import TadaVoucher from "../TadaVoucher";
import AttendanceVoucher from "../CheckInOut";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";
import PrimaryRequest from "../PrimaryRequest";
import toast from "react-hot-toast";

export default function Home() {
  const [selectedTab, setSelectedTab] = useState("secondary");
  const [stock, setStock] = useState({ dp: 0, tp: 0 }); // Total stock with dp and tp
  const [currentDue, setCurrentDue] = useState(0); // Total due
  const [target, setTarget] = useState(null); // Monthly target
  const [totalTP, setTotalTP] = useState(0); // Total TP for achievement calculation
  const [dataLoading, setDataLoading] = useState(true); // Unified loading state
  const user = JSON.parse(localStorage.getItem("pos-user"));
  const attendanceUser = JSON.parse(localStorage.getItem("attendance-user"));
  const [locationError, setLocationError] = useState("");
  const [isLocationEnabled, setIsLocationEnabled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    const fetchData = async () => {
      try {
        await Promise.all([
          getStockValue(user.outlet),
          fetchUserTargetAndAchievement(),
        ]);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load data. Please try again.");
      } finally {
        setDataLoading(false); // Stop loading regardless of success or failure
      }
    };
    fetchData();
  }, []);

  const fetchUserTargetAndAchievement = async () => {
    try {
      const currentMonth = dayjs().format("YYYY-MM");
      const year = currentMonth.split("-")[0];
      const month = currentMonth.split("-")[1];

      // Fetch target
      const targetResponse = await axios.get(
        "http://175.29.181.245:5000/targets",
        {
          params: { year, month, userID: user._id },
        }
      );
      const targetEntry = targetResponse.data.find(
        (entry) => entry.userID === user._id
      );
      if (targetEntry) {
        const targetForMonth = targetEntry.targets.find(
          (t) => t.year === parseInt(year) && t.month === parseInt(month)
        );
        if (targetForMonth) {
          setTarget(targetForMonth);
        }
      }

      // Fetch sales reports for the current month to calculate achievement
      const reportsResponse = await axios.get(
        `http://175.29.181.245:5000/sales-reports/${user._id}?month=${currentMonth}`
      );
      const reports = reportsResponse.data;
      const totalTPValue = reports.reduce(
        (sum, report) => sum + (report.total_tp || 0),
        0
      );
      setTotalTP(totalTPValue);
    } catch (error) {
      console.error("Error fetching target or achievement:", error);
      toast.error("Failed to load target or achievement data.");
    }
  };

  const getStockValue = async (outletName) => {
    try {
      const encodedOutletName = encodeURIComponent(outletName);
      const [stockResponse, dueResponse] = await Promise.all([
        axios.get(
          `http://175.29.181.245:5000/api/stock-value/${encodedOutletName}`
        ),
        axios.get(
          `http://175.29.181.245:5000/current-due/${encodedOutletName}`
        ),
      ]);
      setCurrentDue(dueResponse.data.current_due);
      setStock({
        dp: stockResponse.data.totalCurrentDP,
        tp: stockResponse.data.totalCurrentTP,
      });
    } catch (error) {
      console.error("Error fetching stock data:", error);
      // toast.error("Failed to load stock data.");
    }
  };

  return (
    <div className="py-4 w-full max-w-md mx-auto min-h-screen">
      <div className="p-4 sm:py-4">
        <select
          value={selectedTab}
          onChange={(e) => setSelectedTab(e.target.value)}
          className="p-2 border rounded-lg w-[100%]"
        >
          {/* <option value="opening">Opening Stock</option> */}
          <option value="primary request">Primary Request</option>
          {/* <option value="primary">Primary</option> */}
          <option value="secondary">Secondary</option>
          {/* <option value="pos">POS</option> */}
          {/* <option value="officeReturn">Office Return</option> */}
          <option value="marketReturn">Market Return</option>
          <option value="payment">Payment</option>
          <option value="tada">TA/DA</option>
          <option value="attendance">Check In/Out</option>
        </select>
      </div>

      {selectedTab === "opening" && (
        <OpeningStock
          user={user}
          stock={stock}
          currentDue={currentDue}
          setStock={setStock}
          getStockValue={getStockValue}
          target={target}
          totalTP={totalTP}
          dataLoading={dataLoading}
        />
      )}
      {selectedTab === "primary request" && (
        <PrimaryRequest
          user={user}
          stock={stock}
          setStock={setStock}
          currentDue={currentDue}
          getStockValue={getStockValue}
          target={target}
          totalTP={totalTP}
          dataLoading={dataLoading}
        />
      )}
      {selectedTab === "primary" && (
        <Primary
          user={user}
          stock={stock}
          setStock={setStock}
          currentDue={currentDue}
          getStockValue={getStockValue}
          target={target}
          totalTP={totalTP}
          dataLoading={dataLoading}
        />
      )}
      {selectedTab === "secondary" && (
        <Secondary
          user={user}
          stock={stock}
          setStock={setStock}
          currentDue={currentDue}
          getStockValue={getStockValue}
          target={target}
          totalTP={totalTP}
          dataLoading={dataLoading}
        />
      )}
      {selectedTab === "officeReturn" && (
        <OfficeReturn
          user={user}
          stock={stock}
          setStock={setStock}
          currentDue={currentDue}
          getStockValue={getStockValue}
          target={target}
          totalTP={totalTP}
          dataLoading={dataLoading}
        />
      )}
      {selectedTab === "marketReturn" && (
        <MarketReturn
          user={user}
          stock={stock}
          setStock={setStock}
          currentDue={currentDue}
          getStockValue={getStockValue}
          target={target}
          totalTP={totalTP}
          dataLoading={dataLoading}
        />
      )}
      {selectedTab === "payment" && (
        <PaymentVoucher
          user={user}
          stock={stock}
          setStock={setStock}
          currentDue={currentDue}
          getStockValue={getStockValue}
          target={target}
          totalTP={totalTP}
          dataLoading={dataLoading}
        />
      )}
      {selectedTab === "pos" && (
        <PosVoucher
          user={user}
          stock={stock}
          setStock={setStock}
          currentDue={currentDue}
          getStockValue={getStockValue}
          target={target}
          totalTP={totalTP}
          dataLoading={dataLoading}
        />
      )}
      {selectedTab === "tada" && (
        <TadaVoucher
          user={user}
          stock={stock}
          setStock={setStock}
          currentDue={currentDue}
          getStockValue={getStockValue}
          target={target}
          totalTP={totalTP}
          dataLoading={dataLoading}
        />
      )}
      {selectedTab === "attendance" && <AttendanceVoucher />}
    </div>
  );
}
