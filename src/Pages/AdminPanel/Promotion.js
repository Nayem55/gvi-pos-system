import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import dayjs from "dayjs";
import AdminSidebar from "../../Component/AdminSidebar";

export default function PromotionalPage() {
  const [products, setProducts] = useState([]);
  const [selectedPromotions, setSelectedPromotions] = useState({});
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const delay = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(delay);
  }, [search]);

  useEffect(() => {
    fetchProducts();
  }, [debouncedSearch, currentPage]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      let productsData = [];

      if (debouncedSearch.trim()) {
        const response = await axios.get(
          `https://gvi-pos-server.vercel.app/search-product?search=${debouncedSearch}`
        );
        productsData = response.data;
        setTotalPages(1);
      } else {
        const res = await axios.get(
          `https://gvi-pos-server.vercel.app/products?page=${currentPage}`
        );
        productsData = res.data.products;
        setTotalPages(res.data.totalPages);
      }

      setProducts(productsData);

      const initialPromotions = {};
      productsData.forEach((product) => {
        // Parse existing promotion if available
        let promoValue = null;
        let startDate = null;
        let endDate = null;
        
        if (product.promoPlan && product.promoPlan !== "None") {
          const [paid, free] = product.promoPlan.split("+").map(Number);
          promoValue = { paid, total: paid + free };
        }
        
        if (product.promoStartDate) {
          startDate = dayjs(product.promoStartDate).format("YYYY-MM-DD");
        }
        
        if (product.promoEndDate) {
          endDate = dayjs(product.promoEndDate).format("YYYY-MM-DD");
        }

        initialPromotions[product._id] = {
          promo: promoValue,
          paid: promoValue?.paid || 0,
          free: promoValue ? promoValue.total - promoValue.paid : 0,
          startDate,
          endDate
        };
      });

      setSelectedPromotions(initialPromotions);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePromotionChange = (productId, field, value) => {
    setSelectedPromotions((prev) => {
      const current = prev[productId] || {};
      
      if (field === 'paid' || field === 'free') {
        const paid = field === 'paid' ? parseInt(value) || 0 : current.paid;
        const free = field === 'free' ? parseInt(value) || 0 : current.free;
        
        return {
          ...prev,
          [productId]: {
            ...current,
            [field]: parseInt(value) || 0,
            promo: paid > 0 || free > 0 ? { paid, total: paid + free } : null
          }
        };
      }
      
      return {
        ...prev,
        [productId]: {
          ...current,
          [field]: value
        }
      };
    });
  };

  const calculatePromotionalPrice = (original, promo) => {
    if (!promo) return original;
    return ((original * promo.paid) / promo.total).toFixed(2);
  };

  const savePromotion = async (product) => {
    const promotion = selectedPromotions[product._id];
    const promo = promotion?.promo;
    
    const updatedProduct = {
      ...product,
      promoPlan: promo ? `${promo.paid}+${promo.total - promo.paid}` : "None",
      promoDP: calculatePromotionalPrice(product.dp, promo),
      promoTP: calculatePromotionalPrice(product.tp, promo),
      promoStartDate: promotion?.startDate || null,
      promoEndDate: promotion?.endDate || null
    };

    try {
      await axios.put(
        `https://gvi-pos-server.vercel.app/products/${product._id}`,
        updatedProduct
      );
      toast.success("Promotion saved successfully!");
      fetchProducts();
    } catch (error) {
      console.error("Error saving promotion:", error);
      toast.error("Failed to save promotion");
    }
  };

  const removePromotion = async (product) => {
    const updatedProduct = {
      ...product,
      promoPlan: "None",
      promoDP: product.dp,
      promoTP: product.tp,
      promoStartDate: null,
      promoEndDate: null
    };

    try {
      await axios.put(
        `https://gvi-pos-server.vercel.app/products/${product._id}`,
        updatedProduct
      );
      toast.success("Promotion removed successfully!");
      
      setSelectedPromotions((prev) => ({
        ...prev,
        [product._id]: {
          promo: null,
          paid: 0,
          free: 0,
          startDate: null,
          endDate: null
        }
      }));
      
      fetchProducts();
    } catch (error) {
      console.error("Error removing promotion:", error);
      toast.error("Failed to remove promotion");
    }
  };

  return (
    <div className="flex">
      <AdminSidebar />
      <div className="p-4 w-full max-w-7xl mx-auto">
        <h2 className="text-2xl font-bold mb-4">Promotional Management</h2>

        {/* Search bar */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search by product name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-gray-300 p-2 rounded w-full max-w-md"
          />
        </div>

        {/* Product Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 border">Product</th>
                <th className="p-2 border">DP</th>
                <th className="p-2 border">TP</th>
                <th className="p-2 border">Promo Qty (Paid+Free)</th>
                <th className="p-2 border">Promo DP</th>
                <th className="p-2 border">Promo TP</th>
                <th className="p-2 border">Validity</th>
                <th className="p-2 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="text-center py-4">
                    <div className="flex justify-center items-center space-x-2">
                      <div className="w-6 h-6 border-4 border-blue-500 border-dashed rounded-full animate-spin"></div>
                      <span>Loading products...</span>
                    </div>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-4 text-gray-500">
                    No products found
                  </td>
                </tr>
              ) : (
                products.map((product) => {
                  const promotion = selectedPromotions[product._id] || {};
                  const promo = promotion.promo;
                  
                  return (
                    <tr key={product._id} className="border-b hover:bg-gray-50">
                      <td className="p-2">{product.name}</td>
                      <td className="p-2">{product.dp}</td>
                      <td className="p-2">{product.tp}</td>
                      <td className="p-2">
                        <div className="flex items-center justify-center space-x-1">
                          <input
                            type="number"
                            min="0"
                            value={promotion.paid || 0}
                            onChange={(e) => handlePromotionChange(product._id, 'paid', e.target.value)}
                            className="w-10 text-center border rounded"
                            placeholder="Paid"
                          />
                          <span>+</span>
                          <input
                            type="number"
                            min="0"
                            value={promotion.free || 0}
                            onChange={(e) => handlePromotionChange(product._id, 'free', e.target.value)}
                            className="w-10 text-center border rounded"
                            placeholder="Free"
                          />
                        </div>
                      </td>
                      <td className="p-2">
                        {calculatePromotionalPrice(product.dp, promo)}
                      </td>
                      <td className="p-2">
                        {calculatePromotionalPrice(product.tp, promo)}
                      </td>
                      <td className="p-2">
                        <div className="flex flex-col space-y-1">
                          <input
                            type="date"
                            value={promotion.startDate || ''}
                            onChange={(e) => handlePromotionChange(product._id, 'startDate', e.target.value)}
                            className="p-1 border rounded text-sm"
                            placeholder="Start Date"
                          />
                          <input
                            type="date"
                            value={promotion.endDate || ''}
                            onChange={(e) => handlePromotionChange(product._id, 'endDate', e.target.value)}
                            className="p-1 border rounded text-sm"
                            placeholder="End Date"
                          />
                        </div>
                      </td>
                      <td className="p-2">
                        <div className="flex space-x-1">
                          <button
                            onClick={() => savePromotion(product)}
                            disabled={loading}
                            className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => removePromotion(product)}
                            disabled={loading}
                            className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                          >
                            Remove
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!debouncedSearch && !loading && totalPages > 1 && (
          <div className="mt-4 flex justify-center items-center space-x-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="bg-gray-800 text-white px-3 py-1 rounded disabled:opacity-50"
            >
              Previous
            </button>
            <span className="px-3 py-1 bg-gray-100 rounded">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
              className="bg-gray-800 text-white px-3 py-1 rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

