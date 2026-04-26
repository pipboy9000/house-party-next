import UserProfile from "./UserProfile";

export default function NavBar() {

    return (
        <nav className="h-20 sticky top-0 flex items-center justify-between p-4 bg-slate-900 border-b border-slate-800 text-white z-10 shadow-slate-800">
            <a href="/">
                <img src="logo.svg" alt="house party logo" className="max-w-15" />
            </a>
            <UserProfile />
        </nav>
    );
}