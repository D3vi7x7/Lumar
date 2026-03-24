import React from 'react';
import { Link } from 'react-router-dom';
import { Atom, Zap } from 'lucide-react';

export const Home: React.FC = () => {
  return (
    <div className="container animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', textAlign: 'center' }}>
      <div style={{ padding: '3rem', borderRadius: '100px', background: 'rgba(0, 240, 255, 0.05)', marginBottom: '2rem', border: '1px solid rgba(0, 240, 255, 0.2)' }}>
        <Atom size={64} color="var(--accent-cyan)" />
      </div>
      <h1 style={{ fontSize: '4rem', marginBottom: '1rem', letterSpacing: '-0.02em' }}>
        Discover Science in <span className="text-gradient">3D & AR</span>
      </h1>
      <p style={{ fontSize: '1.25rem', color: 'var(--text-muted)', maxWidth: '600px', marginBottom: '4rem' }}>
        Explore physics and chemistry concepts from Class 6 and 7 through interactive 3D models. Step into the future of learning with WebXR augmented reality.
      </p>
      
      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link to="/subject/physics" className="glass-panel" style={{ padding: '3rem', width: '320px', textDecoration: 'none', transition: 'all 0.3s ease', display: 'flex', flexDirection: 'column', alignItems: 'center', borderTop: '2px solid rgba(0, 71, 255, 0.4)' }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-10px)'; e.currentTarget.style.boxShadow = '0 20px 40px -10px rgba(0, 71, 255, 0.3)'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 32px 0 rgba(0, 0, 0, 0.3)'; }}>
          <Zap size={48} color="var(--accent-blue)" style={{ marginBottom: '1.5rem' }} />
          <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Physics</h2>
          <p style={{ color: 'var(--text-muted)' }}>Forces, motion, and the universe.</p>
        </Link>
        
        <Link to="/subject/chemistry" className="glass-panel" style={{ padding: '3rem', width: '320px', textDecoration: 'none', transition: 'all 0.3s ease', display: 'flex', flexDirection: 'column', alignItems: 'center', borderTop: '2px solid rgba(138, 43, 226, 0.4)' }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-10px)'; e.currentTarget.style.boxShadow = '0 20px 40px -10px rgba(138, 43, 226, 0.3)'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 32px 0 rgba(0, 0, 0, 0.3)'; }}>
          <Atom size={48} color="var(--accent-purple)" style={{ marginBottom: '1.5rem' }} />
          <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Chemistry</h2>
          <p style={{ color: 'var(--text-muted)' }}>Atoms, molecules, and reactions.</p>
        </Link>
      </div>
    </div>
  );
};
