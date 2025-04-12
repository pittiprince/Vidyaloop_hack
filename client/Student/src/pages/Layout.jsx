import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";

export default function Layout() {
    return (
        <>
            <div className="grid grid-cols-12 grid-rows-1 h-full w-full">
                <div className="col-span-12 md:col-span-3 lg:col-span-2 w-full h-full">
                    <Sidebar />
                </div>
                <div className="col-span-12 md:col-span-9 lg:col-span-10">
                    <Outlet />
                </div>
            </div>
        </>
    );
}