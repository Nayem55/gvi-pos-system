import { useEffect, useState } from "react";
import axios from "axios";
import { PlusCircle, X } from "lucide-react";
import toast from "react-hot-toast";
import AdminSidebar from "../Component/AdminSidebar";

const CreateProductPage = () => {
  const [newProduct, setNewProduct] = useState({
    name: "",
    barcode: "",
    dp: "",
    tp: "",
    mrp: "",
    category: "",
    brand: "",
  });
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [fetchingData, setFetchingData] = useState({
    categories: false,
    brands: false,
  });
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showBrandModal, setShowBrandModal] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [newBrand, setNewBrand] = useState("");

  const fetchCategories = async () => {
    try {
      setFetchingData((prev) => ({ ...prev, categories: true }));
      const response = await axios.get("http://192.168.0.30:5000/categories");
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
      const response = await axios.get("http://192.168.0.30:5000/brands");
      setBrands(response.data);
    } catch (error) {
      console.error("Error fetching brands:", error);
      toast.error("Failed to load brands");
    } finally {
      setFetchingData((prev) => ({ ...prev, brands: false }));
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchBrands();
  }, []);

  const createProductWithStocks = async () => {
    try {
      setLoading(true);
      const response = await axios.post(
        "http://192.168.0.30:5000/create-product-with-stocks",
        { productData: newProduct }
      );

      toast.success("Product created with outlet stocks initialized!");
      setNewProduct({
        name: "",
        barcode: "",
        dp: "",
        tp: "",
        mrp: "",
        category: "",
        brand: "",
      });
    } catch (error) {
      console.error("Error creating product:", error);
      toast.error(error.response?.data?.message || "Failed to create product");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!newCategory.trim()) {
      toast.error("Category name cannot be empty");
      return;
    }

    try {
      setLoading(true);
      await axios.post("http://192.168.0.30:5000/categories", {
        name: newCategory,
      });
      toast.success("Category created successfully!");
      setNewCategory("");
      setShowCategoryModal(false);
      await fetchCategories();
      setNewProduct(prev => ({ ...prev, category: newCategory }));
    } catch (error) {
      console.error("Error creating category:", error);
      toast.error(error.response?.data?.error || "Failed to create category");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBrand = async (e) => {
    e.preventDefault();
    if (!newBrand.trim()) {
      toast.error("Brand name cannot be empty");
      return;
    }

    try {
      setLoading(true);
      await axios.post("http://192.168.0.30:5000/brands", {
        name: newBrand,
      });
      toast.success("Brand created successfully!");
      setNewBrand("");
      setShowBrandModal(false);
      await fetchBrands();
      setNewProduct(prev => ({ ...prev, brand: newBrand }));
    } catch (error) {
      console.error("Error creating brand:", error);
      toast.error(error.response?.data?.error || "Failed to create brand");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex">
      <AdminSidebar />
      <div className="p-4 w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Create New Product</h2>
        </div>

        {/* Category Creation Modal */}
        {showCategoryModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-md max-w-md w-full">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Create New Category</h3>
                <button
                  onClick={() => setShowCategoryModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleCreateCategory}>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">
                    Category Name
                  </label>
                  <input
                    type="text"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full p-2 border rounded"
                    placeholder="Enter category name"
                    required
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCategoryModal(false)}
                    className="px-4 py-2 border rounded"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded flex items-center gap-2"
                  >
                    <PlusCircle size={18} />
                    {loading ? "Creating..." : "Create"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Brand Creation Modal */}
        {showBrandModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-md max-w-md w-full">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Create New Brand</h3>
                <button
                  onClick={() => setShowBrandModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleCreateBrand}>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">
                    Brand Name
                  </label>
                  <input
                    type="text"
                    value={newBrand}
                    onChange={(e) => setNewBrand(e.target.value)}
                    className="w-full p-2 border rounded"
                    placeholder="Enter brand name"
                    required
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowBrandModal(false)}
                    className="px-4 py-2 border rounded"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded flex items-center gap-2"
                  >
                    <PlusCircle size={18} />
                    {loading ? "Creating..." : "Create"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">
                Product Name
              </label>
              <input
                type="text"
                value={newProduct.name}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, name: e.target.value })
                }
                className="w-full p-2 border rounded"
                placeholder="Enter product name"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Barcode</label>
              <input
                type="text"
                value={newProduct.barcode}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, barcode: e.target.value })
                }
                className="w-full p-2 border rounded"
                placeholder="Enter barcode"
                required
              />
            </div>

            <div className="mb-4">
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium">Category</label>
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(true)}
                  className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  <PlusCircle size={14} /> Add New
                </button>
              </div>
              {fetchingData.categories ? (
                <select
                  className="w-full p-2 border rounded bg-gray-100"
                  disabled
                >
                  <option>Loading categories...</option>
                </select>
              ) : (
                <select
                  value={newProduct.category}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, category: e.target.value })
                  }
                  className="w-full p-2 border rounded"
                  required
                >
                  <option value="">Select Category</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="mb-4">
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium">Brand</label>
                <button
                  type="button"
                  onClick={() => setShowBrandModal(true)}
                  className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  <PlusCircle size={14} /> Add New
                </button>
              </div>
              {fetchingData.brands ? (
                <select
                  className="w-full p-2 border rounded bg-gray-100"
                  disabled
                >
                  <option>Loading brands...</option>
                </select>
              ) : (
                <select
                  value={newProduct.brand}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, brand: e.target.value })
                  }
                  className="w-full p-2 border rounded"
                  required
                >
                  <option value="">Select Brand</option>
                  {brands.map((brand) => (
                    <option key={brand} value={brand}>
                      {brand}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">DP Price</label>
              <input
                type="number"
                value={newProduct.dp}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, dp: e.target.value })
                }
                className="w-full p-2 border rounded"
                placeholder="Enter DP price"
                required
                min="0"
                step="0.01"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">TP Price</label>
              <input
                type="number"
                value={newProduct.tp}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, tp: e.target.value })
                }
                className="w-full p-2 border rounded"
                placeholder="Enter TP price"
                required
                min="0"
                step="0.01"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">
                MRP Price
              </label>
              <input
                type="number"
                value={newProduct.mrp}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, mrp: e.target.value })
                }
                className="w-full p-2 border rounded"
                placeholder="Enter MRP price"
                required
                min="0"
                step="0.01"
              />
            </div>
          </div>

          <button
            onClick={createProductWithStocks}
            disabled={loading}
            className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-md flex items-center gap-2"
          >
            <PlusCircle size={18} />
            {loading ? "Creating..." : "Create Product"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateProductPage;