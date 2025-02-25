import { createBrowserRouter } from "react-router-dom";
import LoginForm from "../Component/Login";
import Main from "../Layout/Main";
import SignUpForm from "../Component/Signup";
import Profile from "../Component/Profile";



import TodaysSale from "../Pages/Homepage/Homepage";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Main></Main>,
    children: [
      {
        path: "/",
        element: <TodaysSale/>,
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
    ],
  },

]);

export default router;
