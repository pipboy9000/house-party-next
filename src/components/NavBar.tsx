import UserProfile from "./UserProfile";

export default function NavBar() {
    return (
        <nav className="flex items-center justify-between p-4 bg-slate-900 border-b border-slate-800 text-white">
            <div className="font-bold text-xl tracking-tight">
                House Party 🏠
            </div>

            <UserProfile />
        </nav>
    );
}