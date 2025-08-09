import { useEffect, useState } from "react";
import axios from "axios";
import {
  Pencil,
  ChevronLeft,
  ChevronRight,
  Filter,
  SaveAll,
  X,
  Check,
  Loader2,
  Search,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import toast from "react-hot-toast";
import AdminSidebar from "../Component/AdminSidebar";

const AlterProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [bulkUpdateMode, setBulkUpdateMode] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [bulkUpdateFields, setBulkUpdateFields] = useState({
    dp: "",
    tp: "",
    mrp: "",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedPriceLists, setExpandedPriceLists] = useState({});

  const API_URL = "http://175.29.181.245:5000/products";

  const fetchCategories = async () => {
    try {
      const response = await axios.get("http://175.29.181.245:5000/categories");
      setCategories(response.data);
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast.error("Failed to load categories");
    }
  };

  const fetchBrands = async () => {
    try {
      const response = await axios.get("http://175.29.181.245:5000/brands");
      setBrands(response.data);
    } catch (error) {
      console.error("Error fetching brands:", error);
      toast.error("Failed to load brands");
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`http://175.29.181.245:5000/all-products`);
      setProducts(res.data);
      setFilteredProducts(res.data);

      // Initialize expanded price lists state
      const initialExpandedState = {};
      res.data.forEach((product) => {
        initialExpandedState[product._id] = false;
      });
      setExpandedPriceLists(initialExpandedState);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchBrands();
  }, []);

  const handleInputChange = (e, id, field) => {
    const updatedProducts = products.map((product) =>
      product._id === id ? { ...product, [field]: e.target.value } : product
    );
    setProducts(updatedProducts);

    if (bulkUpdateMode && selectedCategory) {
      const updatedFiltered = filteredProducts.map((product) =>
        product._id === id ? { ...product, [field]: e.target.value } : product
      );
      setFilteredProducts(updatedFiltered);
    }
  };

  const handlePriceListChange = (productId, outlet, field, value) => {
    const updatedProducts = products.map((product) => {
      if (product._id === productId) {
        return {
          ...product,
          priceList: {
            ...product.priceList,
            [outlet]: {
              ...product.priceList?.[outlet],
              [field]: value,
            },
          },
        };
      }
      return product;
    });
    setProducts(updatedProducts);

    if (bulkUpdateMode && selectedCategory) {
      const updatedFiltered = filteredProducts.map((product) => {
        if (product._id === productId) {
          return {
            ...product,
            priceList: {
              ...product.priceList,
              [outlet]: {
                ...product.priceList?.[outlet],
                [field]: value,
              },
            },
          };
        }
        return product;
      });
      setFilteredProducts(updatedFiltered);
    }
  };

  const handleBulkFieldChange = (e, field) => {
    setBulkUpdateFields({
      ...bulkUpdateFields,
      [field]: e.target.value,
    });
  };

  const saveUpdate = async (product) => {
    setUpdating(true);
    try {
      await axios.put(`${API_URL}/${product._id}`, product);
      setEditingProduct(null);
      toast.success("Product updated successfully");
      fetchProducts();
    } catch (error) {
      console.error("Error updating product:", error);
      toast.error("Product update failed");
    } finally {
      setUpdating(false);
    }
  };

  const applyBulkUpdate = async () => {
    if (!selectedCategory) {
      toast.error("Please select a category first");
      return;
    }

    const updateFields = Object.fromEntries(
      Object.entries(bulkUpdateFields).filter(([_, value]) => value !== "")
    );

    if (Object.keys(updateFields).length === 0) {
      toast.error("Please specify at least one field to update");
      return;
    }

    setUpdating(true);
    try {
      const response = await axios.put(
        `http://175.29.181.245:5000/category-bulk-update`,
        {
          category: selectedCategory,
          updateFields,
        }
      );

      toast.success(
        `Updated ${response.data.modifiedCount} products in ${selectedCategory}`
      );
      resetBulkUpdate();
      fetchProducts();
    } catch (error) {
      console.error("Error in bulk update:", error);
      toast.error("Bulk update failed");
    } finally {
      setUpdating(false);
    }
  };

  const filterByCategory = (category) => {
    setSelectedCategory(category);
    if (category) {
      const filtered = products.filter(
        (p) =>
          p.category === category &&
          p.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredProducts(filtered);
    } else {
      const filtered = products.filter((p) =>
        p.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredProducts(filtered);
    }
  };

  const resetBulkUpdate = () => {
    setBulkUpdateMode(false);
    setSelectedCategory("");
    setBulkUpdateFields({ dp: "", tp: "", mrp: "" });
    setFilteredProducts(products);
  };

  const handleSearch = (e) => {
    const term = e.target.value;
    setSearchTerm(term);

    if (bulkUpdateMode && selectedCategory) {
      const filtered = products.filter(
        (p) =>
          p.category === selectedCategory &&
          p.name?.toLowerCase().includes(term.toLowerCase())
      );
      setFilteredProducts(filtered);
    } else {
      const filtered = products.filter((p) =>
        p.name?.toLowerCase().includes(term.toLowerCase())
      );
      setFilteredProducts(filtered);
    }
  };

  const togglePriceList = (productId) => {
    setExpandedPriceLists((prev) => ({
      ...prev,
      [productId]: !prev[productId],
    }));
  };

  const displayProducts = bulkUpdateMode
    ? filteredProducts
    : products.filter((p) =>
        p.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );

  return (
    <div className="flex h-screen bg-gray-50">
      <AdminSidebar />

      <div className="flex-1 overflow-auto">
        <div className="p-6">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                Product Management
              </h1>
              <p className="text-sm text-gray-500">
                {bulkUpdateMode
                  ? `Bulk Update Mode - ${
                      selectedCategory || "Select a category"
                    }`
                  : "Manage your product inventory"}
              </p>
            </div>

            <div className="flex items-center gap-3 mt-4 md:mt-0">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={handleSearch}
                  className="pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full md:w-64"
                />
                <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>

              <button
                onClick={() =>
                  bulkUpdateMode ? resetBulkUpdate() : setBulkUpdateMode(true)
                }
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  bulkUpdateMode
                    ? "bg-red-100 text-red-600 hover:bg-red-200"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                {bulkUpdateMode ? (
                  <>
                    <X size={18} /> Cancel
                  </>
                ) : (
                  <>
                    <SaveAll size={18} /> Bulk Update
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Bulk Update Panel */}
          {bulkUpdateMode && (
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 mb-6">
              <h3 className="font-medium text-gray-700 mb-4 flex items-center gap-2">
                <Filter size={18} className="text-blue-500" />
                Bulk Update Products by Category
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => filterByCategory(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Category</option>
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dealer Price (DP)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-gray-500">
                      ৳
                    </span>
                    <input
                      type="number"
                      placeholder="Current value"
                      value={bulkUpdateFields.dp}
                      onChange={(e) => handleBulkFieldChange(e, "dp")}
                      className="w-full pl-8 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Trade Price (TP)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-gray-500">
                      ৳
                    </span>
                    <input
                      type="number"
                      placeholder="Current value"
                      value={bulkUpdateFields.tp}
                      onChange={(e) => handleBulkFieldChange(e, "tp")}
                      className="w-full pl-8 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Retail Price (MRP)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-gray-500">
                      ৳
                    </span>
                    <input
                      type="number"
                      placeholder="Current value"
                      value={bulkUpdateFields.mrp}
                      onChange={(e) => handleBulkFieldChange(e, "mrp")}
                      className="w-full pl-8 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="flex items-end">
                  <button
                    onClick={applyBulkUpdate}
                    disabled={updating || !selectedCategory}
                    className="flex items-center justify-center gap-2 w-full h-[42px] bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    {updating ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <Check size={18} />
                    )}
                    Apply
                  </button>
                </div>
              </div>

              {selectedCategory && (
                <div className="flex justify-between items-center bg-blue-50 px-4 py-2 rounded-lg">
                  <span className="text-sm font-medium text-blue-800">
                    {filteredProducts.length} products in{" "}
                    <span className="font-semibold">{selectedCategory}</span>{" "}
                    will be updated
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Products Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 size={32} className="animate-spin text-blue-500" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 table-fixed">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-8"
                      >
                        {/* Empty for expand/collapse button */}
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Product
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Barcode
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Brand
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Category
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        DP
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        TP
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        MRP
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {displayProducts.length > 0 ? (
                      displayProducts.map((product) => (
                        <>
                          <tr
                            key={product._id}
                            className="hover:bg-gray-50 transition-colors"
                          >
                            <td className="px-2 py-4 text-center">
                              {product.priceList &&
                                Object.keys(product.priceList).length > 0 && (
                                  <button
                                    onClick={() => togglePriceList(product._id)}
                                    className="text-gray-500 hover:text-gray-700"
                                  >
                                    {expandedPriceLists[product._id] ? (
                                      <ChevronUp size={18} />
                                    ) : (
                                      <ChevronDown size={18} />
                                    )}
                                  </button>
                                )}
                            </td>
                            <td className="px-6 py-4">
                              {editingProduct?._id === product._id ? (
                                <input
                                  type="text"
                                  value={product.name}
                                  onChange={(e) =>
                                    handleInputChange(e, product._id, "name")
                                  }
                                  className="w-full px-2 py-1 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                              ) : (
                                <div className="text-sm font-medium text-gray-900 break-words min-w-[200px] max-w-[300px]">
                                  {product.name}
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {editingProduct?._id === product._id ? (
                                <input
                                  type="text"
                                  value={product.barcode}
                                  onChange={(e) =>
                                    handleInputChange(e, product._id, "barcode")
                                  }
                                  className="w-full px-2 py-1 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                              ) : (
                                <div className="text-sm text-gray-500 font-mono">
                                  {product.barcode}
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {editingProduct?._id === product._id ? (
                                <select
                                  value={product.brand || ""}
                                  onChange={(e) =>
                                    handleInputChange(e, product._id, "brand")
                                  }
                                  className="w-full px-2 py-1 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                  <option value="">Select Brand</option>
                                  {brands.map((brand) => (
                                    <option key={brand} value={brand}>
                                      {brand}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <div className="text-sm text-gray-500">
                                  {product.brand || "-"}
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {editingProduct?._id === product._id ? (
                                <select
                                  value={product.category}
                                  onChange={(e) =>
                                    handleInputChange(
                                      e,
                                      product._id,
                                      "category"
                                    )
                                  }
                                  className="w-full px-2 py-1 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                  <option value="">Select Category</option>
                                  {categories.map((category) => (
                                    <option key={category} value={category}>
                                      {category}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                  {product.category || "-"}
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {editingProduct?._id === product._id ? (
                                <div className="relative">
                                  <span className="absolute left-2 top-1.5 text-gray-500">
                                    ৳
                                  </span>
                                  <input
                                    type="number"
                                    value={product.dp}
                                    onChange={(e) =>
                                      handleInputChange(e, product._id, "dp")
                                    }
                                    className="pl-6 pr-2 py-1 w-24 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  />
                                </div>
                              ) : (
                                <div className="text-sm text-gray-900">
                                  ৳{product.dp}
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {editingProduct?._id === product._id ? (
                                <div className="relative">
                                  <span className="absolute left-2 top-1.5 text-gray-500">
                                    ৳
                                  </span>
                                  <input
                                    type="number"
                                    value={product.tp}
                                    onChange={(e) =>
                                      handleInputChange(e, product._id, "tp")
                                    }
                                    className="pl-6 pr-2 py-1 w-24 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  />
                                </div>
                              ) : (
                                <div className="text-sm text-gray-900">
                                  ৳{product.tp}
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {editingProduct?._id === product._id ? (
                                <div className="relative">
                                  <span className="absolute left-2 top-1.5 text-gray-500">
                                    ৳
                                  </span>
                                  <input
                                    type="number"
                                    value={product.mrp}
                                    onChange={(e) =>
                                      handleInputChange(e, product._id, "mrp")
                                    }
                                    className="pl-6 pr-2 py-1 w-24 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  />
                                </div>
                              ) : (
                                <div className="text-sm font-semibold text-gray-900">
                                  ৳{product.mrp}
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              {editingProduct?._id === product._id ? (
                                <div className="flex justify-end gap-2">
                                  <button
                                    onClick={() => setEditingProduct(null)}
                                    className="text-gray-500 hover:text-gray-700"
                                  >
                                    <X size={18} />
                                  </button>
                                  <button
                                    onClick={() => saveUpdate(product)}
                                    disabled={updating}
                                    className="text-green-600 hover:text-green-800 disabled:text-gray-400"
                                  >
                                    {updating ? (
                                      <Loader2
                                        size={18}
                                        className="animate-spin"
                                      />
                                    ) : (
                                      <Check size={18} />
                                    )}
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setEditingProduct(product)}
                                  className="text-blue-600 hover:text-blue-900 disabled:text-gray-400"
                                  disabled={bulkUpdateMode}
                                  title={
                                    bulkUpdateMode
                                      ? "Finish bulk update first"
                                      : "Edit product"
                                  }
                                >
                                  <Pencil size={18} />
                                </button>
                              )}
                            </td>
                          </tr>

                          {/* Price List Row */}
                          {expandedPriceLists[product._id] &&
                            product.priceList && (
                              <tr className="bg-gray-50">
                                <td colSpan="9" className="px-6 py-4">
                                  <div className="ml-8">
                                    <h4 className="font-medium text-gray-700 mb-2">
                                      Outlet Specific Prices
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                      {Object.entries(product.priceList).map(
                                        ([outlet, prices]) => (
                                          <div
                                            key={outlet}
                                            className="border p-3 rounded bg-white"
                                          >
                                            <h5 className="font-medium capitalize mb-2">
                                              {outlet}
                                            </h5>
                                            <div className="space-y-2">
                                              <div>
                                                <label className="text-xs text-gray-500">
                                                  DP Price
                                                </label>
                                                {editingProduct?._id ===
                                                product._id ? (
                                                  <input
                                                    type="number"
                                                    value={prices.dp || ""}
                                                    onChange={(e) =>
                                                      handlePriceListChange(
                                                        product._id,
                                                        outlet,
                                                        "dp",
                                                        e.target.value
                                                      )
                                                    }
                                                    className="w-full px-2 py-1 border rounded text-sm"
                                                  />
                                                ) : (
                                                  <div className="text-sm">
                                                    ৳{prices.dp || "-"}
                                                  </div>
                                                )}
                                              </div>
                                              <div>
                                                <label className="text-xs text-gray-500">
                                                  TP Price
                                                </label>
                                                {editingProduct?._id ===
                                                product._id ? (
                                                  <input
                                                    type="number"
                                                    value={prices.tp || ""}
                                                    onChange={(e) =>
                                                      handlePriceListChange(
                                                        product._id,
                                                        outlet,
                                                        "tp",
                                                        e.target.value
                                                      )
                                                    }
                                                    className="w-full px-2 py-1 border rounded text-sm"
                                                  />
                                                ) : (
                                                  <div className="text-sm">
                                                    ৳{prices.tp || "-"}
                                                  </div>
                                                )}
                                              </div>
                                              <div>
                                                <label className="text-xs text-gray-500">
                                                  MRP Price
                                                </label>
                                                {editingProduct?._id ===
                                                product._id ? (
                                                  <input
                                                    type="number"
                                                    value={prices.mrp || ""}
                                                    onChange={(e) =>
                                                      handlePriceListChange(
                                                        product._id,
                                                        outlet,
                                                        "mrp",
                                                        e.target.value
                                                      )
                                                    }
                                                    className="w-full px-2 py-1 border rounded text-sm"
                                                  />
                                                ) : (
                                                  <div className="text-sm font-medium">
                                                    ৳{prices.mrp || "-"}
                                                  </div>
                                                )}
                                              </div>
                                            </div>
                                          </div>
                                        )
                                      )}
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                        </>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan="9"
                          className="px-6 py-4 text-center text-sm text-gray-500"
                        >
                          No products found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlterProductsPage;
