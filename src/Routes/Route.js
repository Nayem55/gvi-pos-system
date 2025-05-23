import { createBrowserRouter } from "react-router-dom";
import LoginForm from "../Component/Login";
import Main from "../Layout/Main";
import SignUpForm from "../Component/Signup";
import Profile from "../Component/Profile";
import TodaysSale from "../Pages/Homepage/Homepage";
import UserDashboard from "../Pages/UserDashboard";
import AdminProducts from './../Pages/AdminPanel/Products';
import DailyReport from "../Pages/AdminPanel/DailyReport";
import ManageStock from "../Pages/AdminPanel/ManageStock";
import UserManagementPage from "../Pages/AdminPanel/Users";
import DealerSalesReport from "../Pages/AdminPanel/DealerSalesReport";
import CategoryWiseSalesReport from "../Pages/AdminPanel/CategorySalesReport";
import CategoryReportDetails from "../Pages/AdminPanel/CategoryReportDetails";
import ProductWiseSalesReport from "../Pages/AdminPanel/ProductWiseSalesReport";
import DailyDealerSalesReport from "../Pages/AdminPanel/DailyDealerSalesReport";
import ManageUserStock from "../Pages/UserStock";
import MonthlyTargetPage from "../Pages/AdminPanel/MonthlyTarget";
import AdminHomePage from "../Pages/AdminPanel/AdminHomePage";
import Home from "../Pages/Homepage/Homepage";
import PromotionalPage from "../Pages/AdminPanel/Promotion";
import StockMovementReport from "../Pages/AdminPanel/StockMovementReport";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Main></Main>,
    children: [
      {
        path: "/",
        element: <Home/>,
      },
      {
        path: "/home",
        element: <TodaysSale />,
      },

      {
        path: "/login",
        element: <LoginForm />,
      },
      {
        path: "/signup",
        element: <SignUpForm/>,
      },
      {
        path: "/profile",
        element: <Profile/>,
      },
      {
        path: "/dashboard",
        element: <UserDashboard/>,
      },
      {
        path: "/stock-movement",
        element: <StockMovementReport/>,
      },
      {
        path: "/manage-stock",
        element: <ManageUserStock/>,
      },
      {
        path: "/admin",
        element: <AdminHomePage/>,
      },
      {
        path: "/admin/products",
        element: <AdminProducts/>,
      },
      {
        path: "/admin/promotion",
        element: <PromotionalPage/>,
      },
      {
        path: "/admin/stock-movement",
        element: <StockMovementReport/>,
      },
      {
        path: "/admin/sales-movement/dealer-wise",
        element: <DealerSalesReport/>,
      },
      {
        path: "/admin/sales-movement/category-wise",
        element: <CategoryWiseSalesReport/>,
      },
      {
        path: "/admin/sales-movement/category-wise/detail/:category",
        element: <CategoryReportDetails/>,
      },
      {
        path: "/admin/sales-movement/product-wise",
        element: <ProductWiseSalesReport/>,
      },
      {
        path: "/sales-report/daily/:userId",
        element: <DailyReport/>,
      },
      {
        path: "/admin/manage-stock",
        element: <ManageStock/>,
      },
      {
        path: "/admin/users",
        element: <UserManagementPage/>,
      },
      {
        path: "/admin/monthly-target",
        element: <MonthlyTargetPage/>,
      },
      {
        path: "/admin/daily/dealer-sales-report",
        element: <DailyDealerSalesReport/>,
      },
 

    ],
  },

]);

export default router;
