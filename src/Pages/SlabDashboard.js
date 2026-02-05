import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import AdminSidebar from "../Component/AdminSidebar";
import { Menu, X, Download, Eye, Trash2, Edit2 } from "lucide-react";

const SlabDashboard = () => {
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [zoneFilter, setZoneFilter] = useState("All");
  const [soFilter, setSoFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editQuantity, setEditQuantity] = useState("");
  const [customerToEdit, setCustomerToEdit] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const user = JSON.parse(localStorage.getItem("pos-user") || "{}");

  // Fetch Data
  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://175.29.181.245:2001/customer-sale-summary");
      const data = await response.json();
      setCustomers(data);
      setLoading(false);
    } catch (error) {
      console.error("Fetch failed", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // Filter Logic
  useEffect(() => {
    let filtered = [...customers];
    if (zoneFilter !== "All") filtered = filtered.filter(c => c.so_zone === zoneFilter);
    if (soFilter !== "All") filtered = filtered.filter(c => c.so_name === soFilter);
    if (user.role === "SO") {
      filtered = filtered.filter(c =>
        c.so_name?.trim().toLowerCase() === user.name?.trim().toLowerCase()
      );
    } else if (["ASM", "RSM", "SOM"].includes(user.role)) {
      filtered = filtered.filter(c =>
        c.so_zone?.toLowerCase().includes(user.zone?.toLowerCase())
      );
    }
    setFilteredCustomers(filtered);
  }, [zoneFilter, soFilter, customers]);

  const uniqueZones = ["All", ...new Set(customers.map(c => c.so_zone).filter(Boolean))];
  const uniqueSoNames = ["All", ...new Set(customers.map(c => c.so_name).filter(Boolean))];

  // Export
  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      filteredCustomers.map(c => ({
        "Customer Name": c.owner_name || "-",
        "Phone": c.owner_number || "-",
        "Shop": c.shop_name || "-",
        "Address": c.shop_address || "-",
        "Dealer": c.dealer_name || "-",
        "SO": c.so_name || "-",
        "Role": c.so_role || "-",
        "Zone": c.so_zone || "-",
        "SO #": c.so_number || "-",
        "ASM": c.asm || "-",
        "RSM": c.rsm || "-",
        "SOM": c.som || "-",
        "Lifetime Qty": c.lifetime_quantity || 0,
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Customers");
    XLSX.writeFile(wb, "Lifetime_Customers.xlsx");
  };

  // Delete Customer
  const deleteCustomer = async (owner_number) => {
    if (!window.confirm("Are you sure you want to delete this customer and their transactions?")) {
      return;
    }
    try {
      const res = await fetch(`http://175.29.181.245:2001/customer/${owner_number}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchCustomers();
      } else {
        alert("Failed to delete customer");
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting customer");
    }
  };

  // Edit Quantity
  const openEditModal = (customer) => {
    setCustomerToEdit(customer);
    setEditQuantity(customer.lifetime_quantity || 0);
    setIsEditModalOpen(true);
  };

  const saveQuantity = async () => {
    if (!customerToEdit) return;

    try {
      const res = await fetch(`http://175.29.181.245:2001/customer/${customerToEdit.owner_number}/quantity`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lifetime_quantity: parseInt(editQuantity) || 0 }),
      });

      if (res.ok) {
        fetchCustomers(); // Refresh data
        setIsEditModalOpen(false);
        setCustomerToEdit(null);
        setEditQuantity("");
      } else {
        const error = await res.json();
        alert("Failed to update quantity: " + error.message);
      }
    } catch (err) {
      console.error(err);
      alert("Error updating quantity");
    }
  };

  // Transaction Modal
  const openModal = async (customer) => {
    setSelectedCustomer(customer);
    setIsModalOpen(true);
    try {
      const res = await fetch(`http://175.29.181.245:2001/customer-transactions?owner_number=${customer.owner_number}`);
      const data = await res.json();
      const merged = data.reduce((acc, tx) => {
        const date = tx.sale_date.split(" ")[0];
        const existing = acc.find(t => t.sale_date === date);
        if (existing) {
          existing.purchase_quantity += tx.purchase_quantity;
          tx.products.forEach(p => {
            const ep = existing.products.find(x => x.product_name === p.product_name);
            ep ? (ep.quantity += p.quantity) : existing.products.push(p);
          });
        } else {
          acc.push({ sale_date: date, purchase_quantity: tx.purchase_quantity, products: [...tx.products] });
        }
        return acc;
      }, []);
      setTransactions(merged);
    } catch (err) {
      console.error(err);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedCustomer(null);
    setTransactions([]);
  };

  // Summary
  const totalCustomers = filteredCustomers.length;
  const totalQuantity = filteredCustomers.reduce((a, c) => a + (c.lifetime_quantity || 0), 0);
  const zoneSummary = filteredCustomers.reduce((acc, c) => {
    const z = c.so_zone || "Unknown";
    acc[z] = acc[z] || { count: 0, quantity: 0 };
    acc[z].count += 1;
    acc[z].quantity += c.lifetime_quantity || 0;
    return acc;
  }, {});

  return (
    <>
      <div className="flex min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        {user.role === "super admin" && <AdminSidebar />}
        <div className="flex-1 p-4 md:p-6 lg:p-8 relative">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
              Lifetime Customer Summary
            </h1>
            <button
              onClick={exportToExcel}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg shadow-md transition"
            >
              <Download className="w-4 h-4" /> Export
            </button>
          </div>

          {user.role !== "SO" && (
            <div className="mb-6">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="sm:hidden w-full text-left bg-white p-3 rounded-lg shadow flex justify-between items-center font-semibold"
              >
                Filters {showFilters ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
              <div className={`${showFilters ? "block" : "hidden"} sm:block mt-3 sm:mt-0`}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white p-4 rounded-lg shadow">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Zone</label>
                    <select
                      value={zoneFilter}
                      onChange={(e) => setZoneFilter(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:ring-2 focus:ring-blue-500"
                    >
                      {uniqueZones.map(z => <option key={z} value={z}>{z}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">SO Name</label>
                    <select
                      value={soFilter}
                      onChange={(e) => setSoFilter(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:ring-2 focus:ring-blue-500"
                    >
                      {uniqueSoNames.map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-5 rounded-xl shadow-lg">
              <h3 className="text-lg font-semibold">Total Customers</h3>
              <p className="text-3xl font-bold mt-1">{totalCustomers.toLocaleString()}</p>
            </div>
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-5 rounded-xl shadow-lg">
              <h3 className="text-lg font-semibold">Lifetime Quantity</h3>
              <p className="text-3xl font-bold mt-1">{totalQuantity.toLocaleString()}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-5 mb-6 overflow-hidden">
            <h3 className="text-lg font-bold text-gray-800 mb-3">Zone Wise Summary</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="text-left p-3 font-semibold">Zone</th>
                    <th className="text-center p-3 font-semibold">Customers</th>
                    <th className="text-right p-3 font-semibold">Qty</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(zoneSummary).map(([zone, { count, quantity }]) => (
                    <tr key={zone} className="border-t">
                      <td className="p-3 font-medium">{zone}</td>
                      <td className="text-center p-3">{count}</td>
                      <td className="text-right p-3 font-semibold">{quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            {loading ? (
              <div className="p-12 text-center">
                <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-blue-500 border-t-transparent"></div>
                <p className="mt-3 text-gray-600">Loading customers...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                {/* Desktop Table */}
                <table className="hidden md:table w-full text-sm">
                  <thead className="bg-indigo-50 text-indigo-800">
                    <tr>
                      <th className="p-3 text-left">Shop</th>
                      <th className="p-3 text-left">Owner</th>
                      <th className="p-3 text-left">Phone</th>
                      <th className="p-3 text-left">SO</th>
                      <th className="p-3 text-left">Zone</th>
                      <th className="p-3 text-right">Qty</th>
                      <th className="p-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCustomers.map((c, i) => (
                      <tr key={i} className="border-t hover:bg-gray-50 transition">
                        <td className="p-3 font-medium">{c.shop_name || "-"}</td>
                        <td className="p-3">{c.owner_name || "-"}</td>
                        <td className="p-3">{c.owner_number || "-"}</td>
                        <td className="p-3">{c.so_name || "-"}</td>
                        <td className="p-3">{c.so_zone || "-"}</td>
                        <td className="p-3 text-right font-semibold">{c.lifetime_quantity}</td>
                        <td className="p-3 text-center flex justify-center gap-2">
                          <button
                            onClick={() => openModal(c)}
                            className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-1"
                          >
                            <Eye className="w-3 h-3" /> View
                          </button>
                          {user.role === "super admin" && (
                            <>
                              <button
                                onClick={() => openEditModal(c)}
                                className="bg-amber-600 hover:bg-amber-700 text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-1"
                              >
                                <Edit2 className="w-3 h-3" /> Edit Qty
                              </button>
                              <button
                                onClick={() => deleteCustomer(c.owner_number)}
                                className="bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-1"
                              >
                                <Trash2 className="w-3 h-3" /> Delete
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Mobile Cards */}
                <div className="md:hidden p-4 space-y-3">
                  {filteredCustomers.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No customers found.</p>
                  ) : (
                    filteredCustomers.map((c, i) => (
                      <div key={i} className="bg-gray-50 rounded-lg p-4 border">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-bold text-gray-800">{c.shop_name || "Unknown Shop"}</h4>
                          <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">
                            {c.lifetime_quantity} qty
                          </span>
                        </div>
                        <p className="text-sm text-gray-600"><strong>Owner:</strong> {c.owner_name}</p>
                        <p className="text-sm text-gray-600"><strong>Phone:</strong> {c.owner_number}</p>
                        <p className="text-sm text-gray-600"><strong>SO:</strong> {c.so_name} ({c.so_zone})</p>
                        <div className="mt-3 flex flex-col gap-2">
                          <button
                            onClick={() => openModal(c)}
                            className="w-full bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-2 rounded-lg flex items-center justify-center gap-2"
                          >
                            <Eye className="w-4 h-4" /> View Transactions
                          </button>
                          {user.role === "super admin" && (
                            <>
                              <button
                                onClick={() => openEditModal(c)}
                                className="w-full bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium py-2 rounded-lg flex items-center justify-center gap-2"
                              >
                                <Edit2 className="w-4 h-4" /> Edit Quantity
                              </button>
                              <button
                                onClick={() => deleteCustomer(c.owner_number)}
                                className="w-full bg-red-600 hover:bg-red-700 text-white text-sm font-medium py-2 rounded-lg flex items-center justify-center gap-2"
                              >
                                <Trash2 className="w-4 h-4" /> Delete Customer
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Transaction Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-60">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-screen overflow-y-auto">
            <div className="p-5 border-b sticky top-0 bg-white z-10">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800">
                  Transactions: {selectedCustomer?.owner_name}
                </h2>
                <button onClick={closeModal} className="text-gray-500 hover:text-gray-700">
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="p-5 space-y-4">
              {transactions.length > 0 ? (
                transactions.map((tx, i) => (
                  <div key={i} className="border rounded-lg p-3 bg-gray-50">
                    <p className="font-semibold text-gray-800">{tx.sale_date}</p>
                    <p className="text-sm"><strong>Total Qty:</strong> {tx.purchase_quantity}</p>
                    <details className="mt-2">
                      <summary className="cursor-pointer text-blue-600 text-sm font-medium">View Products</summary>
                      <ul className="mt-1 text-sm text-gray-600 list-disc list-inside">
                        {tx.products.map((p, pi) => (
                          <li key={pi}>{p.product_name}: {p.quantity}</li>
                        ))}
                      </ul>
                    </details>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-8">No transactions found.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Quantity Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-60">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Edit Lifetime Quantity</h2>
            <p className="text-sm text-gray-600 mb-4">
              Customer: <strong>{customerToEdit?.owner_name}</strong> ({customerToEdit?.owner_number})
            </p>
            <label className="block text-sm font-medium text-gray-700 mb-2">New Quantity</label>
            <input
              type="number"
              value={editQuantity}
              onChange={(e) => setEditQuantity(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              min="0"
            />
            <div className="mt-6 flex gap-3">
              <button
                onClick={saveQuantity}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setIsEditModalOpen(false);
                  setCustomerToEdit(null);
                  setEditQuantity("");
                }}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium py-2 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SlabDashboard;