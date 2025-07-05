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

export default function Home() {
  const [selectedTab, setSelectedTab] = useState("secondary");
  const [stock, setStock] = useState(0); // Total stock
  const [currentDue, setCurrentDue] = useState(0); // Total due
  const user = JSON.parse(localStorage.getItem("pos-user"));
  const attendanceUser = JSON.parse(localStorage.getItem("attendance-user"));
  const [locationError, setLocationError] = useState("");
  const [isLocationEnabled, setIsLocationEnabled] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (user && user.outlet) {
      getStockValue(user.outlet);
    }
  }, [user]);

  const fetchUserData = useCallback(async () => {
    if (!attendanceUser) return;

    try {
      setDataLoading(true);
      const response = await axios.get(
        `https://attendance-app-server-blue.vercel.app/getUser/${attendanceUser?._id}`
      );
      localStorage.setItem("attendance-user", JSON.stringify(response.data));
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setDataLoading(false);
    }
  }, [attendanceUser]);

  const fetchUserLocation = async () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        const error = "Geolocation is not supported by your browser.";
        setLocationError(error);
        reject(error);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setIsLocationEnabled(true);
          resolve({ latitude, longitude });
        },
        (error) => {
          let errorMessage = "An unknown error occurred.";
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = "Location access denied. Please allow location permissions.";
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = "Location information is unavailable.";
              break;
            case error.TIMEOUT:
              errorMessage = "Request timed out. Please try again.";
              break;
          }
          setLocationError(errorMessage);
          setIsLocationEnabled(false);
          reject(errorMessage);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  };

  useEffect(() => {
    if (!attendanceUser) {
      navigate("/login");
    } else {
      fetchUserData();
      fetchUserLocation().catch(() => {}); // Silently handle location errors
    }
  }, [attendanceUser, navigate, fetchUserData]);

  const getStockValue = async (outletName) => {
    try {
      const encodedOutletName = encodeURIComponent(outletName);
      const [stockResponse, dueResponse] = await Promise.all([
        axios.get(`https://gvi-pos-server.vercel.app/api/stock-value/${encodedOutletName}`),
        axios.get(`https://gvi-pos-server.vercel.app/current-due/${encodedOutletName}`)
      ]);

      setCurrentDue(dueResponse.data.current_due);
      setStock({
        dp: stockResponse.data.totalCurrentDP,
        tp: stockResponse.data.totalCurrentTP,
      });
    } catch (error) {
      console.error("Error fetching stock data:", error);
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
          <option value="opening">Opening Stock</option>
          <option value="primary">Primary</option>
          <option value="secondary">Secondary</option>
          <option value="pos">POS</option>
          <option value="officeReturn">Office Return</option>
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
        />
      )}
      {selectedTab === "primary" && (
        <PrimaryRequest
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
      {selectedTab === "attendance" && (
        <AttendanceVoucher/>
      )}
    </div>
  );
}