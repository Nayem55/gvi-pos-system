import { useEffect, useState } from "react";
import axios from "axios";
import { PlusCircle, X, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import AdminSidebar from "../Component/AdminSidebar";

// Reusable Input Component
const InputField = ({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  required = false,
  min,
  step,
  className = "",
}) => (
  <div className="mb-4">
    <label className="block text-sm font-medium mb-1">{label}</label>
    <input
      type={type}
      value={value}
      onChange={onChange}
      className={`w-full p-2 border rounded ${className}`}
      placeholder={placeholder}
      required={required}
      min={min}
      step={step}
    />
  </div>
);

// Reusable Select Component
const SelectField = ({
  label,
  value,
  onChange,
  options,
  loading,
  onAddNew,
  required = false,
}) => (
  <div className="mb-4">
    <div className="flex justify-between items-center mb-1">
      <label className="block text-sm font-medium">{label}</label>
      {onAddNew && (
        <button
          type="button"
          onClick={onAddNew}
          className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
        >
          <PlusCircle size={14} /> Add New
        </button>
      )}
    </div>
    {loading ? (
      <select className="w-full p-2 border rounded bg-gray-100" disabled>
        <option>Loading...</option>
      </select>
    ) : (
      <select
        value={value}
        onChange={onChange}
        className="w-full p-2 border rounded"
        required={required}
      >
        <option value="">Select {label}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    )}
  </div>
);

// Reusable Modal Component
const Modal = ({ title, onClose, children }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white p-6 rounded-lg shadow-md max-w-md w-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">{title}</h3>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
          <X size={20} />
        </button>
      </div>
      {children}
    </div>
  </div>
);

// Price List Section Component
const PriceListSection = ({ outlet, prices, onChange, onRemove }) => (
  <div className="border p-4 rounded relative">
    {onRemove && (
      <button
        onClick={() => onRemove(outlet)}
        className="absolute top-2 right-2 text-red-500 hover:text-red-700"
        title="Remove outlet"
      >
        <Trash2 size={16} />
      </button>
    )}
    <h4 className="font-medium mb-3 capitalize">{outlet}</h4>
    <div className="space-y-3">
      <InputField
        label="DP Price"
        type="number"
        value={prices?.dp}
        onChange={(e) => onChange(outlet, "dp", e.target.value)}
        placeholder="Enter DP price"
        min="0"
        step="0.01"
      />
      <InputField
        label="TP Price"
        type="number"
        value={prices?.tp}
        onChange={(e) => onChange(outlet, "tp", e.target.value)}
        placeholder="Enter TP price"
        min="0"
        step="0.01"
      />
      <InputField
        label="MRP Price"
        type="number"
        value={prices?.mrp}
        onChange={(e) => onChange(outlet, "mrp", e.target.value)}
        placeholder="Enter MRP price"
        min="0"
        step="0.01"
      />
    </div>
  </div>
);

const CreateProductPage = () => {
  const [priceLevels, setPriceLevels] = useState([]);
  console.log(priceLevels);

  const [newProduct, setNewProduct] = useState({
    name: "",
    barcode: "",
    dp: "",
    tp: "",
    mrp: "",
    category: "",
    brand: "",
    priceList: Object.fromEntries(
      priceLevels.map((outlet) => [outlet, { tp: "", dp: "", mrp: "" }])
    ),
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
  const [showNewOutletModal, setShowNewOutletModal] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [newBrand, setNewBrand] = useState("");
  const [newOutletName, setNewOutletName] = useState("");
  const [showPriceList, setShowPriceList] = useState(false);

  const fetchCategories = async () => {
    try {
      setFetchingData((prev) => ({ ...prev, categories: true }));
      const response = await axios.get("http://175.29.181.245:5000/categories");
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
      const response = await axios.get("http://175.29.181.245:5000/brands");
      setBrands(response.data);
    } catch (error) {
      console.error("Error fetching brands:", error);
      toast.error("Failed to load brands");
    } finally {
      setFetchingData((prev) => ({ ...prev, brands: false }));
    }
  };
  const fetchPriceLevels = async () => {
    try {
      const response = await axios.get(
        "http://175.29.181.245:5000/api/pricelevels"
      );
      // Extract just the 'name' values from each object
      const namesArray = response.data.map((level) => level.name);
      setPriceLevels(namesArray);
    } catch (error) {
      console.error("Error fetching price levels:", error);
      toast.error("Failed to load price levels");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchPriceLevels();
    fetchBrands();
  }, []);

  const createProductWithStocks = async () => {
    try {
      setLoading(true);
      await axios.post(
        "http://175.29.181.245:5000/create-product-with-stocks",
        {
          productData: newProduct,
        }
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
        priceList: Object.fromEntries(
          priceLevels.map((outlet) => [outlet, { tp: "", dp: "", mrp: "" }])
        ),
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
      await axios.post("http://175.29.181.245:5000/categories", {
        name: newCategory,
      });
      toast.success("Category created successfully!");
      setNewCategory("");
      setShowCategoryModal(false);
      await fetchCategories();
      setNewProduct((prev) => ({ ...prev, category: newCategory }));
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
      await axios.post("http://175.29.181.245:5000/brands", {
        name: newBrand,
      });
      toast.success("Brand created successfully!");
      setNewBrand("");
      setShowBrandModal(false);
      await fetchBrands();
      setNewProduct((prev) => ({ ...prev, brand: newBrand }));
    } catch (error) {
      console.error("Error creating brand:", error);
      toast.error(error.response?.data?.error || "Failed to create brand");
    } finally {
      setLoading(false);
    }
  };

  const handlePriceListChange = (outlet, field, value) => {
    setNewProduct((prev) => ({
      ...prev,
      priceList: {
        ...prev.priceList,
        [outlet]: {
          ...prev.priceList[outlet],
          [field]: value,
        },
      },
    }));
  };

  const handleAddOutlet = (e) => {
    e.preventDefault();
    if (!newOutletName.trim()) {
      toast.error("Outlet name cannot be empty");
      return;
    }

    const outletKey = newOutletName.toLowerCase().replace(/\s+/g, "_");

    if (outletKey in newProduct.priceList) {
      toast.error("This outlet already exists");
      return;
    }

    setNewProduct((prev) => ({
      ...prev,
      priceList: {
        ...prev.priceList,
        [outletKey]: { tp: "", dp: "", mrp: "" },
      },
    }));

    setNewOutletName("");
    setShowNewOutletModal(false);
    toast.success(`Outlet ${newOutletName} added`);
  };

  const handleRemoveOutlet = (outlet) => {
    if (priceLevels.includes(outlet)) {
      toast.error("Cannot remove default outlets");
      return;
    }

    const { [outlet]: _, ...remainingOutlets } = newProduct.priceList;
    setNewProduct((prev) => ({
      ...prev,
      priceList: remainingOutlets,
    }));
    toast.success(`Outlet ${outlet} removed`);
  };

  // Get all outlets, with default ones first
  const allOutlets = [
    ...priceLevels,
    ...Object.keys(newProduct.priceList).filter(
      (outlet) => !priceLevels.includes(outlet)
    ),
  ];

  return (
    <div className="flex">
      <AdminSidebar />
      <div className="p-4 w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Create New Product</h2>
        </div>

        {/* Category Creation Modal */}
        {showCategoryModal && (
          <Modal
            title="Create New Category"
            onClose={() => setShowCategoryModal(false)}
          >
            <form onSubmit={handleCreateCategory}>
              <InputField
                label="Category Name"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="Enter category name"
                required
              />
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
          </Modal>
        )}

        {/* Brand Creation Modal */}
        {showBrandModal && (
          <Modal
            title="Create New Brand"
            onClose={() => setShowBrandModal(false)}
          >
            <form onSubmit={handleCreateBrand}>
              <InputField
                label="Brand Name"
                value={newBrand}
                onChange={(e) => setNewBrand(e.target.value)}
                placeholder="Enter brand name"
                required
              />
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
          </Modal>
        )}

        {/* New Outlet Modal */}
        {showNewOutletModal && (
          <Modal
            title="Add New Outlet"
            onClose={() => setShowNewOutletModal(false)}
          >
            <form onSubmit={handleAddOutlet}>
              <InputField
                label="Outlet Name"
                value={newOutletName}
                onChange={(e) => setNewOutletName(e.target.value)}
                placeholder="Enter outlet name"
                required
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewOutletModal(false)}
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
                  Add Outlet
                </button>
              </div>
            </form>
          </Modal>
        )}

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField
              label="Product Name"
              value={newProduct.name}
              onChange={(e) =>
                setNewProduct({ ...newProduct, name: e.target.value })
              }
              placeholder="Enter product name"
              required
            />

            <InputField
              label="Barcode"
              value={newProduct.barcode}
              onChange={(e) =>
                setNewProduct({ ...newProduct, barcode: e.target.value })
              }
              placeholder="Enter barcode"
              required
            />

            <SelectField
              label="Category"
              value={newProduct.category}
              onChange={(e) =>
                setNewProduct({ ...newProduct, category: e.target.value })
              }
              options={categories}
              loading={fetchingData.categories}
              onAddNew={() => setShowCategoryModal(true)}
              required
            />

            <SelectField
              label="Brand"
              value={newProduct.brand}
              onChange={(e) =>
                setNewProduct({ ...newProduct, brand: e.target.value })
              }
              options={brands}
              loading={fetchingData.brands}
              onAddNew={() => setShowBrandModal(true)}
              required
            />

            <InputField
              label="DP Price"
              type="number"
              value={newProduct?.dp}
              onChange={(e) =>
                setNewProduct({ ...newProduct, dp: e.target.value })
              }
              placeholder="Enter DP price"
              required
              min="0"
              step="0.01"
            />

            <InputField
              label="TP Price"
              type="number"
              value={newProduct?.tp}
              onChange={(e) =>
                setNewProduct({ ...newProduct, tp: e.target.value })
              }
              placeholder="Enter TP price"
              required
              min="0"
              step="0.01"
            />

            <InputField
              label="MRP Price"
              type="number"
              value={newProduct?.mrp}
              onChange={(e) =>
                setNewProduct({ ...newProduct, mrp: e.target.value })
              }
              placeholder="Enter MRP price"
              required
              min="0"
              step="0.01"
            />
          </div>

          <div className="mt-4 mb-4 flex justify-between items-center">
            <button
              type="button"
              onClick={() => setShowPriceList(!showPriceList)}
              className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm"
            >
              {showPriceList ? "Hide" : "Show"} Outlet Specific Prices
            </button>
            {showPriceList && (
              <button
                type="button"
                className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm"
              >
                <PlusCircle size={14} /> Add New Price Level
              </button>
            )}
          </div>

          {showPriceList && (
            <div className="mt-4 border-t pt-4">
              <h3 className="text-lg font-semibold mb-4">
                Outlet Specific Prices
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {allOutlets.map((outlet) => (
                  <PriceListSection
                    key={outlet}
                    outlet={outlet}
                    prices={newProduct.priceList[outlet]}
                    onChange={handlePriceListChange}
                    onRemove={
                      !priceLevels.includes(outlet) ? handleRemoveOutlet : null
                    }
                  />
                ))}
              </div>
            </div>
          )}

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
