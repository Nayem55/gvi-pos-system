import { useEffect, useState } from "react";
import axios from "axios";
import { Pencil } from "lucide-react";
import toast from "react-hot-toast";
import AdminSidebar from "../Component/AdminSidebar";

const AlterUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await axios.get("https://gvi-pos-server.vercel.app/getAllUser");
      setUsers(response.data);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load users.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleInputChange = (e, field) => {
    setEditingUser({...editingUser, [field]: e.target.value});
  };

  const handleUpdateUser = async () => {
    setUpdating(true);
    try {
      await axios.put(
        `https://gvi-pos-server.vercel.app/updateUser/${editingUser._id}`,
        editingUser
      );
      toast.success("User updated successfully!");
      setEditingUser(null);
      fetchUsers();
    } catch (error) {
      console.error("Error updating user:", error);
      toast.error("Failed to update user.");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="flex">
      <AdminSidebar />
      <div className="p-4 w-full">
        <h2 className="text-2xl font-bold mb-4">Alter Users</h2>

        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border rounded-lg shadow-md">
            <thead className="bg-gray-200 text-left">
              <tr>
                <th className="border p-2">Name</th>
                <th className="border p-2">Phone</th>
                <th className="border p-2">Password</th>
                <th className="border p-2">Role</th>
                <th className="border p-2">Group</th>
                <th className="border p-2">Zone</th>
                <th className="border p-2">Outlet</th>
                <th className="border p-2">ASM</th>
                <th className="border p-2">RSM</th>
                <th className="border p-2">SOM</th>
                <th className="border p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user._id} className="hover:bg-gray-100">
                  <td className="border p-2">
                    {editingUser?._id === user._id ? (
                      <input
                        type="text"
                        value={editingUser.name}
                        onChange={(e) => handleInputChange(e, "name")}
                        className="border p-1 w-full"
                      />
                    ) : (
                      user.name
                    )}
                  </td>
                  <td className="border p-2">
                    {editingUser?._id === user._id ? (
                      <input
                        type="tel"
                        value={editingUser.number}
                        onChange={(e) => handleInputChange(e, "number")}
                        className="border p-1 w-full"
                      />
                    ) : (
                      user.number
                    )}
                  </td>
                  <td className="border p-2">
                    {editingUser?._id === user._id ? (
                      <input
                        type="tel"
                        value={editingUser.password}
                        onChange={(e) => handleInputChange(e, "password")}
                        className="border p-1 w-full"
                      />
                    ) : (
                      user.password
                    )}
                  </td>
                  <td className="border p-2">
                    {editingUser?._id === user._id ? (
                      <input
                        type="text"
                        value={editingUser.role}
                        onChange={(e) => handleInputChange(e, "role")}
                        className="border p-1 w-full"
                      />
                    ) : (
                      user.role
                    )}
                  </td>
                  <td className="border p-2">
                    {editingUser?._id === user._id ? (
                      <input
                        type="text"
                        value={editingUser.group || ""}
                        onChange={(e) => handleInputChange(e, "group")}
                        className="border p-1 w-full"
                      />
                    ) : (
                      user.group || ""
                    )}
                  </td>
                  <td className="border p-2">
                    {editingUser?._id === user._id ? (
                      <input
                        type="text"
                        value={editingUser.zone || ""}
                        onChange={(e) => handleInputChange(e, "zone")}
                        className="border p-1 w-full"
                      />
                    ) : (
                      user.zone || ""
                    )}
                  </td>
                  <td className="border p-2">
                    {editingUser?._id === user._id ? (
                      <input
                        type="text"
                        value={editingUser.outlet || ""}
                        onChange={(e) => handleInputChange(e, "outlet")}
                        className="border p-1 w-full"
                      />
                    ) : (
                      user.outlet || ""
                    )}
                  </td>
                  <td className="border p-2">
                    {editingUser?._id === user._id ? (
                      <input
                        type="text"
                        value={editingUser.asm || ""}
                        onChange={(e) => handleInputChange(e, "asm")}
                        className="border p-1 w-full"
                      />
                    ) : (
                      user.asm || ""
                    )}
                  </td>
                  <td className="border p-2">
                    {editingUser?._id === user._id ? (
                      <input
                        type="text"
                        value={editingUser.rsm || ""}
                        onChange={(e) => handleInputChange(e, "rsm")}
                        className="border p-1 w-full"
                      />
                    ) : (
                      user.rsm || ""
                    )}
                  </td>
                  <td className="border p-2">
                    {editingUser?._id === user._id ? (
                      <input
                        type="text"
                        value={editingUser.som || ""}
                        onChange={(e) => handleInputChange(e, "som")}
                        className="border p-1 w-full"
                      />
                    ) : (
                      user.som || ""
                    )}
                  </td>
                  <td className="border p-2">
                    {editingUser?._id === user._id ? (
                      <button
                        onClick={handleUpdateUser}
                        disabled={updating}
                        className="bg-green-500 text-white px-3 py-1 rounded-md"
                      >
                        {updating ? "Saving..." : "Save"}
                      </button>
                    ) : (
                      <button
                        onClick={() => setEditingUser(user)}
                        className="text-blue-500"
                      >
                        <Pencil size={18} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AlterUsersPage;