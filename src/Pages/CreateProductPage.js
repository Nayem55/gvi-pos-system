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
    category: ""
  });
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);

  const fetchCategories = async () => {
    try {
      const response = await axios.get("https://gvi-pos-server.vercel.app/product-categories");
      setCategories(response.data);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const addProduct = async () => {
    try {
      setLoading(true);
      const res = await axios.post("https://gvi-pos-server.vercel.app/products", newProduct);
      toast.success("Product added successfully");
      setNewProduct({ name: "", barcode: "", dp: "", tp: "", mrp: "", category: "" });
    } catch (error) {
      console.error("Error adding product:", error);
      toast.error("Failed to add product");
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
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Product Name</label>
              <input
                type="text"
                value={newProduct.name}
                onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                className="w-full p-2 border rounded"
                placeholder="Enter product name"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Barcode</label>
              <input
                type="text"
                value={newProduct.barcode}
                onChange={(e) => setNewProduct({...newProduct, barcode: e.target.value})}
                className="w-full p-2 border rounded"
                placeholder="Enter barcode"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Category</label>
              <select
                value={newProduct.category}
                onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                className="w-full p-2 border rounded"
              >
                <option value="">Select Category</option>
                {categories.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">DP Price</label>
              <input
                type="number"
                value={newProduct.dp}
                onChange={(e) => setNewProduct({...newProduct, dp: e.target.value})}
                className="w-full p-2 border rounded"
                placeholder="Enter DP price"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">TP Price</label>
              <input
                type="number"
                value={newProduct.tp}
                onChange={(e) => setNewProduct({...newProduct, tp: e.target.value})}
                className="w-full p-2 border rounded"
                placeholder="Enter TP price"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">MRP Price</label>
              <input
                type="number"
                value={newProduct.mrp}
                onChange={(e) => setNewProduct({...newProduct, mrp: e.target.value})}
                className="w-full p-2 border rounded"
                placeholder="Enter MRP price"
              />
            </div>
          </div>
          
          <button
            onClick={addProduct}
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