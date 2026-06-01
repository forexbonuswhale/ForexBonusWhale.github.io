import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';

const FIREBASE_URL = "https://froexbonuswhale-default-rtdb.firebaseio.com/brokers.json";

export default function BrokerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [broker, setBroker] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchBroker = async () => {
      try {
        setLoading(true);
        console.log(`Fetching broker with ID: ${id}`);
        const res = await fetch(FIREBASE_URL);
        
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        
        const data = await res.json();
        console.log("Firebase data:", data);
        
        let brokers = [];
        if (Array.isArray(data)) {
          brokers = data.filter(b => b !== null && b !== undefined);
        } else if (data && typeof data === 'object') {
          brokers = Object.values(data).filter(b => b !== null && b !== undefined);
        }
        
        console.log("Parsed brokers:", brokers);
        
        // Find the broker by ID - convert both to number for comparison
        const brokerId = parseInt(id, 10);
        const found = brokers.find(b => b && parseInt(b.id, 10) === brokerId);
        
        console.log(`Looking for broker ID: ${brokerId}`);
        console.log("Found broker:", found);
        
        if (found) {
          setBroker(found);
          setError(false);
        } else {
          setError(true);
          setBroker(null);
        }
      } catch (err) {
        console.error('Error fetching broker:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchBroker();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl mb-4">Loading...</div>
        </div>
      </div>
    );
  }

  if (error || !broker) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="text-4xl mb-4">🔍</div>
          <h1 className="text-3xl font-bold text-gray-400 mb-4">Broker not found.</h1>
          <p className="text-gray-500 mb-8">The broker you're looking for could not be found. Try searching again.</p>
          <Link 
            to="/" 
            className="inline-block bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-3 px-6 rounded-lg transition"
          >
            ← Go back home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 text-white">
      {/* Header */}
      <header className="border-b border-slate-700 bg-slate-900 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold text-yellow-500">ForexBonusWhale</Link>
          <Link to="/" className="text-sm text-gray-400 hover:text-white transition">← Back</Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        {/* Broker Header */}
        <div className="mb-8 pb-8 border-b border-slate-700">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-5xl font-bold mb-2">{broker.name}</h1>
              <p className="text-3xl font-bold text-yellow-500 mb-4">Bonus: {broker.bonusAmount}</p>
            </div>
            <span className={`px-4 py-2 rounded-lg font-bold text-sm ${
              broker.status === 'active' 
                ? 'bg-green-900 text-green-300 border border-green-700' 
                : 'bg-red-900 text-red-300 border border-red-700'
            }`}>
              {broker.status === 'active' ? '● Active' : '● Inactive'}
            </span>
          </div>
        </div>

        {/* Category Badge */}
        <div className="mb-8">
          <span className={`inline-block px-4 py-2 rounded-lg font-bold text-sm ${
            broker.category === 'no_deposit' ? 'bg-blue-900 text-blue-300' :
            broker.category === 'deposit' ? 'bg-purple-900 text-purple-300' :
            'bg-pink-900 text-pink-300'
          }`}>
            {broker.category === 'no_deposit' ? 'No Deposit' : 
             broker.category === 'deposit' ? 'Deposit Bonus' : 'Contest'}
          </span>
        </div>

        {/* Rules Section */}
        <div className="mb-12 bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h2 className="text-2xl font-bold mb-4 text-yellow-500">Bonus Details</h2>
          <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">{broker.rules}</p>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 gap-6 mb-12 md:grid-cols-3">
          <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
            <p className="text-gray-400 text-sm mb-2">Views</p>
            <p className="text-2xl font-bold text-yellow-500">👁 {(broker.viewCount || 0).toLocaleString()}</p>
          </div>
          
          <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
            <p className="text-gray-400 text-sm mb-2">Rating</p>
            <p className="text-2xl font-bold text-yellow-500">
              {broker.ratingAvg > 0 ? `★ ${broker.ratingAvg.toFixed(2)}` : 'No ratings yet'}
            </p>
          </div>

          {broker.ratingCount > 0 && (
            <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
              <p className="text-gray-400 text-sm mb-2">Reviews</p>
              <p className="text-2xl font-bold text-yellow-500">{broker.ratingCount}</p>
            </div>
          )}
        </div>

        {/* Action Button */}
        {broker.link && (
          <div className="mb-12">
            <a 
              href={broker.link} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-block w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-4 px-6 rounded-lg text-center transition text-lg"
            >
              Visit {broker.name} →
            </a>
          </div>
        )}

        {/* Back Button */}
        <div className="text-center">
          <Link 
            to="/" 
            className="inline-block text-yellow-500 hover:text-yellow-400 font-semibold transition"
          >
            ← Return to all brokers
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-700 bg-slate-900 mt-20 py-8 text-center text-gray-500 text-sm">
        <p>© 2026 ForexBonusWhale. All rights reserved.</p>
        <p className="mt-2">Trading forex involves risk. Bonus offers are subject to terms.</p>
      </footer>
    </div>
  );
}
