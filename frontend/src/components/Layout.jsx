import { Link, Outlet, useLocation } from 'react-router-dom';
import { Activity, Beaker } from 'lucide-react';

export default function Layout() {
    const location = useLocation();

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans">
            <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <img 
                            src="https://upload.wikimedia.org/wikipedia/commons/e/e3/Amazon_Prime_Logo.svg" 
                            alt="Amazon Prime" 
                            className="h-6 brightness-0 invert opacity-90"
                        />
                        <div className="h-6 w-px bg-zinc-800 mx-2"></div>
                        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500 tracking-tight">
                            Fraud Shield
                        </h1>
                    </div>
                    
                    <nav className="flex space-x-1 bg-zinc-900 p-1 rounded-lg border border-zinc-800">
                        <Link 
                            to="/" 
                            className={`flex items-center space-x-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${location.pathname === '/' ? 'bg-zinc-800 text-cyan-400 shadow-sm' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'}`}
                        >
                            <Activity size={16} />
                            <span>Live Stream</span>
                        </Link>
                        <Link 
                            to="/manual" 
                            className={`flex items-center space-x-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${location.pathname === '/manual' ? 'bg-zinc-800 text-cyan-400 shadow-sm' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'}`}
                        >
                            <Beaker size={16} />
                            <span>Sandbox</span>
                        </Link>
                    </nav>
                </div>
            </header>

            <main className="max-w-7xl mx-auto p-6 mt-4">
                <Outlet />
            </main>
        </div>
    );
}
