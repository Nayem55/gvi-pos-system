import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Package, BarChart2, Users, Layers } from "lucide-react";

const AdminSidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  // Sidebar navigation items
  const navItems = [
    { name: "Products", path: "/admin", icon: <Package size={20} /> },
    { name: "Sale Reports", path: "/admin/monthly-report", icon: <BarChart2 size={20} /> },
    { name: "Manage Stock", path: "/admin/manage-stock", icon: <Layers size={20} /> },
    { name: "Users", path: "/admin/users", icon: <Users size={20} /> },
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
        className={`fixed top-0 left-0 h-full bg-gray-900 text-white w-64 p-5 shadow-lg transform transition-transform duration-300 ease-in-out 
        ${isOpen ? "translate-x-0" : "-translate-x-64"} md:translate-x-0 md:relative md:h-screen`}
        style={{ position: "sticky", top: 0 }}
      >
        <h2 className="text-xl font-bold mb-6 text-left">Admin Panel</h2>
        
        {/* Navigation Links */}
        <nav>
          {navItems.map((item) => (
            <Link 
              key={item.path} 
              to={item.path} 
              className={`flex items-center gap-3 px-4 py-3 rounded-md transition-all duration-200 
                ${location.pathname === item.path ? "bg-gray-700" : "hover:bg-gray-800"}`}
            >
              {item.icon}
              <span>{item.name}</span>
            </Link>
          ))}
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
