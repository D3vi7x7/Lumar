import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Home } from './pages/Home';
import { Subject } from './pages/Subject.tsx';
import { TopicPage } from './pages/TopicPage.tsx';

function App() {
  return (
    <Router>
      <nav style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 }}>
        <Link to="/" style={{ fontSize: '1.5rem', fontWeight: 700, fontFamily: 'Space Grotesk', textDecoration: 'none' }}>
          <span className="text-gradient">XR</span> Ency
        </Link>
        <div style={{ display: 'flex', gap: '2rem', fontWeight: 500 }}>
          <Link to="/subject/physics" style={{ transition: 'color 0.2s', textDecoration: 'none' }}>Physics</Link>
          <Link to="/subject/chemistry" style={{ transition: 'color 0.2s', textDecoration: 'none' }}>Chemistry</Link>
        </div>
      </nav>

      <main style={{ minHeight: '100vh', paddingTop: '80px', position: 'relative' }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/subject/:subjectId" element={<Subject />} />
          <Route path="/topic/:subjectId/:topicId" element={<TopicPage />} />
        </Routes>
      </main>
    </Router>
  );
}

export default App;
