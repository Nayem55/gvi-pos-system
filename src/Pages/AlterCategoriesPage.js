import { useState, useEffect } from "react";
import axios from "axios";
import { Edit3 } from "lucide-react";
import toast from "react-hot-toast";
import AdminSidebar from "../Component/AdminSidebar";

const AlterCategoriesPage = () => {
  const [categories, setCategories] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editedName, setEditedName] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await axios.get("https://gvi-pos-server.vercel.app/all-category");
      setCategories(response.data);
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast.error("Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (id) => {
    if (!editedName.trim()) {
      toast.error("Category name cannot be empty");
      return;
    }

    try {
      setLoading(true);
      await axios.put(
        `https://gvi-pos-server.vercel.app/categories/${id}`,
        { name: editedName }
      );
      toast.success("Category updated successfully!");
      setEditingId(null);
      fetchCategories();
    } catch (error) {
      console.error("Error updating category:", error);
      toast.error(error.response?.data?.error || "Failed to update category");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  return (
    <div className="flex">
      <AdminSidebar />
      <div className="p-4 w-full">
        <h2 className="text-2xl font-bold mb-6">Manage Categories</h2>

        <div className="bg-white p-6 rounded-lg shadow-md">
          {loading ? (
            <p>Loading categories...</p>
          ) : categories.length === 0 ? (
            <p>No categories found</p>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border p-2 text-left">Category Name</th>
                  <th className="border p-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((category) => (
                  <tr key={category._id} className="hover:bg-gray-50">
                    <td className="border p-2">
                      {editingId === category._id ? (
                        <input
                          type="text"
                          value={editedName}
                          onChange={(e) => setEditedName(e.target.value)}
                          className="w-full p-2 border rounded"
                        />
                      ) : (
                        category.name
                      )}
                    </td>
                    <td className="border p-2">
                      {editingId === category._id ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleUpdate(category._id)}
                            className="bg-green-600 text-white px-3 py-1 rounded"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => {
                              setEditingId(null);
                              setEditedName("");
                            }}
                            className="bg-gray-300 px-3 py-1 rounded"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingId(category._id);
                            setEditedName(category.name);
                          }}
                          className="text-blue-500 hover:text-blue-700"
                        >
                          <Edit3 size={18} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default AlterCategoriesPage;