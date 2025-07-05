import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Menu,
  X,
  Package,
  BarChart2,
  Users,
  Layers,
  ChevronDown,
  Target,
  Grid,
  Gift,
  Box,
  PlusCircle,
  Edit3,
  SheetIcon,
} from "lucide-react";
import { BiCategoryAlt, BiSolidReport } from "react-icons/bi";
import { BsCashCoin, BsShop } from "react-icons/bs";

const AdminSidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [dashboardDropdownOpen, setDashboardDropdownOpen] = useState(false);
  const [salesDropdownOpen, setSalesDropdownOpen] = useState(false);
  const [salesDropdown1Open, setSalesDropdown1Open] = useState(false);
  const [createDropdownOpen, setCreateDropdownOpen] = useState(false);
  const [alterDropdownOpen, setAlterDropdownOpen] = useState(false);
  const [targetDropdownOpen, setTargetDropdownOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    {
      name: "Manage Stock",
      path: "/admin/manage-stock",
      icon: <Layers size={20} />,
    },
    {
      name: "Promotion Plan",
      path: "/admin/promotion",
      icon: <Gift size={20} />,
    },
    {
      name: "Accounts",
      path: "/admin/money-transaction",
      icon: <BsCashCoin size={20} />,
    },
    {
      name: "TA/DA Report",
      path: "/admin/tada",
      icon: <BiSolidReport size={20} />,
    },
    {
      name: "Salary Sheet",
      path: "/admin/salary",
      icon: <SheetIcon size={20} />,
    },
  ];

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed top-4 left-4 z-50 bg-gray-800 text-white p-2 rounded-md shadow-md"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full bg-gray-900 text-white w-72 p-5 shadow-lg transform transition-transform duration-300 ease-in-out 
        ${isOpen ? "translate-x-0" : "-translate-x-64"} md:translate-x-0 md:relative md:h-screen`}
        style={{ position: "sticky", top: 0 }}
      >
        <h2 className="text-xl font-bold mb-6 text-left">Admin Panel</h2>

        <nav className="space-y-2">
          {/* Dashboard Dropdown */}
          <div>
            <button
              className="flex items-center justify-between w-full px-4 py-3 rounded-md transition-all duration-200 hover:bg-gray-800"
              onClick={() => setDashboardDropdownOpen(!dashboardDropdownOpen)}
            >
              <span className="flex items-center gap-3">
                <Grid size={20} />
                Dashboard
              </span>
              <ChevronDown
                size={16}
                className={dashboardDropdownOpen ? "rotate-180" : ""}
              />
            </button>
            {dashboardDropdownOpen && (
              <div className="ml-6 mt-2 space-y-2">
                <Link
                  to="/admin"
                  className="block px-4 py-2 rounded-md transition-all duration-200 hover:bg-gray-800"
                >
                  POS
                </Link>
                <a
                  href="https://rl.luvit.com.bd/admin-panel"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block px-4 py-2 rounded-md transition-all duration-200 hover:bg-gray-800"
                >
                  Attendance
                </a>
                {/* <a
                  href="https://attendance.luvit.com.bd/admin"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block px-4 py-2 rounded-md transition-all duration-200 hover:bg-gray-800"
                >
                  AMD / GVI / NMT
                </a> */}
              </div>
            )}
          </div>

          {/* Static Navigation Items */}
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-md transition-all duration-200 ${
                location.pathname === item.path
                  ? "bg-gray-700"
                  : "hover:bg-gray-800"
              }`}
            >
              {item.icon}
              <span>{item.name}</span>
            </Link>
          ))}

          {/* Target Dropdown */}
          <div>
            <button
              className="flex items-center justify-between w-full px-4 py-3 rounded-md transition-all duration-200 hover:bg-gray-800"
              onClick={() => setTargetDropdownOpen(!targetDropdownOpen)}
            >
              <span className="flex items-center gap-3">
                <Target size={20} />
                Target
              </span>
              <ChevronDown
                size={16}
                className={targetDropdownOpen ? "rotate-180" : ""}
              />
            </button>
            {targetDropdownOpen && (
              <div className="ml-6 mt-2 space-y-2">
                <Link
                  to="/admin/monthly-target"
                  className="block px-4 py-2 rounded-md transition-all duration-200 hover:bg-gray-800"
                >
                  Sale Target
                </Link>
                <Link
                  to="/admin/category-target"
                  className="block px-4 py-2 rounded-md transition-all duration-200 hover:bg-gray-800"
                >
                  Category Wise Target
                </Link>
                <Link
                  to="/admin/brand-target"
                  className="block px-4 py-2 rounded-md transition-all duration-200 hover:bg-gray-800"
                >
                  Brand Wise Target
                </Link>
              </div>
            )}
          </div>

          {/* Create Dropdown */}
          <div>
            <button
              className="flex items-center justify-between w-full px-4 py-3 rounded-md transition-all duration-200 hover:bg-gray-800"
              onClick={() => setCreateDropdownOpen(!createDropdownOpen)}
            >
              <span className="flex items-center gap-3">
                <PlusCircle size={20} />
                Create
              </span>
              <ChevronDown
                size={16}
                className={createDropdownOpen ? "rotate-180" : ""}
              />
            </button>
            {createDropdownOpen && (
              <div className="ml-6 mt-2 space-y-2">
                <Link
                  to="/admin/create-product"
                  className="block px-4 py-2 rounded-md hover:bg-gray-800 flex items-center gap-2"
                >
                  <Package size={16} /> Product
                </Link>
                <Link
                  to="/admin/create-category"
                  className="block px-4 py-2 rounded-md hover:bg-gray-800 flex items-center gap-2"
                >
                  <BiCategoryAlt size={16} /> Category
                </Link>
                <Link
                  to="/admin/create-user"
                  className="block px-4 py-2 rounded-md hover:bg-gray-800 flex items-center gap-2"
                >
                  <Users size={16} /> User
                </Link>
                <Link
                  to="/admin/create-outlet"
                  className="block px-4 py-2 rounded-md hover:bg-gray-800 flex items-center gap-2"
                >
                  <BsShop size={16} /> Outlet
                </Link>
              </div>
            )}
          </div>

          {/* Alter Dropdown */}
          <div>
            <button
              className="flex items-center justify-between w-full px-4 py-3 rounded-md transition-all duration-200 hover:bg-gray-800"
              onClick={() => setAlterDropdownOpen(!alterDropdownOpen)}
            >
              <span className="flex items-center gap-3">
                <Edit3 size={20} />
                Alter
              </span>
              <ChevronDown
                size={16}
                className={alterDropdownOpen ? "rotate-180" : ""}
              />
            </button>
            {alterDropdownOpen && (
              <div className="ml-6 mt-2 space-y-2">
                <Link
                  to="/admin/alter-products"
                  className="block px-4 py-2 rounded-md hover:bg-gray-800 flex items-center gap-2"
                >
                  <Package size={16} /> Products
                </Link>
                <Link
                  to="/admin/alter-categories"
                  className="block px-4 py-2 rounded-md hover:bg-gray-800 flex items-center gap-2"
                >
                  <BiCategoryAlt size={16} /> Category
                </Link>
                <Link
                  to="/admin/alter-users"
                  className="block px-4 py-2 rounded-md hover:bg-gray-800 flex items-center gap-2"
                >
                  <Users size={16} /> Users
                </Link>
                <Link
                  to="/admin/alter-outlets"
                  className="block px-4 py-2 rounded-md hover:bg-gray-800 flex items-center gap-2"
                >
                  <BsShop size={16} /> Outlets
                </Link>
              </div>
            )}
          </div>

          {/* Sales Movement Dropdown */}
          <div>
            <button
              className="flex items-center justify-between w-full px-4 py-3 rounded-md hover:bg-gray-800"
              onClick={() => setSalesDropdownOpen(!salesDropdownOpen)}
            >
              <span className="flex items-center gap-3">
                <BarChart2 size={20} />
                Sales Movement
              </span>
              <ChevronDown
                size={16}
                className={salesDropdownOpen ? "rotate-180" : ""}
              />
            </button>
            {salesDropdownOpen && (
              <div className="ml-6 mt-2 space-y-2">
                <Link
                  to="/admin/sales-movement/dealer-wise"
                  className="block px-4 py-2 rounded-md hover:bg-gray-800"
                >
                  User Wise
                </Link>
                <Link
                  to="/admin/sales-movement/brand-wise"
                  className="block px-4 py-2 rounded-md hover:bg-gray-800"
                >
                  Brand Wise
                </Link>
                <Link
                  to="/admin/sales-movement/product-wise"
                  className="block px-4 py-2 rounded-md hover:bg-gray-800"
                >
                  Product Wise
                </Link>
                <Link
                  to="/admin/sales-movement/category-wise"
                  className="block px-4 py-2 rounded-md hover:bg-gray-800"
                >
                  Category Wise
                </Link>
              </div>
            )}
          </div>

          {/* Stock Movement Dropdown */}
          <div>
            <button
              className="flex items-center justify-between w-full px-4 py-3 rounded-md hover:bg-gray-800"
              onClick={() => setSalesDropdown1Open(!salesDropdown1Open)}
            >
              <span className="flex items-center gap-3">
                <Box size={20} /> Stock Movement
              </span>
              <ChevronDown
                size={16}
                className={salesDropdown1Open ? "rotate-180" : ""}
              />
            </button>
            {salesDropdown1Open && (
              <div className="ml-6 mt-2 space-y-2">
                <Link
                  to="/stock-movement/dealer"
                  className="block px-4 py-2 rounded-md hover:bg-gray-800"
                >
                  Dealer Wise
                </Link>
                <Link
                  to="/stock-movement/group"
                  className="block px-4 py-2 rounded-md hover:bg-gray-800"
                >
                  Group Wise
                </Link>
              </div>
            )}
          </div>
        </nav>
      </div>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
};

export default AdminSidebar;
