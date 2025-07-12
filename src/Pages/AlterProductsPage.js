import { useEffect, useState } from "react";
import axios from "axios";
import { Pencil, ChevronLeft, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";
import AdminSidebar from "../Component/AdminSidebar";

const AlterProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [fetchingData, setFetchingData] = useState({
    categories: false,
    brands: false,
  });

  const API_URL = "https://gvi-pos-server.vercel.app/products";

  const fetchCategories = async () => {
    try {
      setFetchingData((prev) => ({ ...prev, categories: true }));
      const response = await axios.get(
        "https://gvi-pos-server.vercel.app/categories"
      );
      setCategories(response.data);
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast.error("Failed to load categories");
    } finally {
      setFetchingData((prev) => ({ ...prev, categories: false }));
    }
  };

  const fetchBrands = async () => {
    try {
      setFetchingData((prev) => ({ ...prev, brands: true }));
      const response = await axios.get(
        "https://gvi-pos-server.vercel.app/brands"
      );
      setBrands(response.data);
    } catch (error) {
      console.error("Error fetching brands:", error);
      toast.error("Failed to load brands");
    } finally {
      setFetchingData((prev) => ({ ...prev, brands: false }));
    }
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

  useEffect(() => {
    fetchProducts(currentPage);
    fetchCategories();
    fetchBrands();
  }, [currentPage]);

  const handleInputChange = (e, id, field) => {
    const updatedProducts = products.map((product) =>
      product._id === id ? { ...product, [field]: e.target.value } : product
    );
    setProducts(updatedProducts);
  };

  const saveUpdate = async (product) => {
    setUpdating(true);
    try {
      await axios.put(`${API_URL}/${product._id}`, product);
      setEditingProduct(null);
      toast.success("Product updated successfully");
    } catch (error) {
      console.error("Error updating product:", error);
      toast.error("Product update failed");
    } finally {
      setUpdating(false);
    }
  };

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

  return (
    <div className="flex">
      <AdminSidebar />
      <div className="p-4 w-full">
        <h2 className="text-2xl font-bold mb-4">Alter Products</h2>

        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border rounded-lg shadow-md">
            <thead className="bg-gray-200 text-left">
              <tr>
                <th className="border p-2">Name</th>
                <th className="border p-2">Barcode</th>
                <th className="border p-2">Brand</th>
                <th className="border p-2">Category</th>
                <th className="border p-2">DP</th>
                <th className="border p-2">TP</th>
                <th className="border p-2">MRP</th>
                <th className="border p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product._id} className="hover:bg-gray-100">
                  <td className="border p-2">
                    {editingProduct?._id === product._id ? (
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
                    {editingProduct?._id === product._id ? (
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
                    {editingProduct?._id === product._id ? (
                      <select
                        value={product.brand || ""}
                        onChange={(e) =>
                          handleInputChange(e, product._id, "brand")
                        }
                        className="border p-1 w-full"
                      >
                        <option value="">Select Brand</option>
                        {brands.map((brand) => (
                          <option key={brand} value={brand}>
                            {brand}
                          </option>
                        ))}
                      </select>
                    ) : (
                      product.brand || "-"
                    )}
                  </td>
                  <td className="border p-2">
                    {editingProduct?._id === product._id ? (
                      <select
                        value={product.category}
                        onChange={(e) =>
                          handleInputChange(e, product._id, "category")
                        }
                        className="border p-1 w-full"
                      >
                        <option value="">Select Category</option>
                        {categories.map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                    ) : (
                      product.category || "-"
                    )}
                  </td>
                  <td className="border p-2">
                    {editingProduct?._id === product._id ? (
                      <input
                        type="number"
                        value={product.dp}
                        onChange={(e) =>
                          handleInputChange(e, product._id, "dp")
                        }
                        className="border p-1 w-full"
                      />
                    ) : (
                      `${product.dp} BDT`
                    )}
                  </td>
                  <td className="border p-2">
                    {editingProduct?._id === product._id ? (
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
                    {editingProduct?._id === product._id ? (
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
                  <td className="border p-2">
                    {editingProduct?._id === product._id ? (
                      <button
                        onClick={() => saveUpdate(product)}
                        disabled={updating}
                        className="bg-green-500 text-white px-3 py-1 rounded-md"
                      >
                        {updating ? "Saving..." : "Save"}
                      </button>
                    ) : (
                      <button
                        onClick={() => setEditingProduct(product)}
                        className="text-blue-500"
                      >
                        <Pencil size={18} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-center items-center gap-4 mt-4">
          <button
            onClick={prevPage}
            disabled={currentPage === 1}
            className={`px-4 py-2 rounded-md ${
              currentPage === 1
                ? "bg-gray-300 cursor-not-allowed"
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
                ? "bg-gray-300 cursor-not-allowed"
                : "bg-blue-500 text-white"
            }`}
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AlterProductsPage;
