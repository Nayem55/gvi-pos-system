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

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await axios.get(
        "https://gvi-pos-server.vercel.app/products"
      );
      const productsData = response.data.products;

      // Initialize the selectedPromotions state with existing promo plans
      const initialPromotions = {};
      productsData.forEach((product) => {
        const existingPromo = promotions.find(
          (p) =>
            p.value &&
            p.value.paid === parseInt(product.promoPlan?.split("+")[0])
        );
        initialPromotions[product._id] = existingPromo ? existingPromo.value : null;
      });

      setProducts(productsData);
      setSelectedPromotions(initialPromotions);
    } catch (error) {
      console.error("Error fetching products:", error);
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
      fetchProducts(); // Refresh product list after saving
    } catch (error) {
      console.error("Error saving promotion:", error);
    }
  };

  return (
    <div className="flex">
      {/* Admin Sidebar */}
      <AdminSidebar />

      <div className="p-6 max-w-6xl mx-auto bg-white shadow-lg rounded-lg flex-grow">
        <h2 className="text-2xl font-bold mb-4">Promotional Page</h2>
        <table className="w-full border border-gray-300">
          <thead>
            <tr className="bg-gray-200">
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
            {products.map((product) => {
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
                          ? promotions.find((p) => p.value?.paid === promo.paid)?.label
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
                    >
                      Save
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
