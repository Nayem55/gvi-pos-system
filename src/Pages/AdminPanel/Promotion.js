import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import AdminSidebar from "../../Component/AdminSidebar";

const promotions = [
  { label: "None", value: null },
  { label: "12+1", value: { total: 13, paid: 12 } },
  { label: "6+1", value: { total: 7, paid: 6 } },
  { label: "8+1", value: { total: 9, paid: 8 } },
];

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
        const promoText = product.promoPlan;
        const matched = promotions.find(
          (p) =>
            p.value &&
            promoText === `${p.value.paid}+${p.value.total - p.value.paid}`
        );
        initialPromotions[product._id] = matched ? matched.value : null;
      });

      setSelectedPromotions(initialPromotions);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePromotionChange = (productId, promo) => {
    setSelectedPromotions((prev) => ({ ...prev, [productId]: promo }));
  };

  const calculatePromotionalPrice = (original, promo) => {
    if (!promo) return original;
    return ((original * promo.paid) / promo.total).toFixed(2);
  };

  const savePromotion = async (product) => {
    const promo = selectedPromotions[product._id];
    const updatedProduct = {
      ...product,
      promoPlan: promo ? `${promo.paid}+${promo.total - promo.paid}` : "None",
      promoDP: calculatePromotionalPrice(product.dp, promo),
      promoTP: calculatePromotionalPrice(product.tp, promo),
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
    }
  };

  return (
    <div className="flex">
      <AdminSidebar />
      <div className="p-6 w-full max-w-7xl mx-auto">
        <h2 className="text-2xl font-bold mb-6">Promotional Page</h2>

        {/* Search bar */}
        <div className="flex items-center mb-6 max-w-md">
          <input
            type="text"
            placeholder="Search by product name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="mr-2 border border-[#cccccc] py-1 px-2 w-[400px]"
          />
        </div>

        {/* Product Table */}
        <div className="overflow-auto rounded border shadow-sm">
          <table className="w-full table-auto border border-gray-300">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 border">Product</th>
                <th className="p-3 border">DP</th>
                <th className="p-3 border">TP</th>
                <th className="p-3 border">MRP</th>
                <th className="p-3 border">Promotion</th>
                <th className="p-3 border">Promo DP</th>
                <th className="p-3 border">Promo TP</th>
                <th className="p-3 border">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="text-center py-6">
                    <div className="flex justify-center items-center space-x-2">
                      <div className="w-6 h-6 border-4 border-blue-500 border-dashed rounded-full animate-spin"></div>
                      <span className="text-gray-600">Loading products...</span>
                    </div>
                  </td>
                </tr>
              ) : (
                products.map((product) => {
                  const promo = selectedPromotions[product._id] || null;
                  return (
                    <tr key={product._id} className="text-left border">
                      <td className="p-3 border">{product.name}</td>
                      <td className="p-3 border">{product.dp}</td>
                      <td className="p-3 border">{product.tp}</td>
                      <td className="p-3 border">{product.mrp}</td>
                      <td className="p-3 border">
                        <select
                          className="border p-2 rounded w-full"
                          value={
                            promo
                              ? promotions.find(
                                  (p) => p.value?.paid === promo.paid
                                )?.label
                              : "None"
                          }
                          onChange={(e) => {
                            const selectedPromo = promotions.find(
                              (p) => p.label === e.target.value
                            )?.value;
                            handlePromotionChange(product._id, selectedPromo);
                          }}
                        >
                          {promotions.map((p) => (
                            <option key={p.label} value={p.label}>
                              {p.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="p-3 border">
                        {calculatePromotionalPrice(product.dp, promo)}
                      </td>
                      <td className="p-3 border">
                        {calculatePromotionalPrice(product.tp, promo)}
                      </td>
                      <td className="p-3 border">
                        <button
                          className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-green-600 transition"
                          onClick={() => savePromotion(product)}
                          disabled={loading}
                        >
                          Save
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!debouncedSearch && !loading && (
          <div className="mt-6 flex justify-center gap-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="bg-[#1F2937] text-white px-2 py-1 w-[90px] hover:bg-[#364EA2] ease-in-out duration-200"
            >
              Previous
            </button>
            <span className="px-4 py-2 border rounded">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
              className="bg-[#1F2937] text-white px-2 py-1 w-[90px] hover:bg-[#364EA2] ease-in-out duration-200"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
