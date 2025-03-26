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
      setProducts(response.data.products);
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
      fetchProducts();
    } catch (error) {
      console.error("Error saving promotion:", error);
    }
  };

  return (
    <div className="flex">
      <AdminSidebar />
      <div className="p-6 w-full max-w-6xl mx-auto bg-white shadow-lg rounded-lg">
        <h2 className="text-3xl font-bold mb-6 text-gray-800">Promotional Page</h2>
        <table className="w-full border border-gray-300 shadow-sm rounded-lg">
          <thead>
            <tr className="bg-gray-700 text-white">
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
              const existingPromo = promotions.find(
                (p) => p.label === product.promoPlan
              );
              const promo = selectedPromotions[product._id] || existingPromo?.value || null;

              return (
                <tr key={product._id} className="text-left border">
                  <td className="p-3 border">{product.name}</td>
                  <td className="p-3 border">{product.dp}</td>
                  <td className="p-3 border">{product.tp}</td>
                  <td className="p-3 border">{product.mrp}</td>
                  <td className="p-3 border">
                    <select
                      className="border p-2 rounded w-full"
                      value={existingPromo?.label || "None"}
                      onChange={(e) =>
                        handlePromotionChange(
                          product._id,
                          promotions.find((p) => p.label === e.target.value)?.value
                        )
                      }
                    >
                      {promotions.map((p) => (
                        <option key={p.label} value={p.label}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="p-3 border">
                    {calculatePromotionalPrice(product.dp, promo) || product.promoDP}
                  </td>
                  <td className="p-3 border">
                    {calculatePromotionalPrice(product.tp, promo) || product.promoTP}
                  </td>
                  <td className="p-3 border">
                    <button
                      className="bg-gray-800 text-white px-5 py-2 rounded hover:bg-green-600 transition"
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