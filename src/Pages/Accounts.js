import { useEffect, useState } from "react";
import axios from "axios";
import PaymentVoucher from "../Component/PaymentVoucher";

export default function Accounts() {
  const [selectedTab, setSelectedTab] = useState("primary");
  const [currentDue, setCurrentDue] = useState(0);
  const user = JSON.parse(localStorage.getItem("pos-user"));



  return (
    <div className="">
  
    </div>
  );
}