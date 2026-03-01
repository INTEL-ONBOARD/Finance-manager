import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function OnboardingPage() {
  const navigate = useNavigate();

  useEffect(() => {
    if (localStorage.getItem('finwise-onboarded') !== 'false') {
      navigate('/', { replace: true });
    }
  }, [navigate]);

  return <div style={{ color: 'var(--text-primary)', padding: 40 }}>Onboarding — coming soon</div>;
}
