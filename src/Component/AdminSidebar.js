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
} from "lucide-react";

const AdminSidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [salesDropdownOpen, setSalesDropdownOpen] = useState(false);
  const [salesDropdown1Open, setSalesDropdown1Open] = useState(false);
  const [createDropdownOpen, setCreateDropdownOpen] = useState(false);
  const [alterDropdownOpen, setAlterDropdownOpen] = useState(false);
  const location = useLocation();

  // Sidebar navigation items
  const navItems = [
    { name: "Dashboard", path: "/admin", icon: <Grid size={20} /> },
    {
      name: "Manage Stock",
      path: "/admin/manage-stock",
      icon: <Layers size={20} />,
    },
    {
      name: "Monthly Target",
      path: "/admin/monthly-target",
      icon: <Target size={20} />,
    },
    {
      name: "Promotion Plan",
      path: "/admin/promotion",
      icon: <Gift size={20} />,
    },
    {
      name: "Accounts",
      path: "/admin/money-transaction",
      icon: <Gift size={20} />,
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
        ${
          isOpen ? "translate-x-0" : "-translate-x-64"
        } md:translate-x-0 md:relative md:h-screen`}
        style={{ position: "sticky", top: 0 }}
      >
        <h2 className="text-xl font-bold mb-6 text-left">Admin Panel</h2>

        {/* Navigation Links */}
        <nav className="space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-md transition-all duration-200 
                ${
                  location.pathname === item.path
                    ? "bg-gray-700"
                    : "hover:bg-gray-800"
                }`}
            >
              {item.icon}
              <span>{item.name}</span>
            </Link>
          ))}

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
                  className="block px-4 py-2 rounded-md transition-all duration-200 hover:bg-gray-800 flex items-center gap-2"
                >
                  <Package size={16} /> Product
                </Link>
                <Link
                  to="/admin/create-user"
                  className="block px-4 py-2 rounded-md transition-all duration-200 hover:bg-gray-800 flex items-center gap-2"
                >
                  <Users size={16} /> User
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
                  className="block px-4 py-2 rounded-md transition-all duration-200 hover:bg-gray-800 flex items-center gap-2"
                >
                  <Package size={16} /> Products
                </Link>
                <Link
                  to="/admin/alter-users"
                  className="block px-4 py-2 rounded-md transition-all duration-200 hover:bg-gray-800 flex items-center gap-2"
                >
                  <Users size={16} /> Users
                </Link>
              </div>
            )}
          </div>

          {/* Monthly Sales Movement Dropdown */}
          <div>
            <button
              className="flex items-center justify-between w-full px-4 py-3 rounded-md transition-all duration-200 hover:bg-gray-800"
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
                  className="block px-4 py-2 rounded-md transition-all duration-200 hover:bg-gray-800"
                >
                  Dealer Wise
                </Link>
                <Link
                  to="/admin/sales-movement/product-wise"
                  className="block px-4 py-2 rounded-md transition-all duration-200 hover:bg-gray-800"
                >
                  Product Wise
                </Link>
                <Link
                  to="/admin/sales-movement/category-wise"
                  className="block px-4 py-2 rounded-md transition-all duration-200 hover:bg-gray-800"
                >
                  Category Wise
                </Link>
              </div>
            )}
          </div>

          {/* Stock Movement Dropdown */}
          <div>
            <button
              className="flex items-center justify-between w-full px-4 py-3 rounded-md transition-all duration-200 hover:bg-gray-800"
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
                  className="block px-4 py-2 rounded-md transition-all duration-200 hover:bg-gray-800"
                >
                  Dealer Wise
                </Link>
                <Link
                  to="/stock-movement/group"
                  className="block px-4 py-2 rounded-md transition-all duration-200 hover:bg-gray-800"
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