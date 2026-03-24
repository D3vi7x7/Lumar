import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { encyclopediaData } from '../data/mockData';
import { ModelViewer } from '../components/ModelViewer';
import { ArrowLeft, Lightbulb } from 'lucide-react';

export const TopicPage: React.FC = () => {
  const { subjectId, topicId } = useParams<{ subjectId: string, topicId: string }>();
  
  const subject = subjectId ? encyclopediaData[subjectId] : null;
  const topic = subject?.topics.find(t => t.id === topicId);

  if (!topic) return <div className="container" style={{paddingTop: '4rem'}}>Topic not found</div>;

  return (
    <div className="container animate-fade-in" style={{ paddingTop: '2rem', display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 80px)' }}>
      <Link to={`/subject/${subjectId}`} style={{ display: 'inline-flex', alignItems: 'center', color: 'var(--text-muted)', marginBottom: '1.5rem', textDecoration: 'none', transition: 'color 0.2s', alignSelf: 'flex-start' }} onMouseEnter={(e) => e.currentTarget.style.color = '#fff'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}>
        <ArrowLeft size={18} style={{ marginRight: '0.5rem' }} /> Back to {subject?.title}
      </Link>
      
      <div style={{ display: 'flex', gap: '3rem', flexGrow: 1, paddingBottom: '3rem', flexWrap: 'wrap' }}>
        {/* Left Side: Content */}
        <div style={{ flex: '1', display: 'flex', flexDirection: 'column', minWidth: '300px' }}>
          <h1 className="text-gradient" style={{ fontSize: '3rem', marginBottom: '1.5rem' }}>{topic.title}</h1>
          <p style={{ fontSize: '1.25rem', color: 'var(--text-main)', marginBottom: '2.5rem', lineHeight: '1.8' }}>
            {topic.description}
          </p>
          
          <div className="glass-panel" style={{ padding: '2rem', marginTop: 'auto', borderLeft: `4px solid ${subjectId === 'physics' ? 'var(--accent-cyan)' : 'var(--accent-purple)'}` }}>
            <h3 style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem', color: subjectId === 'physics' ? 'var(--accent-cyan)' : 'var(--accent-purple)' }}>
              <Lightbulb size={24} style={{ marginRight: '0.5rem' }} /> Fun Fact
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', lineHeight: '1.6' }}>{topic.funFact}</p>
          </div>
        </div>
        
        {/* Right Side: 3D AR Viewer */}
        <div style={{ flex: '1.5', minWidth: '350px', minHeight: '500px', display: 'flex', flexDirection: 'column' }}>
           <ModelViewer modelType={topic.modelType} />
        </div>
      </div>
    </div>
  );
};
