import { useState } from "react";
import axios from "axios";
import { PlusCircle } from "lucide-react";
import toast from "react-hot-toast";
import AdminSidebar from "../Component/AdminSidebar";

const CreateUserPage = () => {
  const [newUser, setNewUser] = useState({
    name: "",
    number: "",
    password: "",
    role: "",
    group: "",
    zone: "",
    outlet: "",
    asm: "",
    rsm: "",
    som: "",
  });
  const [loading, setLoading] = useState(false);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post("https://gvi-pos-server.vercel.app/api/users", newUser);
      toast.success("User created successfully!");
      setNewUser({
        name: "",
        number: "",
        password: "",
        role: "",
        group: "",
        zone: "",
        outlet: "",
        asm: "",
        rsm: "",
        som: "",
      });
    } catch (error) {
      console.error("Error creating user:", error);
      toast.error("Failed to create user.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex">
      <AdminSidebar />
      <div className="p-4 w-full">
        <h2 className="text-2xl font-bold mb-4">Create New User</h2>

        <form onSubmit={handleCreateUser} className="bg-white p-6 rounded-lg shadow-md">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Name</label>
              <input
                type="text"
                value={newUser.name}
                onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                required
                className="w-full p-2 border rounded"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Phone Number</label>
              <input
                type="tel"
                value={newUser.number}
                onChange={(e) => setNewUser({...newUser, number: e.target.value})}
                required
                className="w-full p-2 border rounded"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Password</label>
              <input
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                required
                className="w-full p-2 border rounded"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Role</label>
              <input
                type="text"
                value={newUser.role}
                onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                required
                className="w-full p-2 border rounded"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Group</label>
              <input
                type="text"
                value={newUser.group}
                onChange={(e) => setNewUser({...newUser, group: e.target.value})}
                className="w-full p-2 border rounded"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Zone</label>
              <input
                type="text"
                value={newUser.zone}
                onChange={(e) => setNewUser({...newUser, zone: e.target.value})}
                className="w-full p-2 border rounded"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Outlet</label>
              <input
                type="text"
                value={newUser.outlet}
                onChange={(e) => setNewUser({...newUser, outlet: e.target.value})}
                className="w-full p-2 border rounded"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">ASM</label>
              <input
                type="text"
                value={newUser.asm}
                onChange={(e) => setNewUser({...newUser, asm: e.target.value})}
                className="w-full p-2 border rounded"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">RSM</label>
              <input
                type="text"
                value={newUser.rsm}
                onChange={(e) => setNewUser({...newUser, rsm: e.target.value})}
                className="w-full p-2 border rounded"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">SOM</label>
              <input
                type="text"
                value={newUser.som}
                onChange={(e) => setNewUser({...newUser, som: e.target.value})}
                className="w-full p-2 border rounded"
              />
            </div>
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-md flex items-center gap-2"
          >
            <PlusCircle size={18} />
            {loading ? "Creating..." : "Create User"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateUserPage;