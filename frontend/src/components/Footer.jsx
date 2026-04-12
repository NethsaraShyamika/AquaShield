export default function Footer() {
  return (
    <footer className="bg-slate-900 text-white mt-auto">
      <div className="max-w-7xl mx-auto px-6 py-8 text-center space-y-4">
        
        <h2 className="text-xl font-semibold">AquaShield</h2>
        
        <p className="text-gray-400 text-sm">
          Protecting Sri Lanka’s marine life through community-powered reporting.
        </p>
        <p className="text-xs text-gray-500">
          © {new Date().getFullYear()} AquaShield. All rights reserved.
        </p>
      </div>
    </footer>
  );
}