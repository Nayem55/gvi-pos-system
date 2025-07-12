import { useEffect, useState } from "react";
import axios from "axios";
import { PlusCircle } from "lucide-react";
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
    brand: "", // Added brand field
  });
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]); // State for brands
  const [fetchingData, setFetchingData] = useState({
    categories: false,
    brands: false,
  });

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
        "https://gvi-pos-server.vercel.app/brands" // You'll need to create this endpoint
      );
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
        "https://gvi-pos-server.vercel.app/create-product-with-stocks",
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

  return (
    <div className="flex">
      <AdminSidebar />
      <div className="p-4 w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Create New Product</h2>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Existing fields (name, barcode) */}
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

            {/* Category Dropdown */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Category</label>
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

            {/* New Brand Dropdown */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Brand</label>
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

            {/* Price fields (dp, tp, mrp) */}
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
