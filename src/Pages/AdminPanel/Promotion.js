import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import dayjs from "dayjs";
import AdminSidebar from "../../Component/AdminSidebar";
import { FaSave, FaTrash } from "react-icons/fa";

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
        let type = "quantity";
        let promo = null;
        let paid = 0;
        let free = 0;
        let percentage = 0;

        if (product.promoType === "percentage") {
          type = "percentage";
          percentage = product.promoPercentage || 0;
        } else if (product.promoPlan && product.promoPlan !== "None") {
          const [p, f] = product.promoPlan.split("+").map(Number);
          promo = { paid: p, total: p + f };
          paid = p;
          free = f;
        }

        initialPromotions[product._id] = {
          type,
          promo,
          paid,
          free,
          percentage,
          startDate: product.promoStartDate
            ? dayjs(product.promoStartDate).format("YYYY-MM-DD")
            : "",
          endDate: product.promoEndDate
            ? dayjs(product.promoEndDate).format("YYYY-MM-DD")
            : "",
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
      let updated = { ...current };

      if (field === "type") {
        updated = {
          ...updated,
          type: value,
          paid: 0,
          free: 0,
          percentage: 0,
          promo: null,
        };
      } else if (field === "paid" || field === "free") {
        const numValue = parseInt(value) || 0;
        updated = {
          ...updated,
          [field]: numValue,
        };

        // Only update promo if type is quantity
        if (updated.type === "quantity") {
          const paid = field === "paid" ? numValue : updated.paid;
          const free = field === "free" ? numValue : updated.free;
          updated.promo = paid > 0 || free > 0 ? { paid, free, total: paid + free } : null;
        }
      } else if (field === "percentage") {
        updated = {
          ...updated,
          percentage: parseFloat(value) || 0,
        };
      } else {
        updated[field] = value;
      }

      return {
        ...prev,
        [productId]: updated,
      };
    });
  };

  const calculatePromotionalPrice = (original, promotion) => {
    if (!promotion) return original;
    
    if (promotion.type === "percentage") {
      return (original * (1 - (promotion.percentage || 0) / 100)).toFixed(2);
    }
    
    if (promotion.type === "quantity" && promotion.promo) {
      if (promotion.promo.paid === 0 || promotion.promo.total === 0) {
        return original;
      }
      return ((original * promotion.promo.paid) / promotion.promo.total).toFixed(2);
    }
    
    return original;
  };
  const savePromotion = async (product) => {
    const promotion = selectedPromotions[product._id];
    const promo = promotion?.promo;

    const updatedProduct = {
      ...product,
      promoType: promotion?.type,
      promoPlan:
        promotion.type === "quantity" && promo
          ? `${promo.paid}+${promo.total - promo.paid}`
          : "None",
      promoPercentage:
        promotion.type === "percentage" ? promotion.percentage || 0 : 0,
      promoDP: calculatePromotionalPrice(product.dp, promotion),
      promoTP: calculatePromotionalPrice(product.tp, promotion),
      promoStartDate: promotion?.startDate || null,
      promoEndDate: promotion?.endDate || null,
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
      promoType: "none",
      promoPlan: "None",
      promoPercentage: 0,
      promoDP: product.dp,
      promoTP: product.tp,
      promoStartDate: null,
      promoEndDate: null,
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
          type: "quantity",
          promo: null,
          paid: 0,
          free: 0,
          percentage: 0,
          startDate: null,
          endDate: null,
        },
      }));
      fetchProducts();
    } catch (error) {
      console.error("Error removing promotion:", error);
      toast.error("Failed to remove promotion");
    }
  };

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <AdminSidebar />
      <div className="flex-1 p-6">
        <h2 className="text-3xl font-semibold text-gray-800 mb-6">Promotional Management</h2>

        <div className="mb-4">
          <input
            type="text"
            placeholder="Search by product name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-gray-300 p-3 rounded-lg w-full max-w-md shadow-sm"
          />
        </div>

        <div className="overflow-x-auto shadow-md rounded-lg bg-white">
          <table className="min-w-full table-auto text-sm">
            <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
              <tr>
                <th className="p-3 text-left">Product</th>
                <th className="p-3 text-center">DP</th>
                <th className="p-3 text-center">TP</th>
                <th className="p-3 text-center">Promo Type</th>
                <th className="p-3 text-center">Promotion</th>
                <th className="p-3 text-center">Promo DP</th>
                <th className="p-3 text-center">Promo TP</th>
                <th className="p-3 text-center">Validity</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" className="text-center py-6 text-gray-500">
                    Loading products...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-6 text-gray-500">
                    No products found
                  </td>
                </tr>
              ) : (
                products.map((product) => {
                  const promotion = selectedPromotions[product._id] || {};
                  return (
                    <tr
                      key={product._id}
                      className="border-b hover:bg-gray-50 transition duration-200"
                    >
                      <td className="p-3 font-medium text-gray-800">{product.name}</td>
                      <td className="p-3 text-center">{product.dp}</td>
                      <td className="p-3 text-center">{product.tp}</td>
                      <td className="p-3 text-center">
                        <select
                          value={promotion.type}
                          onChange={(e) =>
                            handlePromotionChange(product._id, "type", e.target.value)
                          }
                          className="border rounded px-2 py-1 text-sm"
                        >
                          <option value="quantity">Quantity</option>
                          <option value="percentage">Percentage</option>
                        </select>
                      </td>
                      <td className="p-3 text-center">
                        {promotion.type === "quantity" ? (
                          <div className="flex justify-center space-x-1">
                            <input
                              type="number"
                              min="0"
                              value={promotion.paid || ""}
                              onChange={(e) =>
                                handlePromotionChange(product._id, "paid", e.target.value)
                              }
                              className="w-12 text-center border rounded"
                            />
                            <span className="self-center">+</span>
                            <input
                              type="number"
                              min="0"
                              value={promotion.free || ""}
                              onChange={(e) =>
                                handlePromotionChange(product._id, "free", e.target.value)
                              }
                              className="w-12 text-center border rounded"
                            />
                          </div>
                        ) : (
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={promotion.percentage || ""}
                            onChange={(e) =>
                              handlePromotionChange(
                                product._id,
                                "percentage",
                                e.target.value
                              )
                            }
                            className="w-16 text-center border rounded"
                            placeholder="%"
                          />
                        )}
                      </td>
                      <td className="p-3 text-center">
                        {calculatePromotionalPrice(product.dp, promotion)}
                      </td>
                      <td className="p-3 text-center">
                        {calculatePromotionalPrice(product.tp, promotion)}
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex flex-col space-y-1">
                          <input
                            type="date"
                            value={promotion.startDate || ""}
                            onChange={(e) =>
                              handlePromotionChange(
                                product._id,
                                "startDate",
                                e.target.value
                              )
                            }
                            className="text-sm p-1 border rounded"
                          />
                          <input
                            type="date"
                            value={promotion.endDate || ""}
                            onChange={(e) =>
                              handlePromotionChange(
                                product._id,
                                "endDate",
                                e.target.value
                              )
                            }
                            className="text-sm p-1 border rounded"
                          />
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex justify-center space-x-2">
                          <button
                            onClick={() => savePromotion(product)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded flex items-center space-x-1"
                          >
                            <FaSave />
                            <span>Save</span>
                          </button>
                          <button
                            onClick={() => removePromotion(product)}
                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded flex items-center space-x-1"
                          >
                            <FaTrash />
                            <span>Remove</span>
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

        {!debouncedSearch && !loading && totalPages > 1 && (
          <div className="mt-6 flex justify-center space-x-4">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-gray-700 text-white rounded disabled:opacity-50"
            >
              Previous
            </button>
            <span className="px-4 py-2 bg-gray-200 rounded">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-gray-700 text-white rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
