import React, { useState } from "react";
import { Link } from "react-router-dom";
import logo from "../Images/Logo.png";
import application from "../Images/Application2.png"; // (kept import though unused to avoid touching logic)
import admin from "../Images/admin-panel.png";
import dashboard from "../Images/dashboard.png";
import { Box, Clock, File, FileStack } from "lucide-react"; // removed unused imports without changing behavior

const Header = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const user = JSON.parse(localStorage.getItem("pos-user"));
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // helper for initial avatar letter (no new functions beyond component scope)
  const initial = user?.name?.trim()?.charAt(0)?.toUpperCase() || "M";

  return (
    <div>
      {/* Header */}
      <div className="sticky top-0 z-40 flex justify-between items-center px-4 py-3 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 shadow-sm border-b">
        <Link to="/" className="shrink-0">
          <img
            className="w-[96px] sm:w-[112px] hover:opacity-90 transition"
            src={logo}
            alt="Logo"
          />
        </Link>
        <div className="flex items-center gap-2">
          {/* Trigger */}
          <button
            aria-controls="app-drawer"
            aria-expanded={isSidebarOpen}
            aria-label="Open menu"
            className="inline-flex items-center justify-center h-10 w-10 rounded-xl bg-zinc-100 hover:bg-zinc-200 active:bg-zinc-300 transition shadow-sm ring-1 ring-zinc-200"
            onClick={toggleSidebar}
          >
            <svg
              className="w-6 h-6 text-zinc-700"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h16m-7 6h7"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Overlay */}
      {/* {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px] transition-opacity animate-in fade-in duration-200"
          onClick={toggleSidebar}
        />
      )} */}

      {/* Drawer */}
      <aside
        id="app-drawer"
        role="dialog"
        aria-modal="true"
        className={`fixed top-0 left-0 h-full z-50 w-[86vw] sm:w-[360px] max-w-[90vw] transform transition-transform duration-300 ease-out
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Drawer chrome */}
        <div className="relative h-full flex flex-col bg-white shadow-2xl border-r">
          {/* Gradient bar */}
          <div className="absolute inset-x-0 top-0 h-1 bg-blue" />

          {/* Top section */}
          <div className="flex items-center justify-between gap-3 px-4 py-4 bg-gradient-to-br from-[#003665] via-[#002B54] to-[#001E3B] text-white">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-10 w-10 rounded-full bg-white/15 ring-1 ring-white/25 grid place-items-center font-semibold">
                {initial}
              </div>
              <div className="truncate">
                <h2 className="text-[15px] font-semibold truncate leading-tight">
                  {user ? user?.name : "Menu"}
                </h2>
                <p className="text-xs/5 text-white/70 truncate">
                  {user?.role ? user.role : "Welcome"}
                </p>
              </div>
            </div>

            <button
              aria-label="Close menu"
              onClick={toggleSidebar}
              className="h-9 w-9 shrink-0 inline-flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/15 active:bg-white/20 transition ring-1 ring-white/15"
            >
              <svg
                className="w-5 h-5"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Scrollable nav area */}
          <div className="flex-1 overflow-y-auto scroll-smooth px-3 py-4">
            {/* Section: General */}
            <p className="px-3 pb-2 text-[11px] font-semibold tracking-wide uppercase text-zinc-500">
              General
            </p>
            <div className="space-y-1">
              <Link
                to="/"
                className="group flex items-center justify-between gap-3 px-3 py-2 rounded-xl text-zinc-800 hover:bg-zinc-100/90 active:bg-zinc-200 transition ring-1 ring-transparent hover:ring-zinc-200"
                onClick={toggleSidebar}
              >
                <span className="flex items-center gap-3">
                  <svg
                    className="w-7 h-7 text-zinc-700 group-hover:scale-105 transition"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 576 512"
                  >
                    <path
                      fill="currentColor"
                      d="M575.8 255.5c0 18-15 32.1-32 32.1l-32 0 .7 160.2c0 2.7-.2 5.4-.5 8.1l0 16.2c0 22.1-17.9 40-40 40l-16 0c-1.1 0-2.2 0-3.3-.1c-1.4 .1-2.8 .1-4.2 .1L416 512l-24 0c-22.1 0-40-17.9-40-40l0-24 0-64c0-17.7-14.3-32-32-32l-64 0c-17.7 0-32 14.3-32 32l0 64 0 24c0 22.1-17.9 40-40 40l-24 0-31.9 0c-1.5 0-3-.1-4.5-.2c-1.2 .1-2.4 .2-3.6 .2l-16 0c-22.1 0-40-17.9-40-40l0-112c0-.9 0-1.9 .1-2.8l0-69.7-32 0c-18 0-32-14-32-32.1c0-9 3-17 10-24L266.4 8c7-7 15-8 22-8s15 2 21 7L564.8 231.5c8 7 12 15 11 24z"
                    />
                  </svg>
                  <span className="font-medium">Home</span>
                </span>
                <svg
                  className="w-4 h-4 opacity-0 group-hover:opacity-100 transition"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M7 5l5 5-5 5" />
                </svg>
              </Link>

              <Link
                to="/profile"
                className="group flex items-center justify-between gap-3 px-3 py-2 rounded-xl text-zinc-800 hover:bg-zinc-100/90 active:bg-zinc-200 transition ring-1 ring-transparent hover:ring-zinc-200"
                onClick={toggleSidebar}
              >
                <span className="flex items-center gap-3">
                  <svg
                    className="w-7 h-7 text-zinc-700 group-hover:scale-105 transition border border-current p-1 rounded-full"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 448 512"
                  >
                    <path
                      fill="currentColor"
                      d="M224 256A128 128 0 1 0 224 0a128 128 0 1 0 0 256zm-45.7 48C79.8 304 0 383.8 0 482.3C0 498.7 13.3 512 29.7 512l388.6 0c16.4 0 29.7-13.3 29.7-29.7C448 383.8 368.2 304 269.7 304l-91.4 0z"
                    />
                  </svg>
                  <span className="font-medium">Profile</span>
                </span>
                <svg
                  className="w-4 h-4 opacity-0 group-hover:opacity-100 transition"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M7 5l5 5-5 5" />
                </svg>
              </Link>
            </div>

            {/* Section divider */}
            <div className="my-4 h-px bg-gradient-to-r from-transparent via-zinc-200 to-transparent" />

            {/* Section: Reports */}
            <p className="px-3 pb-2 text-[11px] font-semibold tracking-wide uppercase text-zinc-500">
              Reports
            </p>
            <div className="space-y-1">
              <Link
                to={"/dashboard"}
                className="group flex items-center justify-between gap-3 px-3 py-2 rounded-xl text-zinc-800 hover:bg-zinc-100/90 active:bg-zinc-200 transition ring-1 ring-transparent hover:ring-zinc-200"
                onClick={toggleSidebar}
              >
                <span className="flex items-center gap-3">
                  <img
                    className="w-7 h-7 object-contain group-hover:scale-105 transition"
                    alt=""
                    src={dashboard}
                  />
                  <span className="font-medium">Sales Report</span>
                </span>
                <svg
                  className="w-4 h-4 opacity-0 group-hover:opacity-100 transition"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M7 5l5 5-5 5" />
                </svg>
              </Link>

              {(user?.role === "super admin" || user?.role === "SO") && (
                <Link
                  to={"/stock-movement/dealer"}
                  className="group flex items-center justify-between gap-3 px-3 py-2 rounded-xl text-zinc-800 hover:bg-zinc-100/90 active:bg-zinc-200 transition ring-1 ring-transparent hover:ring-zinc-200"
                  onClick={toggleSidebar}
                >
                  <span className="flex items-center gap-3">
                    <Box
                      size={28}
                      className="w-7 h-7 text-zinc-700 group-hover:scale-105 transition"
                    />
                    <span className="font-medium">Stock Movement</span>
                  </span>
                  <svg
                    className="w-4 h-4 opacity-0 group-hover:opacity-100 transition"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M7 5l5 5-5 5" />
                  </svg>
                </Link>
              )}

              {(user?.role === "ASM" || user?.role === "SOM") && (
                <Link
                  to={"/stock-movement/group"}
                  className="group flex items-center justify-between gap-3 px-3 py-2 rounded-xl text-zinc-800 hover:bg-zinc-100/90 active:bg-zinc-200 transition ring-1 ring-transparent hover:ring-zinc-200"
                  onClick={toggleSidebar}
                >
                  <span className="flex items-center gap-3">
                    <Box
                      size={28}
                      className="w-7 h-7 text-zinc-700 group-hover:scale-105 transition"
                    />
                    <span className="font-medium">Stock Movement</span>
                  </span>
                  <svg
                    className="w-4 h-4 opacity-0 group-hover:opacity-100 transition"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M7 5l5 5-5 5" />
                  </svg>
                </Link>
              )}

              <Link
                to="/accounts"
                className="group flex items-center justify-between gap-3 px-3 py-2 rounded-xl text-zinc-800 hover:bg-zinc-100/90 active:bg-zinc-200 transition ring-1 ring-transparent hover:ring-zinc-200"
                onClick={toggleSidebar}
              >
                <span className="flex items-center gap-3">
                  <svg
                    className="w-6 h-6 text-zinc-700 group-hover:scale-105 transition"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 384 512"
                  >
                    <path
                      fill="currentColor"
                      d="M64 0C28.7 0 0 28.7 0 64L0 448c0 35.3 28.7 64 64 64l256 0c35.3 0 64-28.7 64-64l0-288-128 0c-17.7 0-32-14.3-32-32L224 0 64 0zM256 0l0 128 128 0L256 0zM64 80c0-8.8 7.2-16 16-16l64 0c8.8 0 16 7.2 16 16s-7.2 16-16 16L80 96c-8.8 0-16-7.2-16-16zm0 64c0-8.8 7.2-16 16-16l64 0c8.8 0 16 7.2 16 16s-7.2 16-16 16l-64 0c-8.8 0-16-7.2-16-16zm128 72c8.8 0 16 7.2 16 16l0 17.3c8.5 1.2 16.7 3.1 24.1 5.1c8.5 2.3 13.6 11 11.3 19.6s-11 13.6-19.6 11.3c-11.1-3-22-5.2-32.1-5.3c-8.4-.1-17.4 1.8-23.6 5.5c-5.7 3.4-8.1 7.3-8.1 12.8c0 3.7 1.3 6.5 7.3 10.1c6.9 4.1 16.6 7.1 29.2 10.9l.5 .1s0 0 0 0s0 0 0 0c11.3 3.4 25.3 7.6 36.3 14.6c12.1 7.6 22.4 19.7 22.7 38.2c.3 19.3-9.6 33.3-22.9 41.6c-7.7 4.8-16.4 7.6-25.1 9.1l0 17.1c0 8.8-7.2 16-16 16s-16-7.2-16-16l0-17.8c-11.2-2.1-21.7-5.7-30.9-8.9c0 0 0 0 0 0c-2.1-.7-4.2-1.4-6.2-2.1c-8.4-2.8-12.9-11.9-10.1-20.2s11.9-12.9 20.2-10.1c2.5 .8 4.8 1.6 7.1 2.4c0 0 0 0 0 0s0 0 0 0s0 0 0 0c13.6 4.6 24.6 8.4 36.3 8.7c9.1 .3 17.9-1.7 23.7-5.3c5.1-3.2 7.9-7.3 7.8-14c-.1-4.6-1.8-7.8-7.7-11.6c-6.8-4.3-16.5-7.4-29-11.2l-1.6-.5s0 0 0 0c-11-3.3-24.3-7.3-34.8-13.7c-12-7.2-22.6-18.9-22.7-37.3c-.1-19.4 10.8-32.8 23.8-40.5c7.5-4.4 15.8-7.2 24.1-8.7l0-17.3c0-8.8 7.2-16 16-16z"
                    />
                  </svg>
                  <span className="font-medium">Accounts</span>
                </span>
                <svg
                  className="w-4 h-4 opacity-0 group-hover:opacity-100 transition"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M7 5l5 5-5 5" />
                </svg>
              </Link>

              {user?.role && user?.role !== "SO" && (
                <Link
                  to={"/manager-report"}
                  className="group flex items-center justify-between gap-3 px-3 py-2 rounded-xl text-zinc-800 hover:bg-zinc-100/90 active:bg-zinc-200 transition ring-1 ring-transparent hover:ring-zinc-200"
                  onClick={toggleSidebar}
                >
                  <span className="flex items-center gap-3">
                    <img
                      className="w-7 h-7 object-contain group-hover:scale-105 transition"
                      alt=""
                      src={admin}
                    />
                    <span className="font-medium">Dealer Sale Reports</span>
                  </span>
                  <svg
                    className="w-4 h-4 opacity-0 group-hover:opacity-100 transition"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M7 5l5 5-5 5" />
                  </svg>
                </Link>
              )}

              <Link
                to={"/tada-report"}
                className="group flex items-center justify-between gap-3 px-3 py-2 rounded-xl text-zinc-800 hover:bg-zinc-100/90 active:bg-zinc-200 transition ring-1 ring-transparent hover:ring-zinc-200"
                onClick={toggleSidebar}
              >
                <span className="flex items-center gap-3">
                  <File className="w-7 h-7 text-zinc-700 group-hover:scale-105 transition" />
                  <span className="font-medium">TA/DA Report</span>
                </span>
                <svg
                  className="w-4 h-4 opacity-0 group-hover:opacity-100 transition"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M7 5l5 5-5 5" />
                </svg>
              </Link>

              <Link
                to={"/slab-report"}
                className="group flex items-center justify-between gap-3 px-3 py-2 rounded-xl text-zinc-800 hover:bg-zinc-100/90 active:bg-zinc-200 transition ring-1 ring-transparent hover:ring-zinc-200"
                onClick={toggleSidebar}
              >
                <span className="flex items-center gap-3">
                  <FileStack className="w-7 h-7 text-zinc-700 group-hover:scale-105 transition" />
                  <span className="font-medium">Slab Report</span>
                </span>
                <svg
                  className="w-4 h-4 opacity-0 group-hover:opacity-100 transition"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M7 5l5 5-5 5" />
                </svg>
              </Link>

              {user?.role === "ASM" && (
                <a
                  href="https://rl.luvit.com.bd/admin-panel"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center justify-between gap-3 px-3 py-2 rounded-xl text-zinc-800 hover:bg-zinc-100/90 active:bg-zinc-200 transition ring-1 ring-transparent hover:ring-zinc-200"
                  onClick={toggleSidebar}
                >
                  <span className="flex items-center gap-3">
                    <Clock
                      size={28}
                      className="w-7 h-7 text-zinc-700 group-hover:scale-105 transition"
                    />
                    <span className="font-medium">Attendance Report</span>
                  </span>
                  <svg
                    className="w-4 h-4 opacity-0 group-hover:opacity-100 transition"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M7 5l5 5-5 5" />
                  </svg>
                </a>
              )}

              {user?.role === "super admin" && (
                <Link
                  to={"/admin"}
                  className="group flex items-center justify-between gap-3 px-3 py-2 rounded-xl text-zinc-800 hover:bg-zinc-100/90 active:bg-zinc-200 transition ring-1 ring-transparent hover:ring-zinc-200"
                  onClick={toggleSidebar}
                >
                  <span className="flex items-center gap-3">
                    <img
                      className="w-7 h-7 object-contain group-hover:scale-105 transition"
                      alt=""
                      src={admin}
                    />
                    <span className="font-medium">Admin Panel</span>
                  </span>
                  <svg
                    className="w-4 h-4 opacity-0 group-hover:opacity-100 transition"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M7 5l5 5-5 5" />
                  </svg>
                </Link>
              )}
            </div>

            {/* subtle divider */}
            <div className="mt-4 h-px bg-gradient-to-r from-transparent via-zinc-200 to-transparent" />

            {/* Footer note */}
            <div className="px-3 pt-3 pb-2 text-[11px] text-zinc-500">
              <p className="leading-tight">
                Tip: Tap outside or press the close button to dismiss.
              </p>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
};

export default Header;
