import { useEffect, useState } from "react";
import axios from "axios";
import {
  Pencil,
  Trash2,
  PlusCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import AdminSidebar from "../../Component/AdminSidebar";
import toast from "react-hot-toast";

const API_URL = "https://gvi-pos-server.vercel.app/products"; // Update with your actual API endpoint

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [newProduct, setNewProduct] = useState({
    name: "",
    barcode: "",
    tp: "",
    mrp: "",
  });
  const [showModal, setShowModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch Products
  useEffect(() => {
    fetchProducts(currentPage);
  }, [currentPage]);

  // useEffect(() => {
  //   if (searchQuery !== "") {
  //     handleSearch();
  //   } else {
  //     setProducts([]);
  //   }
  // }, [searchQuery]);

  const handleSearch = async () => {
    setProducts([]);
    setLoading(true);
    try {
      const response = await axios.get(
        "https://gvi-pos-server.vercel.app/search-product",
        {
          params: {
            search: searchQuery,
            type: "name",
          },
        }
      );
      setProducts(response.data);
    } catch (error) {
      console.error("Error searching products:", error);
    }
    setLoading(false);
  };

  const fetchProducts = async (page) => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}?page=${page}`);
      setProducts(res.data.products);
      setTotalPages(res.data.totalPages);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handle Input Changes
  const handleInputChange = (e, id, field) => {
    const updatedProducts = products.map((product) =>
      product._id === id ? { ...product, [field]: e.target.value } : product
    );
    setProducts(updatedProducts);
  };

  // Save Updated Product
  const saveUpdate = async (product) => {
    setUpdating(true);
    try {
      await axios.put(`${API_URL}/${product._id}`, product);
      setEditingProduct(null);
      toast.success("Product updated successfully");
      setUpdating(false);
    } catch (error) {
      console.error("Error updating product:", error);
      toast.error("Product update failed");
      setUpdating(false);
    }
  };

  // Delete Product
  const deleteProduct = async (id) => {
    try {
      await axios.delete(`${API_URL}/${id}`);
      setProducts(products.filter((product) => product._id !== id));
    } catch (error) {
      console.error("Error deleting product:", error);
    }
  };

  // Add New Product
  const addProduct = async () => {
    try {
      const res = await axios.post(API_URL, newProduct);
      setProducts([...products, res.data]);
      setShowModal(false);
      setNewProduct({ name: "", price: "", stock: "" });
    } catch (error) {
      console.error("Error adding product:", error);
    }
  };

  // Pagination handlers
  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  if (loading) return <p className="text-center py-6">Loading products...</p>;

  return (
    <div className="flex">
      {/* Sidebar */}
      <AdminSidebar />

      {/* Main Content */}
      <div className="p-4 w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Manage Products</h2>
          <div className="mb-4">
            <input
              type="text"
              id="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border border-gray-300 rounded p-2 w-[400px] border-r-0"
              placeholder="Search products..."
            />
            <button onClick={handleSearch} className="bg-black text-white p-2 border border-black rounded border-l-0">Search</button>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-500 text-white px-4 py-2 rounded-md flex items-center gap-2"
          >
            <PlusCircle size={18} /> Add Product
          </button>
        </div>

        {/* Product Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border rounded-lg shadow-md">
            <thead className="bg-gray-200 text-left">
              <tr>
                <th className="border p-2">Name</th>
                <th className="border p-2">Barcode</th>
                <th className="border p-2">Price (TP)</th>
                <th className="border p-2">Price (MRP)</th>
                <th className="border p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product._id} className="hover:bg-gray-100">
                  <td className="border p-2">
                    {editingProduct === product._id ? (
                      <input
                        type="text"
                        value={product.name}
                        onChange={(e) =>
                          handleInputChange(e, product._id, "name")
                        }
                        className="border p-1 w-full"
                      />
                    ) : (
                      product.name
                    )}
                  </td>
                  <td className="border p-2">
                    {editingProduct === product._id ? (
                      <input
                        type="text"
                        value={product.barcode}
                        onChange={(e) =>
                          handleInputChange(e, product._id, "barcode")
                        }
                        className="border p-1 w-full"
                      />
                    ) : (
                      product.barcode
                    )}
                  </td>
                  <td className="border p-2">
                    {editingProduct === product._id ? (
                      <input
                        type="number"
                        value={product.tp}
                        onChange={(e) =>
                          handleInputChange(e, product._id, "tp")
                        }
                        className="border p-1 w-full"
                      />
                    ) : (
                      `${product.tp} BDT`
                    )}
                  </td>
                  <td className="border p-2">
                    {editingProduct === product._id ? (
                      <input
                        type="number"
                        value={product.mrp}
                        onChange={(e) =>
                          handleInputChange(e, product._id, "mrp")
                        }
                        className="border p-1 w-full"
                      />
                    ) : (
                      `${product.mrp} BDT`
                    )}
                  </td>

                  <td className="border p-2 flex gap-2">
                    {editingProduct === product._id ? (
                      <button
                        onClick={() => saveUpdate(product)}
                        disabled={updating}
                        className="bg-green-500 text-white px-3 py-1 rounded-md"
                      >
                        {updating ? (
                          <svg
                            className="animate-spin h-5 w-5 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                            ></path>
                          </svg>
                        ) : (
                          "Save"
                        )}
                      </button>
                    ) : (
                      <button
                        onClick={() => setEditingProduct(product._id)}
                        className="text-blue-500"
                      >
                        <Pencil size={18} />
                      </button>
                    )}
                    <button
                      onClick={() => deleteProduct(product._id)}
                      className="text-red-500"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="flex justify-center items-center gap-4 mt-4">
          <button
            onClick={prevPage}
            disabled={currentPage === 1}
            className={`px-4 py-2 rounded-md ${
              currentPage === 1
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-blue-500 text-white"
            }`}
          >
            <ChevronLeft size={20} />
          </button>
          <span className="text-lg font-semibold">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={nextPage}
            disabled={currentPage === totalPages}
            className={`px-4 py-2 rounded-md ${
              currentPage === totalPages
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-blue-500 text-white"
            }`}
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Add Product Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4">
            <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
              <h3 className="text-xl font-bold mb-4">Add New Product</h3>
              <input
                type="text"
                placeholder="Product Name"
                className="w-full border p-2 mb-2"
                value={newProduct.name}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, name: e.target.value })
                }
              />
              <input
                type="text"
                placeholder="Product barcode"
                className="w-full border p-2 mb-2"
                value={newProduct.barcode}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, barcode: e.target.value })
                }
              />
              <input
                type="number"
                placeholder="Price(TP)"
                className="w-full border p-2 mb-2"
                value={newProduct.tp}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, tp: e.target.value })
                }
              />
              <input
                type="number"
                placeholder="Price(MRP)"
                className="w-full border p-2 mb-2"
                value={newProduct.mrp}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, mrp: e.target.value })
                }
              />
              {/* <input
                type="number"
                placeholder="Stock"
                className="w-full border p-2 mb-2"
                value={newProduct.stock}
                onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
              /> */}
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowModal(false)}
                  className="bg-gray-500 text-white px-4 py-2 rounded-md"
                >
                  Cancel
                </button>
                <button
                  onClick={addProduct}
                  className="bg-blue-500 text-white px-4 py-2 rounded-md"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminProducts;
