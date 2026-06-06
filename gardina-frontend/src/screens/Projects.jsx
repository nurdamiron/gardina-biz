import React from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/navigation/BottomNav';
import Icon from '../components/common/Icon';

const Projects = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-background-light min-h-screen pb-32">
      <header className="sticky top-0 z-20 bg-background-light/95 backdrop-blur-sm px-4 pt-4 pb-3 border-b">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Жобалар</h1>
          <button onClick={() => navigate('/')} className="p-2 rounded-full hover:bg-muted">
            <Icon name="home" />
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-8">
        <Icon name="folder_open" className="text-muted-foreground text-8xl" />
        <h2 className="text-2xl font-bold mt-6">Жобалар</h2>
        <p className="text-text-secondary mt-2 text-center">Бұл бөлім әзірлеу кезеңінде</p>
      </main>

      <BottomNav />
    </div>
  );
};

export default Projects;
